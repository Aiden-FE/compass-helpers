import TaskChain from './task-chain';

describe('TaskChain', () => {
  // 基础功能测试
  describe('基础功能', () => {
    it('should execute single task correctly', async () => {
      const task = (str: string) => `${str} - processed`;
      const chain = new TaskChain(task);

      const result = await chain.start('hello');
      expect(result).toBe('hello - processed');
    });

    it('should execute multiple tasks in sequence', async () => {
      const task1 = (str: string) => `${str} - task1`;
      const task2 = (str: string) => `${str} - task2`;
      const task3 = (str: string) => `${str} - task3`;

      const chain = new TaskChain(task1).next(task2).next(task3);

      const result = await chain.start('hello');
      expect(result).toBe('hello - task1 - task2 - task3');
    });

    it('should support chaining return value', () => {
      const task1 = (str: string) => `${str} - task1`;
      const task2 = (str: string) => `${str} - task2`;

      const chain = new TaskChain(task1);
      const chainedResult = chain.next(task2);

      expect(chainedResult).toBeInstanceOf(TaskChain);
      expect(chainedResult).toBe(chain); // 应该返回同一个实例以支持链式调用
    });
  });

  // 异步任务测试
  describe('异步任务处理', () => {
    it('should handle async tasks correctly', async () => {
      const asyncTask = async (str: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return `${str} - async`;
      };

      const chain = new TaskChain(asyncTask);
      const result = await chain.start('hello');

      expect(result).toBe('hello - async');
    });

    it('should handle mixed sync and async tasks', async () => {
      const syncTask = (str: string) => `${str} - sync`;
      const asyncTask = async (str: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return `${str} - async`;
      };

      const chain = new TaskChain(syncTask).next(asyncTask).next(syncTask);

      const result = await chain.start('hello');
      expect(result).toBe('hello - sync - async - sync');
    });

    it('should handle multiple async tasks in sequence', async () => {
      const asyncTask1 = async (str: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return `${str} - async1`;
      };

      const asyncTask2 = async (str: string) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return `${str} - async2`;
      };

      const chain = new TaskChain(asyncTask1).next(asyncTask2);
      const result = await chain.start('hello');

      expect(result).toBe('hello - async1 - async2');
    });
  });

  // 任务链中止功能测试
  describe('任务链中止功能', () => {
    it('should abort task chain when abort() is called', async () => {
      const task1 = (str: string) => `${str} - task1`;
      const task2 = (str: string) => `${str} - task2`;
      const task3 = (str: string) => `${str} - task3`;

      const chain = new TaskChain(task1).next(task2).next(task3);

      // 在任务开始前中止
      chain.abort();
      const result = await chain.start('hello');

      expect(result).toBe('hello'); // 应该返回原始输入
    });

    it('should abort remaining tasks when abort() is called during execution', async () => {
      let task2Executed = false;
      let task3Executed = false;

      const task1 = (str: string) => `${str} - task1`;
      const task2 = (str: string) => {
        task2Executed = true;
        return `${str} - task2`;
      };
      const task3 = (str: string) => {
        task3Executed = true;
        return `${str} - task3`;
      };

      const chain = new TaskChain(task1)
        .next((str: string) => {
          chain.abort(); // 在执行过程中中止
          return `${str} - interrupted`;
        })
        .next(task2)
        .next(task3);

      const result = await chain.start('hello');

      expect(result).toBe('hello - task1 - interrupted');
      expect(task2Executed).toBe(false);
      expect(task3Executed).toBe(false);
    });

    it('should handle abort with multiple arguments', async () => {
      const task1 = (a: string, b: string) => `${a}-${b}`;
      const chain = new TaskChain(task1);

      chain.abort();
      const result = await chain.start('hello', 'world');

      expect(result).toEqual(['hello', 'world']); // 多参数情况下返回参数数组
    });
  });

  // 参数处理测试
  describe('参数处理', () => {
    it('should handle single parameter correctly', async () => {
      const task = (value: number) => value * 2;
      const chain = new TaskChain(task);

      const result = await chain.start(5);
      expect(result).toBe(10);
    });

    it('should handle multiple parameters correctly', async () => {
      const task = (a: number, b: number, c: number) => a + b + c;
      const chain = new TaskChain(task);

      const result = await chain.start(1, 2, 3);
      expect(result).toBe(6);
    });

    it('should pass result as single parameter to next task', async () => {
      const task1 = (a: number, b: number) => a + b;
      const task2 = (sum: number) => sum * 2;

      const chain = new TaskChain(task1).next(task2);
      const result = await chain.start(3, 4);

      expect(result).toBe(14); // (3 + 4) * 2 = 14
    });

    it('should handle no parameters', async () => {
      const task = () => 'no params';
      const chain = new TaskChain(task);

      const result = await chain.start();
      expect(result).toBe('no params');
    });
  });

  // 数据类型处理测试
  describe('数据类型处理', () => {
    it('should handle different data types', async () => {
      const numberTask = (n: number) => n.toString();
      const stringTask = (s: string) => parseInt(s, 10);
      const booleanTask = (n: number) => n > 5;

      const chain = new TaskChain(numberTask).next(stringTask).next(booleanTask);

      const result = await chain.start(10);
      expect(result).toBe(true);
    });

    it('should handle object parameters and returns', async () => {
      interface User {
        name: string;
        age: number;
      }

      const task1 = (user: User) => ({ ...user, processed: true });
      const task2 = (user: User & { processed: boolean }) => user.name.toUpperCase();

      const chain = new TaskChain(task1).next(task2);
      const result = await chain.start({ name: 'john', age: 25 });

      expect(result).toBe('JOHN');
    });

    it('should handle null and undefined values', async () => {
      const task1 = () => null;
      const task2 = (value: null) => value ?? 'default';
      const task3 = () => undefined;
      const task4 = (value: undefined) => value ?? 'fallback';

      const chain1 = new TaskChain(task1).next(task2);
      const result1 = await chain1.start();
      expect(result1).toBe('default');

      const chain2 = new TaskChain(task3).next(task4);
      const result2 = await chain2.start();
      expect(result2).toBe('fallback');
    });
  });

  // 复杂链式调用测试
  describe('复杂链式调用', () => {
    it('should handle long task chains', async () => {
      let chain = new TaskChain((n: number) => n + 1);

      // 创建一个长链条（10个任务）
      for (let i = 0; i < 9; i++) {
        chain = chain.next((n: number) => n + 1);
      }

      const result = await chain.start(0);
      expect(result).toBe(10);
    });

    it('should append tasks to existing chain', async () => {
      const task1 = (str: string) => `${str}-1`;
      const task2 = (str: string) => `${str}-2`;
      const task3 = (str: string) => `${str}-3`;
      const task4 = (str: string) => `${str}-4`;

      const chain = new TaskChain(task1).next(task2);
      chain.next(task3).next(task4); // 追加更多任务

      const result = await chain.start('start');
      expect(result).toBe('start-1-2-3-4');
    });
  });

  // 错误处理测试
  describe('错误处理', () => {
    it('should propagate errors from sync tasks', async () => {
      const errorTask = () => {
        throw new Error('Sync task error');
      };

      const chain = new TaskChain(errorTask);

      await expect(chain.start()).rejects.toThrow('Sync task error');
    });

    it('should propagate errors from async tasks', async () => {
      const asyncErrorTask = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async task error');
      };

      const chain = new TaskChain(asyncErrorTask);

      await expect(chain.start()).rejects.toThrow('Async task error');
    });

    it('should stop execution on error in chain', async () => {
      let task3Executed = false;

      const task1 = (str: string) => `${str}-1`;
      const errorTask = () => {
        throw new Error('Chain error');
      };
      const task3 = (str: string) => {
        task3Executed = true;
        return `${str}-3`;
      };

      const chain = new TaskChain(task1).next(errorTask).next(task3);

      await expect(chain.start('start')).rejects.toThrow('Chain error');
      expect(task3Executed).toBe(false);
    });
  });

  // 边界情况测试
  describe('边界情况', () => {
    it('should handle empty string input', async () => {
      const task = (str: string) => `processed: ${str}`;
      const chain = new TaskChain(task);

      const result = await chain.start('');
      expect(result).toBe('processed: ');
    });

    it('should handle zero numeric input', async () => {
      const task = (n: number) => n + 10;
      const chain = new TaskChain(task);

      const result = await chain.start(0);
      expect(result).toBe(10);
    });

    it('should handle false boolean input', async () => {
      const task = (b: boolean) => !b;
      const chain = new TaskChain(task);

      const result = await chain.start(false);
      expect(result).toBe(true);
    });

    it('should handle very fast async operations', async () => {
      const fastAsyncTask = async (str: string) => {
        await Promise.resolve(); // 最快的异步操作
        return `${str}-fast`;
      };

      const chain = new TaskChain(fastAsyncTask);
      const result = await chain.start('test');

      expect(result).toBe('test-fast');
    });
  });

  // 性能和内存测试
  describe('性能测试', () => {
    it('should handle many sequential tasks efficiently', async () => {
      const startTime = Date.now();

      let chain = new TaskChain((n: number) => n + 1);
      for (let i = 0; i < 100; i++) {
        chain = chain.next((n: number) => n + 1);
      }

      const result = await chain.start(0);
      const endTime = Date.now();

      expect(result).toBe(101);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });

    it('should handle concurrent task chains', async () => {
      const createChain = (id: number) => {
        return new TaskChain((n: number) => n + id).next((n: number) => n * 2).next((n: number) => n - 1);
      };

      const promises = [];
      for (let i = 1; i <= 10; i++) {
        promises.push(createChain(i).start(10));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results[0]).toBe((10 + 1) * 2 - 1); // 21
      expect(results[9]).toBe((10 + 10) * 2 - 1); // 39
    });
  });

  // 类型系统测试
  describe('类型系统', () => {
    it('should maintain type safety with generic result type', async () => {
      const numberTask = () => 42;
      const chain = new TaskChain(numberTask);

      const result = await chain.start<number>();
      expect(typeof result).toBe('number');
      expect(result).toBe(42);
    });

    it('should work with arrow functions', async () => {
      const chain = new TaskChain((x: number) => x * 2).next((x: number) => x + 10).next((x: number) => x.toString());

      const result = await chain.start(5);
      expect(result).toBe('20'); // (5 * 2) + 10 = 20 -> "20"
    });

    it('should work with regular functions', async () => {
      function multiplyBy3(n: number): number {
        return n * 3;
      }

      function addTen(n: number): number {
        return n + 10;
      }

      const chain = new TaskChain(multiplyBy3).next(addTen);
      const result = await chain.start(5);

      expect(result).toBe(25); // (5 * 3) + 10 = 25
    });
  });
});
