import promiseTask from './promise-task';

describe('promiseTask', () => {
  describe('成功情况', () => {
    test('应该返回 [null, result] 当 Promise 成功时', async () => {
      const testData = { id: 1, name: 'test' };
      const promise = Promise.resolve(testData);

      const [error, result] = await promiseTask(promise);

      expect(error).toBeNull();
      expect(result).toEqual(testData);
    });

    test('应该正确处理字符串结果', async () => {
      const testString = 'hello world';
      const promise = Promise.resolve(testString);

      const [error, result] = await promiseTask(promise);

      expect(error).toBeNull();
      expect(result).toBe(testString);
    });

    test('应该正确处理数字结果', async () => {
      const testNumber = 42;
      const promise = Promise.resolve(testNumber);

      const [error, result] = await promiseTask(promise);

      expect(error).toBeNull();
      expect(result).toBe(testNumber);
    });
  });

  describe('错误情况', () => {
    test('应该返回 [error, null] 当 Promise 失败时', async () => {
      const testError = new Error('测试错误');
      const promise = Promise.reject(testError);

      const [error, result] = await promiseTask(promise);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('测试错误');
      expect(result).toBeNull();
    });

    test('应该正确处理字符串错误', async () => {
      const errorMessage = '字符串错误';
      const promise = Promise.reject(new Error(errorMessage));

      const [error, result] = await promiseTask(promise);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe(errorMessage);
      expect(result).toBeNull();
    });

    test('应该正确处理对象错误', async () => {
      const errorObj = new Error('对象错误');
      errorObj.name = 'CustomError';
      const promise = Promise.reject(errorObj);

      const [error, result] = await promiseTask(promise);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('对象错误');
      expect(error?.name).toBe('CustomError');
      expect(result).toBeNull();
    });

    test('应该正确处理未知类型错误', async () => {
      const promise = Promise.reject(new Error('未知错误'));

      const [error, result] = await promiseTask(promise);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('未知错误');
      expect(result).toBeNull();
    });
  });

  describe('错误扩展功能', () => {
    test('应该正确扩展错误对象', async () => {
      const testError = new Error('原始错误');
      const promise = Promise.reject(testError);
      const errorExt = { context: 'test-context', userId: 123 };

      const [error, result] = await promiseTask(promise, errorExt);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('原始错误');
      expect((error as unknown as { context: string; userId: number })?.context).toBe('test-context');
      expect((error as unknown as { context: string; userId: number })?.userId).toBe(123);
      expect(result).toBeNull();
    });

    test('扩展属性不应该覆盖关键的错误属性', async () => {
      const testError = new Error('原始错误');
      testError.name = 'OriginalError';
      const promise = Promise.reject(testError);
      const errorExt = {
        name: 'ShouldNotOverride',
        message: 'Should not override',
        stack: 'Should not override',
        context: 'test-context',
      };

      const [error, result] = await promiseTask(promise, errorExt);

      expect(error?.message).toBe('原始错误');
      expect(error?.name).toBe('OriginalError');
      expect((error as unknown as { context: string })?.context).toBe('test-context');
      expect(result).toBeNull();
    });

    test('应该为字符串错误添加扩展信息', async () => {
      const errorMessage = '字符串错误';
      const promise = Promise.reject(new Error(errorMessage));
      const errorExt = { requestId: 'req-123', timestamp: Date.now() };

      const [error, result] = await promiseTask(promise, errorExt);

      expect(error?.message).toBe(errorMessage);
      expect((error as unknown as { requestId: string; timestamp: number })?.requestId).toBe('req-123');
      expect((error as unknown as { requestId: string; timestamp: number })?.timestamp).toEqual(expect.any(Number));
      expect(result).toBeNull();
    });
  });

  describe('参数验证', () => {
    test('应该抛出 TypeError 当第一个参数不是 Promise', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument
        promiseTask(null as any);
      }).toThrow(TypeError);
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument
        promiseTask(null as any);
      }).toThrow('第一个参数必须是一个有效的 Promise 对象');
    });

    test('应该抛出 TypeError 当第一个参数不是类似 Promise 的对象', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument
        promiseTask({} as any);
      }).toThrow(TypeError);
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument
        promiseTask('not a promise' as any);
      }).toThrow(TypeError);
    });

    test('应该抛出 TypeError 当 errorExt 不是对象', () => {
      const promise = Promise.resolve('test');

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises
        promiseTask(promise, 'not an object' as any);
      }).toThrow(TypeError);
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises
        promiseTask(promise, 'not an object' as any);
      }).toThrow('errorExt 参数必须是一个对象或 undefined');
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    test('应该接受 undefined 作为 errorExt', async () => {
      const promise = Promise.resolve('test');

      expect(async () => {
        await promiseTask(promise, undefined);
      }).not.toThrow();
    });
  });

  describe('类型安全', () => {
    test('应该保持结果的类型信息', async () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'John' };
      const promise = Promise.resolve(user);

      const [error, result] = await promiseTask(promise);

      expect(error).toBeNull();
      expect(result).toEqual(user);
      // TypeScript 应该推断 result 的类型为 User | null
    });

    test('应该保持错误扩展的类型信息', async () => {
      interface ErrorContext extends Record<string, unknown> {
        requestId: string;
        userId: number;
      }

      const promise = Promise.reject(new Error('test'));
      const errorExt: ErrorContext = { requestId: 'req-123', userId: 456 };

      const [error, result] = await promiseTask(promise, errorExt);

      expect(error).toBeInstanceOf(Error);
      expect((error as unknown as ErrorContext)?.requestId).toBe('req-123');
      expect((error as unknown as ErrorContext)?.userId).toBe(456);
      expect(result).toBeNull();
    });
  });

  describe('实际使用场景', () => {
    test('网络请求场景', async () => {
      // 模拟成功的网络请求
      const mockFetch = () => Promise.resolve({ data: 'success' });

      const [error, result] = await promiseTask(mockFetch());

      expect(error).toBeNull();
      expect(result).toEqual({ data: 'success' });
    });

    test('批量处理场景', async () => {
      const urls = ['url1', 'url2', 'url3'];
      const results: string[] = [];

      for (const url of urls) {
        // 模拟一些请求成功，一些失败
        const mockRequest =
          url === 'url2' ? Promise.reject(new Error(`Failed to fetch ${url}`)) : Promise.resolve(`Data from ${url}`);

        const [error, data] = await promiseTask(mockRequest, { url });

        if (error) {
          console.warn(`跳过失败的请求 ${url}:`, error.message);
          continue;
        }

        if (data) {
          results.push(data);
        }
      }

      expect(results).toHaveLength(2);
      expect(results).toEqual(['Data from url1', 'Data from url3']);
    });
  });
});
