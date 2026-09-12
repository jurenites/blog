// Run only after a successful Storybook build; dashboard-only builds do not
// certify that the Storybook bundle matches current source.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { source_fingerprint } from './report.mjs';
const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
await writeFile(new URL('../../storybook-static/component-status-build.json', import.meta.url), JSON.stringify({ built_at: new Date().toISOString(), source_fingerprint: await source_fingerprint(PROJECT_ROOT) }, null, 2));
