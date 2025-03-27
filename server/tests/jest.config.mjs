export default {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/../setupTests.ts'], // Move up one directory to client/
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
  },
};