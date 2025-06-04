export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  extensionsToTreatAsEsm: ['.jsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
