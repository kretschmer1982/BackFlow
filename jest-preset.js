const path = require('path');
const detoxConfig = require('./detox.config');

module.exports = {
  preset: 'detox',
  testRunner: 'jest-circus/runner',
  testEnvironment: 'node',
  setupFilesAfterEnv: [path.resolve(__dirname, 'e2e/init.js')],
  testTimeout: 120000,
  reporters: ['default'],
  rootDir: path.resolve(__dirname),
  ...detoxConfig.testRunner?.args,
};

