/**
 * @description 创建任务链
 * @param {Function} fn 首位执行逻辑
 * @category Factories
 * @example
 * function task1(str) {
 *   return `${str} - task1`;
 * }
 *
 * async function task2(str) {
 *   return `${str} - task2`;
 * }
 *
 * function task3(str) {
 *   return `${str} - task3`;
 * }
 *
 * const testChain = new TaskChain(task1)
 *   .next(task2)
 *   .next(task3);
 * const result = await testChain.start('hello');
 * console.log('result: ', result); // return: 'hello - task1 - task2 - task3'
 *
 * const testChain2 = new TaskChain(task1)
 *   .next(task2)
 *   .next((str) => {
 *     testChain2.abort();
 *     console.log('主动中止了后续链条执行');
 *     return str;
 *   })
 *   .next(task3);
 * const result = await testChain.start('hello');
 * console.log('result: ', result); // return: 'hello - task1 - task2'
 */

// 任务函数类型，支持同步和异步函数
type TaskFunction = (...args: unknown[]) => unknown;

export default class TaskChain {
  // 下一条任务节点
  private nextTask?: TaskChain;

  private isAbort = false;

  constructor(private fn: TaskFunction) {}

  /**
   * @description 获取任务链内最后一个任务节点
   * @param nextTask 链条节点
   * @private
   */
  private getLastTask(nextTask: TaskChain): TaskChain {
    if (nextTask.nextTask) {
      return this.getLastTask(nextTask.nextTask);
    }
    return nextTask;
  }

  /**
   * @description 停止任务链
   */
  public abort(): void {
    this.isAbort = true;
    if (this.nextTask) {
      this.nextTask.abort();
    }
  }

  /**
   * @description 设置当前节点的下一任务节点,如果已存在下一节点将追加在链条末尾
   * @param fn 下一节点执行逻辑
   */
  public next(fn: TaskFunction): TaskChain {
    if (this.nextTask) {
      const lastTask = this.getLastTask(this.nextTask);
      lastTask.nextTask = new TaskChain(fn);
    } else {
      this.nextTask = new TaskChain(fn);
    }

    return this;
  }

  /**
   * @description 开始执行任务链
   * @param args 任务节点所接受的所有参数
   */
  public async start<TResult = unknown>(...args: unknown[]): Promise<TResult> {
    if (this.isAbort) {
      // 如果中止，返回第一个参数作为结果
      if (args.length <= 1) {
        return args[0] as TResult;
      }
      return args as unknown as TResult;
    }

    // 执行当前任务
    const result = await this.fn(...args);

    if (this.nextTask) {
      return await this.nextTask.start<TResult>(result);
    }

    return result as TResult;
  }
}
