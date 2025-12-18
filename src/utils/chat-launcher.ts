import colors from './colors';
import boxes from './boxes';
import interactive from './interactive';

/**
 * AI Agent Chat Launcher for seamless transition
 */
export class ChatLauncher {
  /**
   * Launch interactive chat mode with optimized prompt
   */
  static async launchChat(optimizedPrompt: string, originalPrompt?: string): Promise<void> {
    console.clear();
    console.log('');
    console.log(colors.heading('🤖 AI Agent Chat Session'));
    console.log(colors.dim('Starting with your enhanced prompt...'));
    console.log('');

    // Show prompt preview in a compact format
    console.log(colors.primary('📝 Enhanced Prompt:'));
    console.log(colors.dim('─'.repeat(60)));
    console.log(colors.neutral(optimizedPrompt));
    console.log(colors.dim('─'.repeat(60)));
    console.log('');

    // Launch chat interface directly
    await this.startChatInterface(optimizedPrompt);
  }

  /**
   * Interactive chat interface
   */
  private static async startChatInterface(initialPrompt: string): Promise<void> {
    // Chat header
    console.log(colors.primary('🚀 Processing your enhanced prompt...'));
    console.log('');

    // Simulate AI response (in real implementation, this would call the AI API)
    await this.simulateAIResponse(initialPrompt);

    console.log('');
    console.log(colors.dim('─'.repeat(60)));
    console.log(colors.primary('💬 Continue the conversation:'));
    console.log(colors.dim('Type your follow-up questions or requests. Use /help for commands, /exit to quit.'));
    console.log('');

    // Start interactive loop
    await this.chatLoop();
  }

  /**
   * Main chat interaction loop
   */
  private static async chatLoop(): Promise<void> {
    while (true) {
      try {
        // Get user input
        const userInput = await interactive.input({
          message: colors.primary('You:'),
          multiline: false,
        });

        // Handle special commands
        if (userInput.startsWith('/')) {
          const handled = await this.handleChatCommand(userInput);
          if (handled === 'exit') break;
          continue;
        }

        // Process user message
        if (userInput.trim()) {
          await this.processUserMessage(userInput);
        }

      } catch (error) {
        if (error && typeof error === 'object' && 'message' in error && error.message === 'User cancelled') {
          console.log('');
          console.log(colors.warning('Chat session ended'));
          break;
        }
        throw error;
      }
    }
  }

  /**
   * Handle special chat commands
   */
  private static async handleChatCommand(command: string): Promise<string | void> {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case '/help':
        this.showChatHelp();
        break;
      
      case '/exit':
      case '/quit':
        console.log(colors.success('👋 Chat session ended. Thanks for using PromptBrain!'));
        return 'exit';
      
      case '/clear':
        console.clear();
        console.log(colors.heading('🤖 AI Agent Chat Session'));
        console.log('');
        break;
      
      case '/status':
        this.showChatStatus();
        break;
      
      default:
        console.log(colors.warning(`Unknown command: ${command}`));
        console.log(colors.dim('Type /help to see available commands'));
    }
  }

  /**
   * Process user message and get AI response
   */
  private static async processUserMessage(message: string): Promise<void> {
    // Show typing indicator
    console.log('');
    console.log(colors.dim('🤖 AI is thinking...'));

    // Simulate AI processing (replace with actual AI API call)
    await this.simulateAIResponse(message);
  }

  /**
   * Simulate AI response (replace with actual AI integration)
   */
  private static async simulateAIResponse(prompt: string): Promise<void> {
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clear thinking indicator
    process.stdout.write('\r\x1b[K');

    // Generate simulated response based on prompt content
    let response = this.generateSimulatedResponse(prompt);

    // Stream the response character by character
    console.log(colors.primary('🤖 AI:'));
    await this.streamText(response);
    console.log('\n');
  }

  /**
   * Generate a contextual simulated response
   */
  private static generateSimulatedResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('auth') || lowerPrompt.includes('login')) {
      return "Perfect! I'll help you build a secure authentication system. Here's my recommended approach:\n\n" +
             "🔐 **Core Components:**\n" +
             "1. User registration with email verification\n" +
             "2. JWT-based login system\n" +
             "3. Password reset flow\n" +
             "4. Route protection middleware\n" +
             "5. Session management\n\n" +
             "🛠️ **Tech Stack Suggestions:**\n" +
             "• bcrypt for password hashing\n" +
             "• jsonwebtoken for JWT handling\n" +
             "• express-validator for input validation\n\n" +
             "Which component would you like to start with? I can provide complete code examples.";
    }

    if (lowerPrompt.includes('react') || lowerPrompt.includes('component')) {
      return "Excellent! I'll help you create a robust React component. Here's what I recommend:\n\n" +
             "⚛️ **Best Practices I'll Include:**\n" +
             "• TypeScript interfaces for type safety\n" +
             "• Proper prop validation\n" +
             "• Accessibility (ARIA labels, keyboard navigation)\n" +
             "• Responsive design patterns\n" +
             "• Error boundaries\n\n" +
             "🎨 **Styling Options:**\n" +
             "• CSS Modules / Styled Components\n" +
             "• Tailwind CSS classes\n" +
             "• Material-UI / Chakra UI integration\n\n" +
             "What specific functionality should this component handle? I'll create a complete implementation.";
    }

    if (lowerPrompt.includes('api') || lowerPrompt.includes('backend')) {
      return "Great choice! I'll help you build a solid API. Here's my development approach:\n\n" +
             "🚀 **API Architecture:**\n" +
             "• RESTful endpoint design\n" +
             "• Proper HTTP status codes\n" +
             "• Request/response validation\n" +
             "• Error handling middleware\n" +
             "• Rate limiting & security\n\n" +
             "📊 **Database Integration:**\n" +
             "• Schema design\n" +
             "• Query optimization\n" +
             "• Migration scripts\n\n" +
             "🔒 **Security Features:**\n" +
             "• Authentication middleware\n" +
             "• Input sanitization\n" +
             "• CORS configuration\n\n" +
             "Which endpoints do you need? I'll provide complete implementation with tests.";
    }

    if (lowerPrompt.includes('database') || lowerPrompt.includes('sql')) {
      return "Perfect! I'll help you design and implement your database solution:\n\n" +
             "🗄️ **Database Design:**\n" +
             "• Normalized schema structure\n" +
             "• Proper indexing strategy\n" +
             "• Relationship mapping\n" +
             "• Performance optimization\n\n" +
             "⚡ **Implementation Options:**\n" +
             "• Raw SQL queries\n" +
             "• ORM integration (Prisma, Sequelize)\n" +
             "• Migration management\n" +
             "• Seed data scripts\n\n" +
             "What type of data are you working with? I'll create the complete schema and queries.";
    }

    return "I'm ready to help you implement this! Based on your enhanced prompt, I'll provide:\n\n" +
           "✨ **What I'll Deliver:**\n" +
           "• Complete, production-ready code\n" +
           "• Best practices and patterns\n" +
           "• Error handling and validation\n" +
           "• Documentation and comments\n" +
           "• Testing recommendations\n\n" +
           "🎯 **My Approach:**\n" +
           "• Break down complex requirements\n" +
           "• Provide step-by-step implementation\n" +
           "• Explain design decisions\n" +
           "• Suggest improvements\n\n" +
           "What specific aspect would you like me to focus on first?";
  }

  /**
   * Stream text character by character like ChatGPT
   */
  private static async streamText(text: string, delay: number = 30): Promise<void> {
    for (const char of text) {
      process.stdout.write(colors.neutral(char));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Wait for user to press Enter
   */
  private static async waitForEnter(): Promise<void> {
    return new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', (key) => {
        if (key[0] === 13) { // Enter key
          process.stdin.setRawMode(false);
          process.stdin.pause();
          resolve();
        } else if (key[0] === 3) { // Ctrl+C
          process.exit(0);
        }
      });
    });
  }

  /**
   * Show chat help
   */
  private static showChatHelp(): void {
    console.log('');
    console.log(colors.heading('💡 Chat Commands:'));
    console.log('');
    console.log(`  ${colors.highlight('/help')}    - Show this help message`);
    console.log(`  ${colors.highlight('/exit')}    - End chat session`);
    console.log(`  ${colors.highlight('/clear')}   - Clear chat screen`);
    console.log(`  ${colors.highlight('/status')}  - Show session status`);
    console.log('');
    console.log(colors.dim('Just type normally to chat with the AI agent.'));
    console.log('');
  }

  /**
   * Show chat session status
   */
  private static showChatStatus(): void {
    console.log('');
    console.log(boxes.info(
      'Chat session is active\n' +
      'AI agent is ready to help\n' +
      'Type /help for available commands',
      'Session Status'
    ));
    console.log('');
  }
}

export default ChatLauncher;