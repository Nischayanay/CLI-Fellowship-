import { test } from '@oclif/test';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { templateLoader } from '../../src/lib/templateLoader';

const TEST_DIR = path.join(os.tmpdir(), 'pbcli-test-remove');
const SYSTEM_DIR = path.join(TEST_DIR, 'system');
const USER_DIR = path.join(TEST_DIR, 'user');

describe('Command: pb lib remove', () => {

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
    });

    test
        .do(async () => {
            await fs.writeJson(path.join(USER_DIR, 'to-remove.json'), {
                name: 'to-remove',
                description: 'Desc',
                category: 'custom',
                content: 'content'
            });
        })
        .stdout()
        .command(['lib:remove', 'to-remove'])
        .it('removes a user template', async (ctx: any) => {
            expect(ctx.stdout).to.contain('Template to-remove removed successfully');
            expect(await fs.pathExists(path.join(USER_DIR, 'to-remove.json'))).to.be.false;
        });

    test
        .stdout()
        .stderr()
        .command(['lib:remove', 'non-existent'])
        .it('handles non-existent template', (ctx: any) => {
            // The command catches the error and logs it
            expect(ctx.stderr).to.contain('Template "non-existent" not found');
        });

    test
        .do(async () => {
            await fs.writeJson(path.join(SYSTEM_DIR, 'sys.json'), [{
                name: 'sys-tmpl',
                description: 'Desc',
                category: 'system',
                content: 'content'
            }]);
        })
        .stdout()
        .stderr()
        .command(['lib:remove', 'sys-tmpl'])
        .it('prevents removing system templates', (ctx: any) => {
            expect(ctx.stderr).to.contain('This is a system template and cannot be removed');
        });
});
