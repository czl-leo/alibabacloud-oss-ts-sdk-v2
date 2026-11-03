import { spawnSync } from 'node:child_process'

const PROJECT = 'ohos-har'
const test = spawnSync(
  'hvigorw',
  ['test', '-p', 'module=oss_v2', '-p', 'coverage=false', '--no-daemon'],
  { cwd: PROJECT, stdio: 'inherit', shell: true }
)
if (test.status !== 0) {
  process.exit(test.status ?? 1)
}
