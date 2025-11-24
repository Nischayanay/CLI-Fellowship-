import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';

// Import from dist to match runtime environment
const { templateLoader } = require('../dist/lib/templateLoader');

const TEST_DIR = path.join(os.tmpdir(), 'pbcli-test-templates');
const SYSTEM_DIR = path.join(TEST_DIR, 'system');
const USER_DIR = path.join(TEST_DIR, 'user');

describe('PB Library System', () => {

    before(async () => {
        // Setup test directories
        await fs.ensureDir(SYSTEM_DIR);
        await fs.ensureDir(USER_DIR);

        // Override paths in templateLoader for testing
        (templateLoader as any).systemTemplatesPath = SYSTEM_DIR;
        (templateLoader as any).userTemplatesPath = USER_DIR;

        // Create dummy system template
        await fs.writeJson(path.join(SYSTEM_DIR, 'test-sys.json'), [{
            name: 'test-system-template',
            description: 'Test System Template',
            category: 'test',
            content: 'test-system-content'
        }]);
    });

    after(async () => {
        await fs.remove(TEST_DIR);
    });

    describe('Template Loader', () => {
        it('should load system templates', async () => {
            const templates = await templateLoader.loadTemplates();
            const sys = templates.find((t: any) => t.name === 'test-system-template');
            expect(sys).to.exist;
            expect(sys?.isSystem).to.be.true;
            expect(sys?.category).to.equal('test');
        });

        it('should add user templates', async () => {
            await templateLoader.addTemplate({
                name: 'test-user-template',
                description: 'Test User Template',
                category: 'custom',
                content: 'test-user-content'
            });

            const templates = await templateLoader.loadTemplates();
            const user = templates.find((t: any) => t.name === 'test-user-template');
            expect(user).to.exist;
            expect(user?.isSystem).to.be.false;
            expect(user?.content).to.equal('test-user-content');
        });

        it('should retrieve specific template by name', async () => {
            const template = await templateLoader.getTemplate('test-user-template');
            expect(template).to.exist;
            expect(template?.name).to.equal('test-user-template');
        });

        it('should remove user templates', async () => {
            await templateLoader.removeTemplate('test-user-template');
            const templates = await templateLoader.loadTemplates();
            expect(templates.find((t: any) => t.name === 'test-user-template')).to.not.exist;
        });

        it('should fail to remove system templates', async () => {
            try {
                await templateLoader.removeTemplate('test-system-template');
                throw new Error('Should have thrown an error');
            } catch (e: any) {
                expect(e.message).to.include('system template');
            }
        });

        it('should sanitize template names for filenames', async () => {
            await templateLoader.addTemplate({
                name: 'Test Template With Spaces!',
                description: 'Test',
                category: 'custom',
                content: 'content'
            });

            const filePath = path.join(USER_DIR, 'test_template_with_spaces_.json');
            const exists = await fs.pathExists(filePath);
            expect(exists).to.be.true;

            // Cleanup
            await templateLoader.removeTemplate('Test Template With Spaces!');
        });
    });
});
