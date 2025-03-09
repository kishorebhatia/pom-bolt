# Pommon-bolt Architecture

## System Overview
Pom-bolt is an AI-powered development environment built on modern web technologies. It provides an integrated development environment (IDE) with AI capabilities, code editing, and project management features. The system now supports multiple input methods for AI interaction, including direct chat and structured file input.

## Core Technologies
- **Frontend Framework**: Remix.js with React
- **Build System**: Vite
- **Styling**: UnoCSS + Tailwind
- **State Management**: Zustand + Nanostores
- **Cloud Platform**: Cloudflare Pages
- **AI Integration**: Multiple AI providers (OpenAI, Anthropic, Google, etc.)
- **Code Editor**: CodeMirror
- **Terminal**: xterm.js
- **Container**: WebContainer API
- **Streaming**: Server-Sent Events (SSE) for real-time updates

## Feature Map

### 1. AI Integration
**Files**:
- `app/routes/api.chat.ts` - Core chat API endpoint
- `app/routes/api.file-input.ts` - File-based input processing
- `app/routes/api.llmcall.ts` - Direct LLM API calls
- `app/routes/api.models.ts` - Model management
- `app/routes/api.models.$provider.ts` - Provider-specific implementations

**Components**:
- AI chat interface
- File upload interface
- Model selection
- LLM API integration
- Response streaming and handling
- Progress tracking

### 2. File Processing
**Files**:
- `app/lib/.server/file-processing/file-processor.ts` - Core file processing logic
- `app/components/file-input/file-upload.tsx` - File upload UI component

**Features**:
- Text file parsing
- Requirements extraction
- Project structure generation
- Integration with AI processing
- Real-time progress updates
- Error handling and validation

### 3. Code Editor
**Files**:
- `app/components/editor/`
- `app/components/editor/editor.tsx`
- `app/components/editor/editor-toolbar.tsx`
- `app/components/editor/editor-status.tsx`

**Features**:
- Syntax highlighting
- Code completion
- Multiple language support
- File management
- Integration with file processing results

### 4. Terminal Integration
**Files**:
- `app/components/terminal/`
- `app/components/terminal/terminal.tsx`
- `app/components/terminal/terminal-toolbar.tsx`

**Features**:
- Command execution
- Output display
- Terminal customization
- Build process monitoring

### 5. Git Integration
**Files**:
- `app/routes/git.tsx`
- `app/routes/api.git-proxy.$.ts`
- `app/components/git/`

**Features**:
- Repository management
- Git operations
- File versioning
- Project history

### 6. Project Management
**Files**:
- `app/routes/_index.tsx`
- `app/components/project/`
- `app/components/project/project-toolbar.tsx`

**Features**:
- Project navigation
- File tree
- Project settings
- Requirements management

### 7. Deployment
**Files**:
- `app/routes/api.deploy.ts`
- `app/routes/webcontainer.preview.$id.tsx`

**Features**:
- Project deployment
- Preview generation
- Environment management
- Build process automation

## System Architecture

### Input Layer
1. **User Interface**
   - Web-based IDE interface
   - Code editor input
   - Terminal commands
   - Git operations
   - AI prompts
   - File upload interface

2. **External Services**
   - AI provider APIs
   - Git repositories
   - Cloudflare services
   - WebContainer API

### Processing Layer
1. **Core Services**
   - File processing and analysis
   - Code execution (WebContainer)
   - AI processing
   - Git operations
   - File management
   - Terminal emulation

2. **State Management**
   - Project state
   - Editor state
   - Terminal state
   - AI conversation state
   - File processing state

### Output Layer
1. **User Interface**
   - Code editor display
   - Terminal output
   - File tree
   - AI responses
   - Project status
   - Progress indicators

2. **External Systems**
   - Deployed applications
   - Git repositories
   - Cloud storage

## Data Flow

### 1. File Input Flow
```
File Upload → File Processing → AI Integration → Code Generation → WebContainer → Preview
   ↓              ↓               ↓                ↓               ↓             ↓
Validation → Requirements → Message Stream → File Generation → Deployment → Status Update
```

### 2. Code Editing Flow
```
User Input → Editor Component → File System → WebContainer → Output Display
```

### 3. AI Integration Flow
```
User Input (File/Chat) → AI Service → Model Processing → Response Generation → UI Display
```

### 4. Git Operations Flow
```
Git Command → Git Proxy → Repository → Operation Execution → Status Update
```

### 5. Deployment Flow
```
Deploy Request → Environment Setup → Build Process → Cloudflare Pages → Preview URL
```

## Integration Details

### File Input Integration
1. **Component Layer**
   - `FileUpload` component handles file selection and validation
   - Progress tracking for multi-stage processing
   - Integration with workbench and files store

2. **Processing Layer**
   - `FileProcessor` analyzes and structures file content
   - Generates system and user messages for AI
   - Creates initial project structure

3. **API Layer**
   - `api.file-input.ts` manages the processing flow
   - Handles streaming responses
   - Coordinates with chat API
   - Manages file context updates

4. **State Management**
   - Files store tracks generated files
   - Workbench store manages UI state
   - Progress updates through streaming

## Security Considerations
- API key management
- Git authentication
- Environment variable protection
- WebContainer security
- Cloudflare security features
- File upload validation and sanitization

## Scalability Aspects
- Cloudflare edge computing
- WebContainer isolation
- AI provider load balancing
- File system optimization
- State management efficiency
- Streaming response handling

## Future Considerations
1. Enhanced AI capabilities
2. Additional file format support
3. Improved collaboration features
4. Advanced deployment options
5. Performance optimizations
6. Extended file processing capabilities
7. Enhanced progress tracking and error handling 