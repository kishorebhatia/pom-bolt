import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { useToast } from '~/components/ui/use-toast';
import { Progress } from '~/components/ui/Progress';
import { createScopedLogger } from '~/utils/logger';
import { useChat } from 'ai/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { FilesStore } from '~/lib/stores/files';
import { webcontainer } from '~/lib/webcontainer';

const logger = createScopedLogger('file-upload');

interface ErrorResponse {
  error?: string;
}

export function FileUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { append, setMessages } = useChat();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      logger.debug('No file selected');
      return;
    }

    logger.info('File upload started:', { fileName: file.name, size: file.size });

    // Validate file type
    if (file.type !== 'text/plain') {
      logger.warn('Invalid file type:', { type: file.type });
      toast('Please upload a text file (.txt)');

      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      logger.warn('File too large:', { size: file.size });
      toast('Please upload a file smaller than 1MB');

      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      logger.debug('Reading file content');

      // Simulate progress for file reading
      const content = await file.text();
      logger.debug('File content read successfully', { contentLength: content.length });
      setProgress(50);

      logger.info('Sending file content to API');

      const response = await fetch('/api/file-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse;
        logger.error('API request failed:', { status: response.status, error: errorData });
        throw new Error(errorData.error || 'Failed to process file');
      }

      // Show workbench and switch to code view
      workbenchStore.showWorkbench.set(true);
      workbenchStore.currentView.set('code');

      // Handle streaming response
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      // Clear existing messages
      setMessages([]);

      // Process the stream
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
                await append({
                  role: parsed.role,
                  content: parsed.content,
                });
              } else if (parsed.type === 'progress') {
                // Update progress based on the stage
                switch (parsed.label) {
                  case 'file-processing':
                    setProgress(50);
                    break;
                  case 'code-generation':
                    setProgress(75);
                    break;
                  case 'deployment':
                    setProgress(90);
                    break;
                  case 'preview':
                    setProgress(100);
                    break;
                }
              } else if (parsed.type === 'codeContext') {
                // Update files store with new files
                const filesStore = new FilesStore(webcontainer);
                filesStore.files.set({
                  ...filesStore.files.get(),
                  ...parsed.files.reduce((acc: Record<string, string>, file: string) => {
                    acc[file] = ''; // The content will be updated by the chat system
                    return acc;
                  }, {}),
                });
              }
            } catch (e) {
              logger.error('Error parsing stream data:', e);
            }
          }
        }
      }

      logger.info('File processed successfully');
      setProgress(100);

      // Show success message and transition to preview
      toast('Your requirements have been processed and code has been generated');
      workbenchStore.currentView.set('preview');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      logger.error('Error during file upload:', error);
      toast(errorMessage);
      workbenchStore.actionAlert.set({
        type: 'error',
        title: 'Error Processing File',
        description: errorMessage,
        source: 'terminal',
        content: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
      logger.debug('File upload process completed');
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="hidden"
          id="file-upload"
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Upload Requirements'}
        </Button>
      </div>
      {isLoading && <Progress value={progress} className="w-full" />}
    </div>
  );
}
