const detoxConfig = require('../detox.config');

module.exports = {
  preset: 'detox',
  testRunner: 'jest-circus/runner',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['../e2e/init.js'],
  testTimeout: 120000,
  reporters: ['default'],
  rootDir: process.cwd(),
  ...detoxConfig.testRunner?.args,
};

