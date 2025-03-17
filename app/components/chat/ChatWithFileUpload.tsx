import { FileUpload } from '~/components/file-input/file-upload';
import { BaseChat } from './BaseChat';

// import { Message } from "@/app/lib/types"

// Create a type that correctly represents sendMessage with projectId
type SendMessageWithProjectId = (event: React.UIEvent, messageInput?: string, projectId?: string) => void;

interface ChatWithFileUploadProps {
  onFileUpload?: (content: string) => void;
  enhancePrompt?: (input: string) => void;
  sendMessage?: SendMessageWithProjectId;

  // Include all other BaseChatProps except enhancePrompt which we override
  [key: string]: any;
}

export function ChatWithFileUpload(props: ChatWithFileUploadProps) {
  const { enhancePrompt, sendMessage, ...restProps } = props;

  // Handle file/requirements upload through a central handler
  const handleRequirementsUpload = (event: React.UIEvent, content?: string, projectId?: string) => {
    if (content) {
      // Use the same sendMessage handler for both file uploads and webhook requirements
      if (sendMessage) {
        sendMessage(event, content, projectId);
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
          sendMessage={
            sendMessage ||
            ((_event, _messageInput) => {
              /* Provide a default no-op function */
            })
          }
          enhancePrompt={enhancePrompt ? () => enhancePrompt(restProps.input || '') : undefined}
        />
      </div>
    </div>
  );
}
