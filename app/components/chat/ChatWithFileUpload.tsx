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

  // Handle file/requirements upload through a central handler
  const handleRequirementsUpload = (event: React.UIEvent, content?: string) => {
    if (content) {
      // Use the same sendMessage handler for both file uploads and webhook requirements
      if (sendMessage) {
        sendMessage(event, content);
      }

      // If there's a specialized onFileUpload handler, call that too
      if (props.onFileUpload) {
        props.onFileUpload(content);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
        <div className="max-w-2xl mx-auto">
          <FileUpload onSendMessage={handleRequirementsUpload} />
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
