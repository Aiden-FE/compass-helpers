interface WorkerTaskOptions {
  timeout?: number; // 任务超时时间（毫秒）
  transferable?: boolean; // 是否自动检测可传输对象
}

interface WorkerPromiseController {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout?: number;
}

interface WorkerTask<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>;
  terminate: () => void;
  isActive: () => boolean;
}

type AsyncFunction<T extends unknown[], R> = (...args: T) => Promise<R> | R;

/**
 * @description 将异步函数移到独立的 Web Worker 线程中执行
 * @param asyncFunction 要在 Worker 中运行的（异步）函数
 * @param options 配置选项
 * @param options.timeout 任务超时时间（毫秒），默认不设置超时
 * @param options.transferable 是否自动检测可传输对象，默认为 true
 * @returns 返回一个可以调用的 Worker 任务函数，包含 terminate 和 isActive 方法
 * @category Tools
 * @example
 * // 基本用法
 * const workerAdd = createWorkerTask((a: number, b: number) => a + b);
 * const result = await workerAdd(1, 2); // 3
 *
 * // 异步函数
 * const workerFetch = createWorkerTask(async (url: string) => {
 *   const response = await fetch(url);
 *   return response.json();
 * });
 * const data = await workerFetch('/api/data');
 *
 * // 复杂计算任务
 * const workerCalculate = createWorkerTask((nums: number[]) => {
 *   return nums.reduce((sum, num) => sum + Math.pow(num, 2), 0);
 * });
 * const result = await workerCalculate([1, 2, 3, 4, 5]);
 *
 * // 带超时的任务
 * const workerWithTimeout = createWorkerTask(
 *   (data: unknown[]) => expensiveCalculation(data),
 *   { timeout: 5000 }
 * );
 *
 * // 清理资源
 * workerAdd.terminate();
 */
export function createWorkerTask<T extends AsyncFunction<unknown[], unknown>>(
  asyncFunction: T,
  options: WorkerTaskOptions = {},
): WorkerTask<T> {
  const { timeout, transferable = true } = options;

  // RPC 调用的唯一 ID 计数器
  let currentId = 0;

  // 存储待处理的 Promise 控制器
  const promises = new Map<number, WorkerPromiseController>();

  // 检查可传输对象的函数
  const getTransferableObjects = (args: unknown[]): Transferable[] => {
    if (!transferable) return [];

    return args.filter((obj): obj is Transferable => {
      return (
        obj instanceof ArrayBuffer ||
        obj instanceof MessagePort ||
        (typeof ImageBitmap !== 'undefined' && obj instanceof ImageBitmap) ||
        (typeof OffscreenCanvas !== 'undefined' && obj instanceof OffscreenCanvas)
      );
    });
  };

  // 创建 Worker 脚本内容
  const createWorkerScript = (fn: T): string => {
    return `
      // 用户提供的函数
      const userFunction = ${fn.toString()};

      // 消息处理器
      self.onmessage = async function(event) {
        const [id, args] = event.data;

        try {
          // 执行用户函数
          const result = await Promise.resolve(userFunction.apply(null, args));

          // 检测可传输对象
          const transferable = [];
          if (result instanceof ArrayBuffer) {
            transferable.push(result);
          } else if (result instanceof MessagePort) {
            transferable.push(result);
          } else if (typeof ImageBitmap !== 'undefined' && result instanceof ImageBitmap) {
            transferable.push(result);
          }

          // 发送成功结果
          self.postMessage([id, 'success', result], transferable);
        } catch (error) {
          // 发送错误结果
          self.postMessage([id, 'error', {
            message: error.message || String(error),
            name: error.name || 'Error',
            stack: error.stack
          }]);
        }
      };

      // 错误处理
      self.onerror = function(error) {
        console.error('Worker error:', error);
      };
    `;
  };

  let worker: Worker | null = null;
  let workerURL: string | null = null;

  try {
    // 创建 Worker 脚本 Blob
    const script = createWorkerScript(asyncFunction);
    const blob = new Blob([script], { type: 'application/javascript' });
    workerURL = URL.createObjectURL(blob);

    // 创建 Worker
    worker = new Worker(workerURL);

    // 处理来自 Worker 的消息
    worker.onmessage = (event) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [id, status, result] = event.data;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const promiseController = promises.get(id);

      if (!promiseController) {
        console.warn(`Received message for unknown promise ID: ${id}`);
        return;
      }

      // 清理超时定时器
      if (promiseController.timeout) {
        clearTimeout(promiseController.timeout);
      }

      // 从 promises 映射中移除
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      promises.delete(id);

      if (status === 'success') {
        promiseController.resolve(result);
      } else {
        // 重建错误对象
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const error = new Error(result?.message || 'Worker task failed');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        error.name = result?.name || 'WorkerError';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (result?.stack) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          error.stack = result.stack;
        }
        promiseController.reject(error);
      }
    };

    // 处理 Worker 错误
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      // 拒绝所有待处理的 Promise
      promises.forEach((controller) => {
        if (controller.timeout) {
          clearTimeout(controller.timeout);
        }
        controller.reject(new Error(`Worker error: ${error.message || 'Unknown error'}`));
      });
      promises.clear();
    };
  } catch (error) {
    throw new Error(`Failed to create worker: ${(error as Error).message}`);
  }

  // 返回代理函数
  const workerTask = ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    if (!worker) {
      return Promise.reject(new Error('Worker has been terminated'));
    }

    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      const id = ++currentId;

      // 创建超时处理
      let timeoutHandle: number | undefined;
      if (timeout && timeout > 0) {
        timeoutHandle = setTimeout(() => {
          const controller = promises.get(id);
          if (controller) {
            promises.delete(id);
            reject(new Error(`Worker task timed out after ${timeout}ms`));
          }
        }, timeout);
      }

      // 存储 Promise 控制器
      promises.set(id, {
        resolve: (value: unknown) => resolve(value as Awaited<ReturnType<T>>),
        reject,
        timeout: timeoutHandle,
      });

      try {
        // 发送任务到 Worker
        const transferableObjects = getTransferableObjects(args);
        worker!.postMessage([id, args], transferableObjects);
      } catch (error) {
        // 清理并拒绝
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        promises.delete(id);
        reject(new Error(`Failed to send message to worker: ${(error as Error).message}`));
      }
    });
  }) as WorkerTask<T>;

  // 添加终止方法
  workerTask.terminate = () => {
    if (worker) {
      // 拒绝所有待处理的 Promise
      promises.forEach((controller) => {
        if (controller.timeout) {
          clearTimeout(controller.timeout);
        }
        controller.reject(new Error('Worker was terminated'));
      });
      promises.clear();

      // 终止 Worker
      worker.terminate();
      worker = null;
    }

    // 清理 Blob URL
    if (workerURL) {
      URL.revokeObjectURL(workerURL);
      workerURL = null;
    }
  };

  // 添加状态检查方法
  workerTask.isActive = () => {
    return worker !== null;
  };

  return workerTask;
}

/**
 * @description 创建一个可重用的 Worker 池来处理多个并发任务
 * @param asyncFunction 要在 Worker 中运行的（异步）函数
 * @param poolSize Worker 池大小，默认为 4
 * @param options 配置选项
 * @returns 返回一个 Worker 池任务函数
 * @category Tools
 * @example
 * const workerPool = createWorkerPool(
 *   (data: number[]) => data.reduce((sum, n) => sum + n, 0),
 *   4 // 4 个 worker
 * );
 *
 * // 并发执行多个任务
 * const tasks = [
 *   workerPool([1, 2, 3]),
 *   workerPool([4, 5, 6]),
 *   workerPool([7, 8, 9]),
 *   workerPool([10, 11, 12])
 * ];
 *
 * const results = await Promise.all(tasks);
 *
 * // 清理资源
 * workerPool.terminate();
 */
export function createWorkerPool<T extends AsyncFunction<unknown[], unknown>>(
  asyncFunction: T,
  poolSize: number = 4,
  options: WorkerTaskOptions = {},
): WorkerTask<T> {
  const workers: WorkerTask<T>[] = [];
  let currentWorkerIndex = 0;

  // 创建 Worker 池
  for (let i = 0; i < poolSize; i++) {
    workers.push(createWorkerTask(asyncFunction, options));
  }

  // 轮询分配任务
  const poolTask = ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const worker = workers[currentWorkerIndex];
    currentWorkerIndex = (currentWorkerIndex + 1) % poolSize;
    return worker(...args);
  }) as WorkerTask<T>;

  // 终止所有 Worker
  poolTask.terminate = () => {
    workers.forEach((worker) => worker.terminate());
    workers.length = 0;
  };

  // 检查是否有活跃的 Worker
  poolTask.isActive = () => {
    return workers.some((worker) => worker.isActive());
  };

  return poolTask;
}
