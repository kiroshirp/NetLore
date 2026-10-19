import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {metadataHtml,publicRoutes} from './src/page-metadata.mjs';

// Real entry points also support refreshing clean URLs on static hosts.
function staticRoutes() {
  let outputDirectory;
  return {
    name: 'netlore-static-routes',
    apply: 'build',
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const html = await readFile(resolve(outputDirectory, 'index.html'), 'utf8');
      const siteUrl=process.env.NETLORE_SITE_URL||'https://kiroshirp.github.io/NetLore/';
      await writeFile(resolve(outputDirectory,'index.html'),metadataHtml(html,'',siteUrl));
      for (const route of [...publicRoutes,'admin']) {
        const directory = resolve(outputDirectory, route);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, 'index.html'), metadataHtml(html,route,siteUrl));
      }
    },
  };
}

export default defineConfig({
  base: process.env.NETLORE_BASE_PATH || '/',
  plugins: [react(), staticRoutes()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
});
