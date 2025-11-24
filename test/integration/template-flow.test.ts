import { test } from '@oclif/test';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as sinon from 'sinon';
import LibAdd from '../../src/commands/lib/add';
import { templateLoader } from '../../src/lib/templateLoader';

const TEST_DIR = path.join(os.tmpdir(), 'pbcli-test-integration');
const SYSTEM_DIR = path.join(TEST_DIR, 'system');
const USER_DIR = path.join(TEST_DIR, 'user');

describe('Integration: Template Lifecycle', () => {
    let promptStub: sinon.SinonStub;

    before(async () => {
        await fs.ensureDir(SYSTEM_DIR);
        await fs.ensureDir(USER_DIR);
        (templateLoader as any).systemTemplatesPath = SYSTEM_DIR;
        (templateLoader as any).userTemplatesPath = USER_DIR;
    });

    after(async () => {
        await fs.remove(TEST_DIR);
    });

    beforeEach(async () => {
        await fs.emptyDir(SYSTEM_DIR);
        await fs.emptyDir(USER_DIR);
        promptStub = sinon.stub(LibAdd.prototype, 'promptInput');
    });

    afterEach(() => {
        promptStub.restore();
    });

    test
        .do(() => {
            promptStub.onCall(0).resolves('integration-test');
            promptStub.onCall(1).resolves('Integration Desc');
            promptStub.onCall(2).resolves('Integration Content');
        })
        .stdout()
        .command(['lib:add'])
        .command(['lib:list'])
        .it('Add -> List flow', (ctx: any) => {
            // Verify Add output
            expect(ctx.stdout).to.contain('Template integration-test added successfully');

            // Verify List output
            expect(ctx.stdout).to.contain('integration-test');
            expect(ctx.stdout).to.contain('Integration Desc');

            // Verify Persistence
            const filePath = path.join(USER_DIR, 'integration-test.json');
            expect(fs.existsSync(filePath)).to.be.true;
        });

    test
        .do(async () => {
            // Pre-seed a template
            await fs.writeJson(path.join(USER_DIR, 'to-delete.json'), {
                name: 'to-delete',
                description: 'Desc',
                category: 'custom',
                content: 'content'
            });
        })
        .stdout()
        .command(['lib:list'])
        .command(['lib:remove', 'to-delete'])
        .command(['lib:list'])
        .it('List -> Remove -> List flow', (ctx: any) => {
            // First list should have it
            // Note: ctx.stdout accumulates output from all commands
            // We need to check if it disappears in the end?
            // Actually, checking accumulation is tricky if we want to verify it's GONE in the second list.
            // But we can check the remove message.

            expect(ctx.stdout).to.contain('Template to-delete removed successfully');

            // Verify Persistence
            const filePath = path.join(USER_DIR, 'to-delete.json');
            expect(fs.existsSync(filePath)).to.be.false;
        });

    test
        .do(async () => {
            // Create system template
            await fs.writeJson(path.join(SYSTEM_DIR, 'sys.json'), [{
                name: 'shared-name',
                description: 'System Version',
                category: 'system',
                content: 'sys-content'
            }]);

            // User overrides it
            promptStub.onCall(0).resolves('shared-name');
            promptStub.onCall(1).resolves('User Version');
            promptStub.onCall(2).resolves('user-content');
        })
        .stdout()
        .command(['lib:add'])
        .command(['lib:list'])
        .it('System Override Flow', (ctx: any) => {
            expect(ctx.stdout).to.contain('Template shared-name added successfully');

            // In the list output, we should see the user version
            // Since we fixed templateLoader to merge, list should show the user one.
            // But wait, does list show isSystem?
            // List logic:
            // const systemTemplates = templates.filter(t => t.isSystem);
            // const userTemplates = templates.filter(t => !t.isSystem);

            // If we override, the template returned by loadTemplates() will have isSystem: false (from user file).
            // So it should appear in "Your Templates" and NOT in "System Templates".

            expect(ctx.stdout).to.contain('Your Templates');
            // We can't easily assert it's NOT in System Templates via stdout string matching alone without parsing,
            // but we can check if the description matches the user one.
            expect(ctx.stdout).to.contain('User Version');
        });
});
