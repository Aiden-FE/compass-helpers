import { accessSync, access, constants } from 'fs';

/**
 * @description 检查路径下文件或文件夹是否存在（同步版本）
 * @param p 文件或文件夹路径
 * @param mode 访问模式，默认检查是否存在
 * @returns 是否存在
 * @category Files
 */
export function isFileOrFolderExistsSync(p: string, mode: number = constants.F_OK): boolean {
  try {
    accessSync(p, mode);
    return true;
  } catch {
    return false;
  }
}

/**
 * @description 检查路径下文件或文件夹是否存在（异步版本）
 * @param p 文件或文件夹路径
 * @param mode 访问模式，默认检查是否存在
 * @returns 是否存在
 * @category Files
 */
export function isFileOrFolderExists(p: string, mode: number = constants.F_OK): Promise<boolean> {
  return new Promise((resolve) => {
    access(p, mode, (error) => {
      // 如果没有错误，说明文件/文件夹存在且可访问
      resolve(!error);
    });
  });
}
