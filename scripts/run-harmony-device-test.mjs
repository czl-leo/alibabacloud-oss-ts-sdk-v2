import { spawnSync } from 'node:child_process'

const PROJECT = 'samples/harmony'
const test = spawnSync(
  'hvigorw',
  [
    '--mode',
    'module',
    '-p',
    'module=entry@ohosTest',
    '-p',
    'product=default',
    '-p',
    'buildMode=debug',
    '-p',
    'requiredDeviceType=phone',
    'onDeviceTest',
    '--no-daemon',
  ],
  { cwd: PROJECT, stdio: 'inherit', shell: true }
)
if (test.status !== 0) {
  process.exit(test.status ?? 1)
}
