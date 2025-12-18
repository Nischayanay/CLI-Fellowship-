import { Command, Args } from '@oclif/core';
import ChatLauncher from '../utils/chat-launcher';
import colors from '../utils/colors';

export default class TestChat extends Command {
    static description = 'Test the AI chat functionality';
    static hidden = true; // Hide from help

    static args = {
        prompt: Args.string({ 
            description: 'The prompt to use for chat', 
            required: false,
            default: 'create a react authentication component with TypeScript, form validation, and secure password handling'
        }),
    };

    async run(): Promise<void> {
        const { args } = await this.parse(TestChat);
        
        console.log('');
        console.log(colors.success('✓ Enhancement Complete! (Simulated)'));
        console.log('');
        console.log(colors.primary('Enhanced Prompt:'));
        console.log(colors.dim(args.prompt));
        console.log('');
        
        // Offer chat mode
        await this.offerChatMode(args.prompt);
    }

    /**
     * Offer chat mode after successful enhancement
     */
    private async offerChatMode(enhancedPrompt: string): Promise<void> {
        console.log('');
        console.log(colors.primary('🤖 Ready to continue with AI Chat?'));
        console.log(colors.dim('Press Enter to launch interactive chat with your enhanced prompt'));
        console.log(colors.dim('Or press Ctrl+C to finish'));
        console.log('');

        try {
            await this.waitForUserChoice();
            
            // Launch chat with the enhanced prompt
            await ChatLauncher.launchChat(enhancedPrompt);
            
        } catch (error) {
            // User pressed Ctrl+C or chose not to continue
            console.log('');
            console.log(colors.success('✓ Enhancement complete! Use your enhanced prompt wherever you need it.'));
            console.log('');
        }
    }

    /**
     * Wait for user choice (Enter or Ctrl+C)
     */
    private async waitForUserChoice(): Promise<void> {
        return new Promise((resolve, reject) => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('data', (key) => {
                if (key[0] === 13) { // Enter key
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    resolve();
                } else if (key[0] === 3) { // Ctrl+C
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    reject(new Error('User cancelled'));
                }
            });
        });
    }
}