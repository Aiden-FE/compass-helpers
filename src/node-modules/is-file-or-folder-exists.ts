import { accessSync } from 'fs';

/**
 * @description 检查路径下文件或文件夹是否存在
 * @param {string} p 文件或文件夹路径
 * @returns {boolean}
 * @category Files
 */
export default function isFileOrFolderExists(p: string): boolean {
  try {
    accessSync(p);
    return true;
  } catch (err) {
    return false;
  }
}
