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
}

export class FileProcessor {
  static async processContent(content: string): Promise<FileProcessorResult> {
    try {
      logger.info('Starting file content processing');
      
      // Process requirements line by line
      const requirements = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());

      logger.info(`Found ${requirements.length} requirements in file`);

      if (requirements.length === 0) {
        logger.warn('No valid requirements found in the file');
        throw new Error('No valid requirements found in the file');
      }

      // Log requirements for debugging
      logger.debug('Processed requirements:', requirements);

      // Create a structured system message for code generation
      const systemMessage: Message = {
        id: 'system',
        role: 'system',
        content: `You are a software development assistant. You will help implement the following requirements:

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
        content: `Requirements to implement:

${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

Please analyze these requirements and provide a complete implementation plan with code. The code should be organized in a way that follows best practices and is easy to maintain.`,
      };

      logger.debug('Generated user message:', userMessage);

      // Create initial project structure
      const result = {
        messages: [systemMessage, userMessage],
        contextOptimization: true,
        files: {
          [`${WORK_DIR}/requirements.txt`]: requirements.join('\n'),
          [`${WORK_DIR}/README.md`]: `# Project Requirements\n\n${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}`,
        },
      };

      logger.info('File processing completed successfully');
      return result;
    } catch (error) {
      logger.error('Error processing file content:', error);
      throw new Error('Failed to process file content');
    }
  }
} 