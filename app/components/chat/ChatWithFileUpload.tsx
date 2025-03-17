import { FileUpload } from '~/components/file-input/file-upload';
import { BaseChat } from './BaseChat';
import type { BaseChatProps } from './BaseChat';

// import { Message } from "@/app/lib/types"

interface ChatWithFileUploadProps extends Omit<BaseChatProps, 'enhancePrompt'> {
  onFileUpload?: (content: string) => void;
  enhancePrompt?: (input: string) => void;
}

export function ChatWithFileUpload(props: ChatWithFileUploadProps) {
  const { enhancePrompt, sendMessage, ...restProps } = props;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
        <div className="max-w-2xl mx-auto">
          <FileUpload onSendMessage={sendMessage} />
        </div>
      </div>
      <div className="flex-1">
        <BaseChat
          {...restProps}
          sendMessage={sendMessage}
          enhancePrompt={enhancePrompt ? () => enhancePrompt(restProps.input || '') : undefined}
        />
      </div>
    </div>
  );
}
