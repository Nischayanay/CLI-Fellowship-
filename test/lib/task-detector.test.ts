import { expect } from 'chai';
import { detectTask, TaskType } from '../../src/lib/task-detector';

describe('Task Detector', () => {
    describe('Basic Classification', () => {
        it('should detect coding tasks', () => {
            const result = detectTask('Fix the typescript bug in my React component');
            expect(result.task_type).to.equal('coding');
            expect(result.confidence).to.be.greaterThan(0.7);
            expect(result.reasoning).to.include('coding');
        });

        it('should detect creative tasks', () => {
            const result = detectTask('Write a blog post about AI trends');
            expect(result.task_type).to.equal('creative');
            expect(result.confidence).to.be.greaterThan(0.5);
            expect(result.reasoning).to.include('creative');
        });

        it('should detect rewrite tasks', () => {
            const result = detectTask('Summarize this long document for me');
            expect(result.task_type).to.equal('rewrite');
            expect(result.confidence).to.be.greaterThan(0);
            expect(result.reasoning).to.include('rewrite');
        });

        it('should detect structured tasks', () => {
            const result = detectTask('Generate a JSON schema for user profiles');
            expect(result.task_type).to.equal('structured');
            expect(result.confidence).to.be.greaterThan(0.5);
            expect(result.reasoning).to.include('structured');
        });

        it('should detect minimal tasks', () => {
            const result = detectTask('Make this design minimal and clean');
            expect(result.task_type).to.equal('minimal');
            expect(result.confidence).to.be.greaterThan(0.5);
            expect(result.reasoning).to.include('minimal');
        });

        it('should detect research tasks', () => {
            const result = detectTask('Explain how neural networks work');
            expect(result.task_type).to.equal('research');
            expect(result.confidence).to.be.greaterThan(0.5);
            expect(result.reasoning).to.include('research');
        });

        it('should default to general for unclear prompts', () => {
            const result = detectTask('Help me with this');
            expect(result.task_type).to.equal('general');
            expect(result.confidence).to.be.lessThan(0.5);
            expect(result.reasoning).to.include('general');
        });
    });

    describe('Output Structure', () => {
        it('should return valid task type', () => {
            const validTypes: TaskType[] = ['coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', 'general'];
            const result = detectTask('Any prompt');
            expect(validTypes).to.include(result.task_type);
        });

        it('should return confidence between 0 and 1', () => {
            const result = detectTask('Fix this bug');
            expect(result.confidence).to.be.at.least(0);
            expect(result.confidence).to.be.at.most(1);
        });

        it('should return non-empty reasoning', () => {
            const result = detectTask('Write code');
            expect(result.reasoning).to.exist;
            expect(result.reasoning.length).to.be.greaterThan(0);
        });

        it('should have all required properties', () => {
            const result = detectTask('Test prompt');
            expect(result).to.have.property('task_type');
            expect(result).to.have.property('confidence');
            expect(result).to.have.property('reasoning');
            expect(result.task_type).to.be.a('string');
            expect(result.confidence).to.be.a('number');
            expect(result.reasoning).to.be.a('string');
        });
    });

    describe('Deterministic Behavior', () => {
        it('should return identical results for identical prompts', () => {
            const prompt = 'Fix the Python error in my script';
            const result1 = detectTask(prompt);
            const result2 = detectTask(prompt);
            
            expect(result1.task_type).to.equal(result2.task_type);
            expect(result1.confidence).to.equal(result2.confidence);
            expect(result1.reasoning).to.equal(result2.reasoning);
        });

        it('should be deterministic across multiple calls', () => {
            const prompt = 'Write a creative story';
            const results = Array.from({ length: 5 }, () => detectTask(prompt));
            
            const firstResult = results[0];
            results.forEach(result => {
                expect(result).to.deep.equal(firstResult);
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string', () => {
            const result = detectTask('');
            expect(result.task_type).to.equal('general');
            expect(result.confidence).to.be.lessThan(0.5);
            expect(result.reasoning).to.include('Empty');
        });

        it('should handle whitespace-only string', () => {
            const result = detectTask('   \n\t  ');
            expect(result.task_type).to.equal('general');
            expect(result.confidence).to.be.lessThan(0.5);
            expect(result.reasoning).to.include('whitespace');
        });

        it('should handle very long prompts', () => {
            const longPrompt = 'Fix this bug '.repeat(1000);
            const result = detectTask(longPrompt);
            expect(result.task_type).to.equal('coding');
            expect(result.confidence).to.be.greaterThan(0);
        });

        it('should handle prompts with mixed signals', () => {
            const result = detectTask('Write code to summarize this blog post');
            // Should pick the highest priority type (coding > creative > rewrite)
            expect(['coding', 'creative', 'rewrite']).to.include(result.task_type);
            expect(result.confidence).to.be.greaterThan(0);
        });

        it('should handle special characters', () => {
            const result = detectTask('Fix bug: @#$%^&*()');
            expect(result.task_type).to.equal('coding');
            expect(result.confidence).to.be.greaterThan(0);
        });
    });

    describe('Structural Pattern Detection', () => {
        it('should detect JSON structures', () => {
            const result = detectTask('Parse this JSON: {"name": "test"}');
            expect(result.task_type).to.equal('structured');
            expect(result.reasoning).to.include('JSON');
        });

        it('should detect code blocks', () => {
            const result = detectTask('Fix this: ```function test() {}```');
            expect(result.task_type).to.equal('coding');
            expect(result.reasoning).to.include('Code block');
        });

        it('should detect SQL queries', () => {
            const result = detectTask('Optimize this: SELECT * FROM users');
            expect(result.task_type).to.equal('structured');
            expect(result.reasoning).to.include('SQL');
        });

        it('should detect file extensions', () => {
            const result = detectTask('Review my script.py file');
            expect(result.task_type).to.equal('coding');
            expect(result.reasoning).to.include('extension');
        });
    });

    describe('Priority Order', () => {
        it('should prioritize coding over other types', () => {
            const result = detectTask('Write code to create a blog post');
            expect(result.task_type).to.equal('coding');
        });

        it('should prioritize structured over creative', () => {
            const result = detectTask('Write a JSON schema for blog posts');
            expect(result.task_type).to.equal('structured');
        });
    });

    describe('Confidence Scoring', () => {
        it('should have high confidence for strong matches', () => {
            const result = detectTask('Fix the Python bug in my code with proper error handling');
            expect(result.confidence).to.be.greaterThan(0.8);
        });

        it('should have medium confidence for moderate matches', () => {
            const result = detectTask('Fix this bug');
            expect(result.confidence).to.be.greaterThan(0.4);
            expect(result.confidence).to.be.lessThan(0.8);
        });

        it('should have low confidence for weak matches', () => {
            const result = detectTask('Help');
            expect(result.confidence).to.be.lessThan(0.5);
        });
    });
});
