import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { FileProcessor } from '~/lib/.server/file-processing/file-processor';
import { createScopedLogger } from '~/utils/logger';
import { createDataStream } from 'ai';

const logger = createScopedLogger('api.file-input');

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    logger.warn('Invalid request method:', { method: request.method });
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    logger.info('Processing file input request');

    const requestData = await request.json<{
      content: string;
      fileName?: string;
      projectId?: string;
      requirements?: string; // Support 'requirements' field for backward compatibility
    }>();

    // Use either content or requirements field
    const content = requestData.content || requestData.requirements || '';
    const fileName = requestData.fileName || 'webhook-requirements.txt';
    const projectId = requestData.projectId;

    logger.debug('Received file content:', {
      fileName,
      contentLength: content.length,
      projectId: projectId || 'none',
    });

    // Process the file content
    logger.info('Starting file content processing', {
      isExistingProject: !!projectId,
    });

    // Determine if this is for an existing project
    const isExistingProject = !!projectId;

    const { messages, contextOptimization, files } = await FileProcessor.processContent(content, isExistingProject);

    logger.debug('File processing completed:', {
      messageCount: messages.length,
      contextOptimization,
      fileCount: Object.keys(files || {}).length,
      isExistingProject,
    });

    // Create a chat request using the existing chat endpoint
    logger.info('Creating chat request', {
      projectId: projectId || 'none',
    });

    const chatResponse = await fetch(new URL('/api/chat', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        messages,
        contextOptimization,
        files: files || {},
        promptId: 'file-input',
        projectId, // Pass projectId to the chat API if available
      }),
    });

    if (!chatResponse.ok) {
      logger.error('Chat request failed:', {
        status: chatResponse.status,
        statusText: chatResponse.statusText,
      });
      throw new Error('Failed to process chat request');
    }

    logger.info('Chat request successful, streaming response');

    // Create a data stream to handle the response
    const dataStream = createDataStream({
      async execute(dataStream) {
        // Write initial progress message
        dataStream.writeData({
          type: 'progress',
          label: 'file-processing',
          status: 'complete',
          message: isExistingProject ? 'Feature requests processed successfully' : 'File processed successfully',
        });

        // Forward the chat response stream
        const reader = chatResponse.body?.getReader();

        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'message') {
                  dataStream.writeData({
                    type: 'message',
                    role: parsed.role,
                    content: parsed.content,
                  });
                } else if (parsed.type === 'progress') {
                  dataStream.writeData({
                    type: 'progress',
                    label: parsed.label,
                    status: parsed.status,
                    message: parsed.message,
                  });
                } else if (parsed.type === 'codeContext') {
                  // Forward code context updates
                  dataStream.writeData({
                    type: 'codeContext',
                    files: parsed.files,
                  });
                }
              } catch (e) {
                logger.error('Error parsing stream data:', e);
              }
            }
          }
        }

        // Write completion message
        dataStream.writeData({
          type: 'progress',
          label: 'preview',
          status: 'complete',
          message: isExistingProject
            ? 'Feature implementation and deployment complete'
            : 'Code generation and deployment complete',
        });
      },
      onError: (error: any) => {
        logger.error('Error in data stream:', error);
        return `Error: ${error.message}`;
      },
    });

    // Return the data stream
    return new Response(dataStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logger.error('Error processing file input:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to process file input',
      }),
      { status: 500 },
    );
  }
}
