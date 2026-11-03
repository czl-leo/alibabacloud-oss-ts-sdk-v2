/**
 * Local-only Mate 60 helper. Copies debug signing from an existing DevEco
 * project, aligns bundleName for that profile, runs onDeviceTest, then restores.
 * Do not commit the temporary edits; this script always restores in `finally`.
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SAMPLE_BP = resolve(ROOT, 'samples/harmony/build-profile.json5')
const SAMPLE_APP = resolve(ROOT, 'samples/harmony/AppScope/app.json5')
const SOURCE_BP = process.env.HARMONY_SIGNING_SOURCE
  ?? 'D:\\cases\\CommonAppDevelopment\\build-profile.json5'
const SOURCE_BUNDLE = process.env.HARMONY_SIGNING_BUNDLE ?? 'com.north.cases.debug'

/**
 * @param {string} text
 * @returns {string}
 */
function extractSigningBlock(text) {
  const match = /"?signingConfigs"?\s*:/.exec(text)
  if (!match) {
    throw new Error(`No signingConfigs in ${SOURCE_BP}`)
  }
  const start = match.index
  let i = text.indexOf('[', start)
  if (i < 0) {
    throw new Error(`signingConfigs array missing in ${SOURCE_BP}`)
  }
  let depth = 0
  let end = -1
  for (let p = i; p < text.length; p += 1) {
    const ch = text[p]
    if (ch === '[') depth += 1
    if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        end = p
        break
      }
    }
  }
  if (end < 0) {
    throw new Error(`Unclosed signingConfigs in ${SOURCE_BP}`)
  }
  // Keep only the first named "default" entry if the source lists several.
  const block = text.slice(i, end + 1)
  const nameAt = block.search(/\{\s*"?name"?\s*:\s*"default"/)
  if (nameAt >= 0) {
    let depth = 0
    for (let p = nameAt; p < block.length; p += 1) {
      if (block[p] === '{') depth += 1
      if (block[p] === '}') {
        depth -= 1
        if (depth === 0) {
          return `[\n${block.slice(nameAt, p + 1)}\n]`
        }
      }
    }
  }
  return block
}

const bpOrig = readFileSync(SAMPLE_BP, 'utf8')
const appOrig = readFileSync(SAMPLE_APP, 'utf8')
const source = readFileSync(SOURCE_BP, 'utf8')
const signingConfigs = extractSigningBlock(source)

if (!/"?name"?\s*:\s*"default"/.test(signingConfigs) && !/name:\s*"default"/.test(signingConfigs)) {
  throw new Error('Source signingConfigs has no name "default"')
}

const bpPatched = bpOrig.replace(/signingConfigs:\s*\[\s*\]/, `signingConfigs: ${signingConfigs}`)
if (bpPatched === bpOrig) {
  throw new Error('Failed to inject signingConfigs into samples/harmony/build-profile.json5')
}

const appPatched = appOrig.replace(
  /("bundleName"\s*:\s*")[^"]+(")/,
  `$1${SOURCE_BUNDLE}$2`
)
if (appPatched === appOrig) {
  throw new Error('Failed to patch AppScope bundleName')
}

copyFileSync(SAMPLE_BP, `${SAMPLE_BP}.bak-local`)
copyFileSync(SAMPLE_APP, `${SAMPLE_APP}.bak-local`)
writeFileSync(SAMPLE_BP, bpPatched)
writeFileSync(SAMPLE_APP, appPatched)

let status = 1
try {
  const result = spawnSync(
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
    { cwd: resolve(ROOT, 'samples/harmony'), stdio: 'inherit', shell: true }
  )
  status = result.status ?? 1
} finally {
  writeFileSync(SAMPLE_BP, bpOrig)
  writeFileSync(SAMPLE_APP, appOrig)
  console.log('restored samples/harmony/build-profile.json5 and AppScope/app.json5')
}

process.exit(status)
