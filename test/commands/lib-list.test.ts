import { test } from '@oclif/test';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { templateLoader } from '../../src/lib/templateLoader';

const TEST_DIR = path.join(os.tmpdir(), 'pbcli-test-list');
const SYSTEM_DIR = path.join(TEST_DIR, 'system');
const USER_DIR = path.join(TEST_DIR, 'user');

describe('Command: pb lib list', () => {

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
        .stdout()
        .command(['lib:list'])
        .it('runs lib:list with no templates', (ctx: any) => {
            expect(ctx.stdout).to.contain('System Templates');
            expect(ctx.stdout).to.contain('No system templates found');
            expect(ctx.stdout).to.contain('Your Templates');
            expect(ctx.stdout).to.contain('No user templates found');
        });

    test
        .do(async () => {
            await fs.writeJson(path.join(SYSTEM_DIR, 'sys.json'), [{
                name: 'sys-tmpl',
                description: 'System Desc',
                category: 'system',
                content: 'content'
            }]);
        })
        .stdout()
        .command(['lib:list'])
        .it('runs lib:list with system templates', (ctx: any) => {
            expect(ctx.stdout).to.contain('sys-tmpl');
            expect(ctx.stdout).to.contain('(system)');
            expect(ctx.stdout).to.contain('System Desc');
        });

    test
        .do(async () => {
            await fs.writeJson(path.join(USER_DIR, 'user.json'), {
                name: 'user-tmpl',
                description: 'User Desc',
                category: 'custom',
                content: 'content'
            });
        })
        .stdout()
        .command(['lib:list'])
        .it('runs lib:list with user templates', (ctx: any) => {
            expect(ctx.stdout).to.contain('user-tmpl');
            expect(ctx.stdout).to.contain('(custom)');
            expect(ctx.stdout).to.contain('User Desc');
        });

    test
        .do(async () => {
            await fs.writeJson(path.join(SYSTEM_DIR, 'sys.json'), [{
                name: 'sys-tmpl',
                description: 'System Desc',
                category: 'system',
                content: 'content'
            }]);
            await fs.writeJson(path.join(USER_DIR, 'user.json'), {
                name: 'user-tmpl',
                description: 'User Desc',
                category: 'custom',
                content: 'content'
            });
        })
        .stdout()
        .command(['lib:list'])
        .it('runs lib:list with both system and user templates', (ctx: any) => {
            expect(ctx.stdout).to.contain('System Templates');
            expect(ctx.stdout).to.contain('sys-tmpl');
            expect(ctx.stdout).to.contain('Your Templates');
            expect(ctx.stdout).to.contain('user-tmpl');
        });
});
