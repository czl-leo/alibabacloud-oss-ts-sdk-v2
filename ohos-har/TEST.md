# ArkTS unit tests

Hypium Local Tests live in [`oss-v2/src/test/unit/`](oss-v2/src/test/unit/). They mock
`@ohos.net.http` and do not need a device. Linux cannot run `hvigorw test`; use Windows
or macOS.

## Local (Windows)

Install [Command Line Tools](https://developer.huawei.com/consumer/cn/download/), add
`command-line-tools\bin` to `PATH`, then from the repository root:

```bat
npm install
npm run stage:har
cd ohos-har
ohpm install --all
cd ..
npm run test:harmony
```

The log is written to `ohos-har/oss-v2/.test/default/intermediates/test/coverage_data/test_result.txt`.

## GitHub Actions

[`.github/workflows/harmony.yml`](../.github/workflows/harmony.yml):

| Job | Runner | What it runs |
|---|---|---|
| `harmony-build` | `ubuntu-latest` + `harmonyos-ci-image:v5.0.4` | `typecheck:harmony` and `build:har` (Linux cannot execute Local Test) |
| `harmony-test` | `windows-latest` | `npm run test:harmony` on every push/PR |
| `harmony-test-mate60` | self-hosted `[self-hosted, Windows, mate60]` | the same unit tests, then `onDeviceTest` on the USB-connected Mate 60 |

`harmony-test` needs **`HARMONY_CLT_URL`** as a repository secret or variable: a direct
download URL for the **Windows** Command Line Tools zip (the file that unpacks to
`command-line-tools\`). Set it on every GitHub repo that should run the job (your fork and
the upstream). Optional variable **`HARMONY_CLT_VERSION`** is the cache key when you change
that zip.

`harmony-test-mate60` does not run on pull requests (including forks). Trigger it with a push
to `main` / `dev-*`, or **Run workflow**. The Mate 60 is the device, not the runner:

1. On the Windows PC that has the phone plugged in, install [GitHub Actions runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners) with label `mate60`.
2. Install DevEco Studio or Command Line Tools on that PC; `hvigorw` and `hdc` must be on `PATH`.
3. Unlock the Mate 60, enable USB debugging, authorize the PC (`hdc list targets` must show the phone).
4. Debug signing must already work on that machine (the sample `build-profile.json5` has empty `signingConfigs`; DevEco automatic signing on the host is the usual setup).

Device tests are [`samples/harmony/entry/src/ohosTest/`](../samples/harmony/entry/src/ohosTest/):

```bat
npm run build:har
cd samples\harmony\entry
ohpm install --no-save ..\..\..\alicloud-oss-v2-*.har @ohos\hypium@1.0.19 @ohos\hamock@1.0.0
cd ..\..
npm run test:harmony:device
```

`test:harmony:device` needs a signed HAP. The sample ships with empty `signingConfigs`, so either
open `samples/harmony` in DevEco and enable automatic signing for `com.example.ossverify`, or run
the local helper (uses an existing DevEco project's debug profile, then restores files):

```bat
node scripts/run-harmony-device-test-local.mjs
```

Optional env: `HARMONY_SIGNING_SOURCE` (path to a `build-profile.json5` that already has
`signingConfigs`), `HARMONY_SIGNING_BUNDLE` (bundleName allowed by that profile). Do not commit
signing passwords into this repository.

## Failures

- `Linux环境暂不支持单元测试` / hang at `> hvigor Linux`: you are on Linux. Use `windows-latest` or a Windows host.
- `HARMONY_CLT_URL` missing: add the Windows zip URL as a repo secret.
- `SDK component missing`: do not mix DevEco Studio's `hvigorw` with Command Line Tools' SDK (or the reverse).
- `hdc` empty / `[Empty]`: cable, USB debugging, or the `mate60` runner is not the PC attached to the phone.
- Test log not in the job summary: download the `harmony-unit-test-windows` or `harmony-test-mate60` artifact.
