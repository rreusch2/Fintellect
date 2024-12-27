import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  external: ['express', 'passport', '@neondatabase/serverless'],
  alias: {
    '@db': resolve(projectRoot, 'db')
  },
  outExtension: { '.js': '.js' }
}); 