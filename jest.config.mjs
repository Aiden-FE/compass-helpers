export default {
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  preset: 'ts-jest',
  rootDir: '.',
  // 测试文件匹配模式（只测试 src 目录下的测试文件）
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)',
  ],

  // 忽略的测试路径
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/examples/', '<rootDir>/dist/', '<rootDir>/lib/'],
};
