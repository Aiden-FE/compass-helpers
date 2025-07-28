/**
 * @description 异步任务处理工具，将 Promise 的结果转换为 [error, result] 元组形式，避免使用 try-catch
 * @param promise 需要处理的 Promise 对象
 * @param errorExt 希望附加到错误对象上的额外属性，用于错误分类或上下文信息
 * @returns 返回一个 Promise，解析为 [error, result] 元组
 *   - 成功时：[null, result]
 *   - 失败时：[error, null]
 * @throws {TypeError} 当 promise 参数不是 Promise 对象时抛出错误
 * @category Tools
 * @example
 * // 基本用法
 * const [error, result] = await promiseTask(fetch('/api/user'));
 * if (error) {
 *   console.error('请求失败:', error.message);
 *   return;
 * }
 * console.log('用户数据:', result);
 *
 * @example
 * // 带错误扩展信息
 * const [error, data] = await promiseTask(
 *   fetchUserData(userId),
 *   { context: 'user-profile', userId }
 * );
 * if (error) {
 *   console.error('获取用户资料失败:', {
 *     message: error.message,
 *     context: error.context,
 *     userId: error.userId
 *   });
 *   return;
 * }
 *
 * @example
 * // 在循环中使用，避免中断
 * const results = [];
 * for (const url of urls) {
 *   const [error, response] = await promiseTask(fetch(url));
 *   if (error) {
 *     console.warn(`跳过失败的请求 ${url}:`, error.message);
 *     continue;
 *   }
 *   results.push(response);
 * }
 */
export default function promiseTask<
  TResult = unknown,
  TErrorExt extends Record<string, unknown> = Record<string, unknown>,
>(promise: Promise<TResult>, errorExt?: TErrorExt): Promise<[null, TResult] | [Error & TErrorExt, null]> {
  // 参数验证
  if (promise == null || typeof promise.then !== 'function') {
    throw new TypeError('第一个参数必须是一个有效的 Promise 对象');
  }

  if (errorExt !== undefined && (typeof errorExt !== 'object' || errorExt === null)) {
    throw new TypeError('errorExt 参数必须是一个对象或 undefined');
  }

  return promise
    .then<[null, TResult]>((data: TResult) => [null, data])
    .catch<[Error & TErrorExt, null]>((err: unknown) => {
      // 确保错误是 Error 对象
      let error: Error;
      if (err instanceof Error) {
        error = err;
      } else if (typeof err === 'string') {
        error = new Error(err);
      } else if (err && typeof err === 'object' && 'message' in err) {
        error = new Error(String(err.message));
        error.name = 'name' in err ? String(err.name) : 'Error';
      } else {
        error = new Error('未知错误');
        error.name = 'UnknownError';
      }

      // 如果需要扩展错误信息
      if (errorExt) {
        // 创建一个新的错误对象，避免直接修改原始错误对象
        const extendedError = new Error(error.message) as Error & TErrorExt;
        extendedError.name = error.name;
        extendedError.stack = error.stack;

        // 安全地复制扩展属性
        Object.keys(errorExt).forEach((key) => {
          if (key !== 'name' && key !== 'message' && key !== 'stack') {
            (extendedError as Record<string, unknown>)[key] = errorExt[key];
          }
        });

        return [extendedError, null];
      }

      return [error as Error & TErrorExt, null];
    });
}
