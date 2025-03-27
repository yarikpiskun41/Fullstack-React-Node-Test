export default {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/../setupTests.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/../src'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/../tsconfig.node.json',
      },
    ],
  },
};