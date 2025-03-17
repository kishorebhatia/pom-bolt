import { type Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import { WORK_DIR } from '~/utils/constants';

const logger = createScopedLogger('file-processor');

export interface FileProcessorResult {
  messages: Message[];
  contextOptimization: boolean;
  files?: Record<string, string>;
  projectType?: string;
  dependencies?: Record<string, string>;
  isExistingProject?: boolean;
}

export class FileProcessor {
  static async processContent(content: string, isExistingProject: boolean = false): Promise<FileProcessorResult> {
    try {
      logger.info('Starting file content processing', { isExistingProject });

      // Process requirements line by line
      const requirements = content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.trim());

      logger.info(`Found ${requirements.length} requirements in file`, { isExistingProject });

      if (requirements.length === 0) {
        logger.warn('No valid requirements found in the file');
        throw new Error('No valid requirements found in the file');
      }

      // Log requirements for debugging
      logger.debug('Processed requirements:', requirements);

      /*
       * Create a structured system message for code generation
       * Adjust the prompt based on whether this is for a new or existing project
       */
      const systemMessage: Message = {
        id: 'system',
        role: 'system',
        content: isExistingProject
          ? `You are a software development assistant. You will help implement the following feature requests for an existing project:

1. Analyze each feature request carefully in the context of the existing codebase
2. Break down complex requests into manageable tasks
3. Consider how the new features integrate with the existing code
4. Provide implementation guidance that maintains project architecture
5. Generate necessary modifications to existing files or new files as needed
6. Ensure backward compatibility with existing functionality
7. Provide clear instructions for testing the new features

The feature requests will be provided in the next message. Please analyze them and provide a structured response that includes:
1. A high-level overview of your implementation approach
2. Technical considerations and potential challenges
3. Required modifications to existing files
4. Any new files that need to be created
5. Testing instructions for the new features

IMPORTANT: Your response should be structured to:
1. First provide a high-level analysis of how the features fit into the existing project
2. Then detail the necessary code changes or additions
3. Finally provide testing instructions

Focus on maintaining the project's existing architecture and coding style.`
          : `You are a software development assistant. You will help implement the following requirements:

1. Analyze each requirement carefully
2. Break down complex requirements into manageable tasks
3. Provide implementation guidance and code examples
4. Consider best practices and potential challenges
5. Suggest improvements or clarifications if needed
6. Generate necessary code files and structure
7. Provide clear instructions for running and testing the code

The requirements will be provided in the next message. Please analyze them and provide a structured response that includes:
1. A high-level overview of the implementation approach
2. Any clarifications or assumptions needed
3. Technical considerations and potential challenges
4. Suggested implementation steps
5. Code structure and organization
6. Required dependencies and setup instructions

IMPORTANT: Your response should be structured to:
1. First provide a high-level analysis and implementation plan
2. Then generate the necessary code files with proper structure
3. Finally provide setup and running instructions

The code should be organized in a way that follows best practices and is easy to maintain.`,
      };

      logger.debug('Generated system message:', systemMessage);

      // Create a user message with formatted requirements
      const userMessage: Message = {
        id: 'user',
        role: 'user',
        content: isExistingProject
          ? `Feature requests for the existing project:

${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

Please analyze these feature requests and provide an implementation plan that integrates with the existing codebase. Make sure to maintain the project's architecture and coding style.`
          : `Requirements to implement:

${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

Please analyze these requirements and provide a complete implementation plan with code. The code should be organized in a way that follows best practices and is easy to maintain.`,
      };

      logger.debug('Generated user message:', userMessage);

      // Create initial project structure
      const result: FileProcessorResult = {
        messages: [systemMessage, userMessage],
        contextOptimization: true,
        isExistingProject,
        files: {
          [`${WORK_DIR}/requirements.txt`]: requirements.join('\n'),
          [`${WORK_DIR}/README.md`]: isExistingProject
            ? `# Feature Requests\n\n${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}`
            : `# Project Requirements\n\n${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}`,
        },
      };

      logger.info('File processing completed successfully', { isExistingProject });

      return result;
    } catch (error) {
      logger.error('Error processing file content:', error);
      throw new Error('Failed to process file content');
    }
  }
}
