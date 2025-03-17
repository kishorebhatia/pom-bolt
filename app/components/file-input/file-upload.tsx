import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { useToast } from '~/components/ui/use-toast';
import { Progress } from '~/components/ui/Progress';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('file-upload');

interface FileUploadProps {
  onSendMessage?: (event: React.UIEvent, messageInput?: string) => void;
}

export function FileUpload({ onSendMessage }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

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
      setProgress(100);

      // Use the chat system's sendMessage handler to process the file content
      if (onSendMessage) {
        logger.info('Sending file content to chat system');
        onSendMessage({} as React.UIEvent, content);
        logger.info('File processed successfully');
        toast('Your requirements have been processed');
      } else {
        logger.warn('No sendMessage handler provided');
        toast('Could not process file. Please try again.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      logger.error('Error during file upload', { error });
      toast(errorMessage);
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
