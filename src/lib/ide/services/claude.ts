/**
 * Claude AI Integration Service
 * Handles communication with Claude for AI-assisted coding
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeToolUse {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
}

export interface ClaudeStreamEvent {
  type: 'start' | 'text' | 'tool_use' | 'end' | 'error';
  text?: string;
  toolUse?: ClaudeToolUse;
  error?: string;
}

export interface ClaudeConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
  temperature?: number;
}

export type ClaudeEventHandler = (event: ClaudeStreamEvent) => void;

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;

const IDE_SYSTEM_PROMPT = `You are an AI assistant integrated into a mobile-first IDE called Local IDE. You help developers with coding tasks, answer questions about code, suggest improvements, and assist with debugging.

Key capabilities:
- Review and explain code
- Suggest improvements and best practices
- Help debug issues
- Generate code snippets
- Answer programming questions
- Assist with Git operations and workflows

When providing code, use appropriate markdown code blocks with language identifiers.
When suggesting file changes, be clear about which file should be modified.
Keep responses focused and practical, optimized for mobile viewing when possible.

When users ask about terminal commands or shell operations:
- Format commands in bash/shell code blocks
- Explain what each command does
- Note any prerequisites (packages, permissions, etc.)
- Suggest safer alternatives when appropriate
- If a command could be destructive, warn the user first`;

// System prompt enhancement for terminal mode in production
export const TERMINAL_MODE_SYSTEM_PROMPT = `You are helping users with terminal and command-line tasks. Since the terminal is not available in this environment, you will suggest commands that users can run in their local terminal.

When providing command suggestions:
- Always use \`\`\`bash code blocks for commands
- Explain what each command does before showing it
- Break down complex pipelines step by step
- Note any prerequisites (installing packages, permissions, etc.)
- Warn about potentially destructive commands (rm -rf, etc.)
- Suggest safer alternatives when available
- For multi-step operations, number the steps clearly

Remember: Users will copy these commands to run locally, so be precise and accurate.`;

// =============================================================================
// CLAUDE SERVICE CLASS
// =============================================================================

export class ClaudeService {
  private config: Required<ClaudeConfig>;
  private conversationHistory: ClaudeMessage[] = [];
  private abortController: AbortController | null = null;
  private isProcessing = false;

  constructor(config: ClaudeConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      model: config.model || DEFAULT_MODEL,
      maxTokens: config.maxTokens || DEFAULT_MAX_TOKENS,
      systemPrompt: config.systemPrompt || IDE_SYSTEM_PROMPT,
      temperature: config.temperature || DEFAULT_TEMPERATURE,
    };
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  setApiKey(key: string): void {
    this.config.apiKey = key;
  }

  setModel(model: string): void {
    this.config.model = model;
  }

  setSystemPrompt(prompt: string): void {
    this.config.systemPrompt = prompt;
  }

  get isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  // ===========================================================================
  // CONVERSATION MANAGEMENT
  // ===========================================================================

  addMessage(message: ClaudeMessage): void {
    this.conversationHistory.push(message);
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): ClaudeMessage[] {
    return [...this.conversationHistory];
  }

  // ===========================================================================
  // API INTERACTION
  // ===========================================================================

  async sendMessage(
    content: string,
    onStream?: ClaudeEventHandler
  ): Promise<string> {
    if (this.isProcessing) {
      throw new Error('Already processing a request');
    }

    if (!this.config.apiKey) {
      // Use mock response if no API key
      return this.mockResponse(content, onStream);
    }

    this.isProcessing = true;
    this.abortController = new AbortController();

    // Add user message to history
    this.addMessage({ role: 'user', content });

    try {
      onStream?.({ type: 'start' });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt,
          messages: this.conversationHistory.map((m) => ({
            role: m.role === 'system' ? 'user' : m.role,
            content: m.content,
          })),
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      let fullResponse = '';

      // Handle streaming response
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'content_block_delta') {
                  const text = parsed.delta?.text || '';
                  fullResponse += text;
                  onStream?.({ type: 'text', text });
                } else if (parsed.type === 'message_stop') {
                  onStream?.({ type: 'end' });
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Add assistant response to history
      this.addMessage({ role: 'assistant', content: fullResponse });

      onStream?.({ type: 'end' });
      return fullResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (error instanceof Error && error.name === 'AbortError') {
        onStream?.({ type: 'end' });
        return '';
      }

      onStream?.({ type: 'error', error: message });
      throw error;
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // ===========================================================================
  // MOCK RESPONSES (for development/demo)
  // ===========================================================================

  private async mockResponse(
    content: string,
    onStream?: ClaudeEventHandler
  ): Promise<string> {
    onStream?.({ type: 'start' });

    // Simulate processing delay
    await this.delay(500);

    // Generate mock response based on input
    const response = this.generateMockResponse(content);

    // Simulate streaming
    const words = response.split(' ');
    let fullResponse = '';

    for (const word of words) {
      if (this.abortController?.signal.aborted) break;

      const text = (fullResponse ? ' ' : '') + word;
      fullResponse += text;
      onStream?.({ type: 'text', text });
      await this.delay(30 + Math.random() * 30);
    }

    // Add to history
    this.addMessage({ role: 'user', content });
    this.addMessage({ role: 'assistant', content: fullResponse });

    onStream?.({ type: 'end' });
    return fullResponse;
  }

  private generateMockResponse(input: string): string {
    const lowerInput = input.toLowerCase();

    // Code-related queries
    if (lowerInput.includes('function') || lowerInput.includes('write')) {
      return `Here's an example implementation:

\`\`\`typescript
function example() {
  // Your logic here
  console.log("Hello from Local IDE!");
  return true;
}
\`\`\`

This function demonstrates a basic structure. Let me know if you need any modifications!`;
    }

    // Debugging queries
    if (lowerInput.includes('error') || lowerInput.includes('bug') || lowerInput.includes('fix')) {
      return `I'd be happy to help debug this issue! Here are some steps to investigate:

1. **Check the error message** - What specific error are you seeing?
2. **Review recent changes** - Did this work before? What changed?
3. **Add logging** - Try adding \`console.log()\` statements to trace the issue
4. **Check dependencies** - Ensure all imports are correct

Could you share the specific error message or code snippet? That would help me provide more targeted assistance.`;
    }

    // Git-related queries
    if (lowerInput.includes('git') || lowerInput.includes('commit') || lowerInput.includes('branch')) {
      return `Here are some common Git commands you might find useful:

\`\`\`bash
# Check status
git status

# Create a new branch
git checkout -b feature/new-feature

# Stage and commit changes
git add .
git commit -m "feat: description of changes"

# Push changes
git push origin feature/new-feature
\`\`\`

Would you like help with a specific Git operation?`;
    }

    // Help queries
    if (lowerInput.includes('help') || lowerInput.includes('how do i')) {
      return `I'm here to help! As your AI assistant in Local IDE, I can:

- **Review code** - Share your code and I'll analyze it
- **Write code** - Describe what you need and I'll generate it
- **Debug issues** - Tell me about errors and I'll help fix them
- **Explain concepts** - Ask about any programming topic
- **Git assistance** - Help with version control workflows

What would you like help with today?`;
    }

    // Default response
    return `Thanks for your message! I'm Claude, your AI coding assistant in Local IDE.

I can help you with:
- Writing and reviewing code
- Debugging issues
- Explaining programming concepts
- Git and version control
- Best practices and optimization

Feel free to share code snippets, error messages, or describe what you're trying to build, and I'll do my best to assist!

**Note:** This is a demo response. Connect your Claude API key in settings for full AI capabilities.`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// CONTEXT-AWARE HELPERS
// =============================================================================

export interface CodeContext {
  currentFile?: string;
  selectedCode?: string;
  fileTree?: string[];
  recentChanges?: string[];
}

/**
 * Build a context-aware prompt with current IDE state
 */
export function buildContextualPrompt(
  userMessage: string,
  context: CodeContext
): string {
  const parts: string[] = [];

  if (context.currentFile) {
    parts.push(`Current file: ${context.currentFile}`);
  }

  if (context.selectedCode) {
    parts.push(`Selected code:\n\`\`\`\n${context.selectedCode}\n\`\`\``);
  }

  if (context.recentChanges?.length) {
    parts.push(`Recent changes: ${context.recentChanges.join(', ')}`);
  }

  if (parts.length > 0) {
    return `[Context]\n${parts.join('\n')}\n\n[Question]\n${userMessage}`;
  }

  return userMessage;
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let claudeInstance: ClaudeService | null = null;

export function getClaudeService(): ClaudeService {
  if (!claudeInstance) {
    claudeInstance = new ClaudeService();
  }
  return claudeInstance;
}

export function configureClaudeService(config: ClaudeConfig): ClaudeService {
  claudeInstance = new ClaudeService(config);
  return claudeInstance;
}

// =============================================================================
// STORAGE HELPERS
// =============================================================================

const CLAUDE_API_KEY_STORAGE = 'local-ide-claude-api-key';

export function getStoredClaudeApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CLAUDE_API_KEY_STORAGE);
}

export function setStoredClaudeApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLAUDE_API_KEY_STORAGE, key);

  // Update the service
  getClaudeService().setApiKey(key);
}

export function clearStoredClaudeApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CLAUDE_API_KEY_STORAGE);
}
