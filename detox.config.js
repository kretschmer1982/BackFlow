/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      config: 'e2e/jest.config.js',
    },
    jest: require('detox/runners/jest').runner,
  },
  testEnvironment: 'node',
  apps: {
    androidDebug: {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
    },
  },
  configurations: {
    'android.emu.debug': {
      device: {
        type: 'android.emulator',
        avdName: 'Pixel_7_API_34',
      },
      build: 'cd android && gradlew.bat assembleDebug',
      app: 'androidDebug',
    },
  },
  behavior: {
    init: {
      reinstallApp: true,
    },
  },
  artifacts: {
    rootDir: 'artifacts/detox',
    plugins: {
      log: { enabled: true },
      screenshot: { shouldTakeAutomaticSnapshots: false, shouldTakeWhen: 'manual' },
      video: { enabled: false },
    },
  },
};
