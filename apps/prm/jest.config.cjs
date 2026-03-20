/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchman: false,
  rootDir: '.',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@open-mercato/core/generated/(.*)$': '<rootDir>/../../open-mercato/packages/core/generated/$1',
    '^@open-mercato/core/(.*)$': '<rootDir>/../../open-mercato/packages/core/src/$1',
    '^@open-mercato/shared/(.*)$': '<rootDir>/../../open-mercato/packages/shared/src/$1',
    '^@open-mercato/ui/(.*)$': '<rootDir>/../../open-mercato/packages/ui/src/$1',
    '^#generated/(.*)$': '<rootDir>/generated/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        diagnostics: false,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx)'],
  passWithNoTests: true,
}
