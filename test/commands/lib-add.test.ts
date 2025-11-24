import { test } from '@oclif/test';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as sinon from 'sinon';
import LibAdd from '../../src/commands/lib/add';
import { templateLoader } from '../../src/lib/templateLoader';

const TEST_DIR = path.join(os.tmpdir(), 'pbcli-test-add');
const USER_DIR = path.join(TEST_DIR, 'user');

describe('Command: pb lib add', () => {
    let promptStub: sinon.SinonStub;

    before(async () => {
        await fs.ensureDir(USER_DIR);
        (templateLoader as any).userTemplatesPath = USER_DIR;
    });

    after(async () => {
        await fs.remove(TEST_DIR);
    });

    beforeEach(async () => {
        await fs.emptyDir(USER_DIR);
        // Stub the promptInput method on the prototype
        promptStub = sinon.stub(LibAdd.prototype, 'promptInput');
    });

    afterEach(() => {
        promptStub.restore();
    });

    test
        .do(() => {
            promptStub.onCall(0).resolves('new-template'); // Name
            promptStub.onCall(1).resolves('Description'); // Description
            promptStub.onCall(2).resolves('Content'); // Content
        })
        .stdout()
        .command(['lib:add'])
        .it('adds a new template successfully', async (ctx: any) => {
            expect(ctx.stdout).to.contain('Template new-template added successfully');

            const filePath = path.join(USER_DIR, 'new-template.json');
            expect(await fs.pathExists(filePath)).to.be.true;

            const content = await fs.readJson(filePath);
            expect(content.name).to.equal('new-template');
            expect(content.content).to.equal('Content');
        });

    test
        .do(() => {
            promptStub.onCall(0).resolves(''); // Missing Name
            promptStub.onCall(1).resolves('Description');
            promptStub.onCall(2).resolves('Content');
        })
        .stdout()
        .stderr()
        .command(['lib:add'])
        .it('fails when name is missing', (ctx: any) => {
            expect(ctx.stderr).to.contain('Name and content are required');
        });

    test
        .do(() => {
            promptStub.onCall(0).resolves('name');
            promptStub.onCall(1).resolves('Description');
            promptStub.onCall(2).resolves(''); // Missing Content
        })
        .stdout()
        .stderr()
        .command(['lib:add'])
        .it('fails when content is missing', (ctx: any) => {
            expect(ctx.stderr).to.contain('Name and content are required');
        });
});
