import { execFileSync } from 'node:child_process';
import { writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PROJECT_ROOT, REPORT_DIRECTORY } from './server.mjs';
import { source_fingerprint, validate_report } from './report.mjs';
const pipeline_checks = [];
for (const [check_key, check_label, command_args] of [
  ['report-contract', 'Status report and image checks', ['--test', 'tests/component-status.test.mjs']],
  ['documentation', 'Documentation consistency', ['scripts/check-docs-freshness.mjs']],
  ['version', 'Release version consistency', ['scripts/project-version.mjs', 'check']],
]) {
  try {
    const command_output = execFileSync(process.execPath, command_args, { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 60000 });
    pipeline_checks.push({ check_key, check_label, status: 'passed', message: 'Local check completed successfully.', details: { command_args, command_output } });
  } catch (command_error) {
    pipeline_checks.push({ check_key, check_label, status: 'failed', message: 'Local check failed. Inspect its output.', details: { command_args, command_output: String(command_error.stdout ?? '') + String(command_error.stderr ?? ''), exit_code: command_error.status } });
  }
}
const report_data = validate_report({
  schema_version: 1, source_name: 'local-diagnostics', checked_at: new Date().toISOString(),
  source_fingerprint: await source_fingerprint(PROJECT_ROOT),
  source_commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim(),
  source_dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim()),
  components: [], pipeline_checks,
});
await mkdir(REPORT_DIRECTORY, { recursive: true });
const report_path = resolve(REPORT_DIRECTORY, 'report-local-diagnostics.json');
await writeFile(`${report_path}.tmp`, JSON.stringify(report_data, null, 2));
await rename(`${report_path}.tmp`, report_path);
console.log(pipeline_checks.map((check_result) => `${check_result.status.toUpperCase()} ${check_result.check_label}`).join('\n'));
process.exitCode = pipeline_checks.some((check_result) => check_result.status === 'failed') ? 1 : 0;
