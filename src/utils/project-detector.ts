import fs from 'fs-extra';
import path from 'path';

export type ProjectFramework = 'Next.js' | 'React' | 'Vite' | 'Node' | 'Supabase' | 'Unknown';

export const projectDetector = {
    detect: async (cwd: string = process.cwd()): Promise<{ framework: ProjectFramework; version?: string }> => {
        const pkgPath = path.join(cwd, 'package.json');
        if (!await fs.pathExists(pkgPath)) {
            return { framework: 'Unknown' };
        }

        try {
            const pkg = await fs.readJson(pkgPath);
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps['next']) return { framework: 'Next.js', version: deps['next'] };
            if (deps['vite']) return { framework: 'Vite', version: deps['vite'] };
            if (deps['react']) return { framework: 'React', version: deps['react'] };
            if (deps['@supabase/supabase-js']) return { framework: 'Supabase', version: deps['@supabase/supabase-js'] };

            return { framework: 'Node' };
        } catch (error) {
            return { framework: 'Unknown' };
        }
    }
};
