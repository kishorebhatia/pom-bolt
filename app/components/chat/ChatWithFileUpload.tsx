import { FileUpload } from '~/components/file-input/file-upload';
import { BaseChat } from './BaseChat';
import type { BaseChatProps } from './BaseChat';
import type { Message } from 'ai';

interface ChatWithFileUploadProps extends Omit<BaseChatProps, 'enhancePrompt'> {
  onFileUpload?: (content: string) => void;
  enhancePrompt?: (input: string) => void;
}

export function ChatWithFileUpload(props: ChatWithFileUploadProps) {
  const { enhancePrompt, ...restProps } = props;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
        <div className="max-w-2xl mx-auto">
          <FileUpload />
        </div>
      </div>
      <div className="flex-1">
        <BaseChat
          {...restProps}
          enhancePrompt={enhancePrompt ? () => enhancePrompt(restProps.input || '') : undefined}
        />
      </div>
    </div>
  );
} 