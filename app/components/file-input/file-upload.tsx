import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { useToast } from '~/components/ui/use-toast';
import { Progress } from '~/components/ui/Progress';
import { createScopedLogger } from '~/utils/logger';
import type { RequirementsResponseData } from '~/routes/api.requirements';

const logger = createScopedLogger('file-upload');

interface FileUploadProps {
  onSendMessage?: (event: React.UIEvent, messageInput?: string) => void;
}

export function FileUpload({ onSendMessage }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const [polling, setPolling] = useState(false);

  // Poll for webhook requirements every 3 seconds
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const checkForWebhookRequirements = async () => {
      if (isLoading) {
        return;
      } // Don't poll if already processing something

      try {
        const response = await fetch('/api/requirements');

        if (!response.ok) {
          logger.warn('Requirements API returned non-OK status', { status: response.status });
          return;
        }

        const data = (await response.json()) as RequirementsResponseData;
        logger.debug('Polled requirements API', { hasRequirements: data.hasRequirements, processed: data.processed });

        if (data.hasRequirements && !data.processed && data.content) {
          logger.info('Detected webhook requirements', { timestamp: data.timestamp });
          setPolling(true);
          setIsLoading(true);
          setProgress(50);

          // Process the requirements directly from the first response
          await processRequirements('Webhook requirements', data.content);
        }
      } catch (error) {
        logger.error('Error checking for webhook requirements', { error });
      }
    };

    // Only start polling if we have a message handler
    if (onSendMessage) {
      pollingInterval = setInterval(checkForWebhookRequirements, 3000);
      logger.debug('Started polling for webhook requirements');
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        logger.debug('Stopped polling for webhook requirements');
      }
    };
  }, [onSendMessage, isLoading, toast]);

  const processRequirements = async (source: string, content: string) => {
    logger.info(`Processing requirements from ${source}`, { contentLength: content.length });
    setProgress(80);

    try {
      // Use the chat system's sendMessage handler to process the content
      if (onSendMessage) {
        logger.info('Sending requirements content to chat system');
        onSendMessage({} as React.UIEvent, content);
        logger.info('Requirements processed successfully');
        toast('Your requirements have been processed');

        // Mark as processed to prevent duplicate processing
        if (source === 'Webhook requirements') {
          const response = await fetch('/api/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markAsProcessed: true }),
          });

          if (!response.ok) {
            logger.warn('Failed to mark requirements as processed', { status: response.status });
          } else {
            logger.debug('Requirements marked as processed');
          }
        }
      } else {
        logger.warn('No sendMessage handler provided');
        toast('Could not process requirements. Please try again.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      logger.error('Error during requirements processing', { error });
      toast(errorMessage);
    } finally {
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
        setPolling(false);
        logger.debug('Requirements processing completed');
      }, 500);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      logger.debug('No file selected');
      return;
    }

    logger.info('File upload started', { fileName: file.name, size: file.size });

    // Validate file type
    if (file.type !== 'text/plain') {
      logger.warn('Invalid file type', { type: file.type });
      toast('Please upload a text file (.txt)');

      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      logger.warn('File too large', { size: file.size });
      toast('Please upload a file smaller than 1MB');

      return;
    }

    setIsLoading(true);
    setProgress(50);

    try {
      logger.debug('Reading file content');

      const content = await file.text();
      logger.debug('File content read successfully', { contentLength: content.length });

      await processRequirements(file.name, content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      logger.error('Error during file upload', { error });
      toast(errorMessage);
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Simple manual test function for webhook - can be removed in production
  const testWebhook = async () => {
    try {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test requirements from frontend' }),
      });

      if (response.ok) {
        toast('Test webhook triggered successfully');
      } else {
        const data = (await response.json()) as { error?: string };
        toast(`Test webhook failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast(`Test webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          {isLoading ? (polling ? 'Processing webhook...' : 'Processing...') : 'Upload Requirements'}
        </Button>

        {/* Debug button - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Button variant="secondary" onClick={testWebhook} disabled={isLoading} className="w-auto" size="sm">
            Test Webhook
          </Button>
        )}
      </div>
      {isLoading && <Progress value={progress} className="w-full" />}
    </div>
  );
}
