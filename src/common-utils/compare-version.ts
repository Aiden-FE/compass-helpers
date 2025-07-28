/**
 * @description 比较两个版本的大小
 * @category Tools
 * @param currentVersion 当前版本
 * @param comparedVersion 比较的版本
 * @param trimSymbolPattern 匹配正则，符合条件的字符在移除后进行比较，默认匹配v字符
 * @return {1 | -1 | 0} 1大于比较版本；-1小于比较版本；0等于比较版本
 * @throws {Error} 当版本号格式无效时抛出错误
 * @example
 *   compareVersion('v1.0.0', '2.0.0') // return -1
 *   compareVersion('a2.0.0', 'B1.0.0', /a|b/ig) // return 1
 *   compareVersion('v1.0.0', 'V1.0.0') // return 0
 *   compareVersion('1.0.0', '1.0.0-alpha') // throw Error
 */
export default function compareVersion(
  currentVersion: string,
  comparedVersion: string,
  trimSymbolPattern: RegExp = /v/gi,
): 1 | -1 | 0 {
  // 参数验证
  if (typeof currentVersion !== 'string' || typeof comparedVersion !== 'string') {
    throw new Error('版本号必须为字符串类型');
  }

  if (!currentVersion.trim() || !comparedVersion.trim()) {
    throw new Error('版本号不能为空');
  }

  // 清理版本号
  const cleanCurrentVersion = currentVersion.replace(trimSymbolPattern, '').trim();
  const cleanComparedVersion = comparedVersion.replace(trimSymbolPattern, '').trim();

  // 验证版本号格式（只允许数字和点）
  const versionRegex = /^[0-9]+(\.[0-9]+)*$/;
  if (!versionRegex.test(cleanCurrentVersion)) {
    throw new Error(`无效的版本号格式: ${currentVersion}`);
  }
  if (!versionRegex.test(cleanComparedVersion)) {
    throw new Error(`无效的版本号格式: ${comparedVersion}`);
  }

  const v1Parts = cleanCurrentVersion.split('.');
  const v2Parts = cleanComparedVersion.split('.');
  const maxLen = Math.max(v1Parts.length, v2Parts.length);

  // 比较每个版本段
  for (let i = 0; i < maxLen; i += 1) {
    // 使用 0 填充缺失的版本段
    const num1 = parseInt(v1Parts[i] || '0', 10);
    const num2 = parseInt(v2Parts[i] || '0', 10);

    if (num1 > num2) {
      return 1;
    }
    if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}
