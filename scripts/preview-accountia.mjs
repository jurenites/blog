import { createServer as create_server } from 'vite';
import { fileURLToPath as file_url_to_path } from 'node:url';

const project_directory = file_url_to_path(new URL('../', import.meta.url));
const preview_server = await create_server({
  configFile: false,
  root: project_directory,
  publicDir: 'src/public',
  server: { host: '127.0.0.1', port: 6011, strictPort: true },
});
await preview_server.listen();
console.log('Accountia preview: http://127.0.0.1:6011/previews/accountia/');
