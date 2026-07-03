import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.e2e-spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/tmp/'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

export default config;
