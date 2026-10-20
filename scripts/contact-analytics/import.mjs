import { readFileSync } from 'node:fs';
import { open_database, import_snapshot, DATABASE_PATH } from './database.mjs';

const snapshot_path = process.argv[2];
if (!snapshot_path) throw new Error('Usage: npm run analytics:import -- /absolute/path/snapshot.json');
const database_handle = open_database();
try {
  import_snapshot(database_handle, JSON.parse(readFileSync(snapshot_path, 'utf8')));
  console.log(`Imported report snapshot into ${DATABASE_PATH}`);
} finally {
  database_handle.close();
}
