/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/test/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/common/test-utils/setup.ts'],
  globalSetup: '<rootDir>/src/common/test-utils/global-setup.ts',
  globalTeardown: '<rootDir>/src/common/test-utils/global-teardown.ts',
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    'src/modules/**/*.middleware.ts',
    'src/common/**/*.ts',
    '!src/**/*.routes.ts',
    '!src/**/*.controller.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
};
