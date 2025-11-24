import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { templateLoader } from '../../src/lib/templateLoader';

const TEST_DIR = path.join(os.tmpdir(), 'pbcli-test-loader');
const SYSTEM_DIR = path.join(TEST_DIR, 'system');
const USER_DIR = path.join(TEST_DIR, 'user');

describe('TemplateLoader Unit Tests', () => {

    before(async () => {
        // Setup test directories
        await fs.ensureDir(SYSTEM_DIR);
        await fs.ensureDir(USER_DIR);

        // Override paths in templateLoader for testing
        // We need to cast to any to access private properties for testing purposes
        (templateLoader as any).systemTemplatesPath = SYSTEM_DIR;
        (templateLoader as any).userTemplatesPath = USER_DIR;

        // Create dummy system template
        await fs.writeJson(path.join(SYSTEM_DIR, 'sys-test.json'), [{
            name: 'system-template',
            description: 'System Template Description',
            category: 'system-cat',
            content: 'system-content'
        }]);
    });

    after(async () => {
        await fs.remove(TEST_DIR);
    });

    beforeEach(async () => {
        // Clean user dir before each test
        await fs.emptyDir(USER_DIR);
    });

    describe('loadSystemTemplates', () => {
        it('should load system templates correctly', async () => {
            // Access private method via any cast or just use public loadTemplates which calls it
            const templates = await templateLoader.loadTemplates();
            const sys = templates.find(t => t.name === 'system-template');

            expect(sys).to.exist;
            expect(sys?.isSystem).to.be.true;
            expect(sys?.content).to.equal('system-content');
        });

        it('should handle missing system directory gracefully', async () => {
            const originalPath = (templateLoader as any).systemTemplatesPath;
            (templateLoader as any).systemTemplatesPath = path.join(TEST_DIR, 'non-existent');

            const templates = await templateLoader.loadTemplates();
            // Should just return user templates (empty in this case)
            expect(templates).to.be.an('array');

            // Restore path
            (templateLoader as any).systemTemplatesPath = originalPath;
        });
    });

    describe('loadUserTemplates', () => {
        it('should load user templates correctly', async () => {
            await fs.writeJson(path.join(USER_DIR, 'user-test.json'), {
                name: 'user-template',
                description: 'User Template',
                category: 'custom',
                content: 'user-content'
            });

            const templates = await templateLoader.loadTemplates();
            const user = templates.find(t => t.name === 'user-template');

            expect(user).to.exist;
            expect(user?.isSystem).to.be.false;
            expect(user?.content).to.equal('user-content');
        });

        it('should ignore malformed json files', async () => {
            await fs.writeFile(path.join(USER_DIR, 'bad.json'), '{ invalid json }');

            const templates = await templateLoader.loadTemplates();
            // Should not crash
            const user = templates.find(t => t.name === 'user-template');
            expect(user).to.not.exist;
        });
    });

    describe('addTemplate', () => {
        it('should save a new user template', async () => {
            await templateLoader.addTemplate({
                name: 'new-template',
                description: 'New Description',
                category: 'custom',
                content: 'new-content'
            });

            const filePath = path.join(USER_DIR, 'new-template.json');
            expect(await fs.pathExists(filePath)).to.be.true;

            const content = await fs.readJson(filePath);
            expect(content.name).to.equal('new-template');
            expect(content.content).to.equal('new-content');
        });

        it('should sanitize filenames', async () => {
            await templateLoader.addTemplate({
                name: 'My Cool Template!',
                description: 'Desc',
                category: 'custom',
                content: 'content'
            });

            // "My Cool Template!" -> "my_cool_template_"
            const filePath = path.join(USER_DIR, 'my_cool_template_.json');
            expect(await fs.pathExists(filePath)).to.be.true;
        });
    });

    describe('removeTemplate', () => {
        it('should remove an existing user template', async () => {
            await templateLoader.addTemplate({
                name: 'to-remove',
                description: 'Desc',
                category: 'custom',
                content: 'content'
            });

            await templateLoader.removeTemplate('to-remove');

            const filePath = path.join(USER_DIR, 'to-remove.json');
            expect(await fs.pathExists(filePath)).to.be.false;
        });

        it('should throw error when removing non-existent template', async () => {
            try {
                await templateLoader.removeTemplate('non-existent');
                expect.fail('Should have thrown error');
            } catch (e: any) {
                expect(e.message).to.include('not found');
            }
        });

        it('should throw error when removing system template', async () => {
            try {
                await templateLoader.removeTemplate('system-template');
                expect.fail('Should have thrown error');
            } catch (e: any) {
                expect(e.message).to.include('system template');
            }
        });
    });

    describe('mergeTemplates', () => {
        it('should allow user templates to override system templates if names match', async () => {
            await fs.writeJson(path.join(USER_DIR, 'sys-override.json'), {
                name: 'system-template', // Same name as system template
                description: 'User Override',
                category: 'custom',
                content: 'user-override-content'
            });

            const templates = await templateLoader.loadTemplates();
            const template = templates.find(t => t.name === 'system-template');

            expect(template).to.exist;
            expect(template?.isSystem).to.be.false; // Should be the user one
            expect(template?.content).to.equal('user-override-content');
        });
    });
});
