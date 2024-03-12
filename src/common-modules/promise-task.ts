/**
 * @description 异步事务处理, 捕获异常不阻塞程序
 * @param promise
 * @param [errorExt] 希望附加的额外错误信息数据
 */
export default function promiseTask<Result = unknown, ExtraProperty extends object = object>(
  promise: Promise<Result>,
  errorExt?: ExtraProperty,
): Promise<[(Error & ExtraProperty) | Error | null, Result | null]> {
  return promise
    .then<[null, Result]>((data: Result) => [null, data])
    .catch<[(Error & ExtraProperty) | Error, null]>((err: Error) => {
      if (errorExt) {
        return [{ ...err, ...errorExt }, null];
      }
      return [err, null];
    });
}
