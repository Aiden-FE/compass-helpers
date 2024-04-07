import { readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * @description 同步获取文件夹内所有文件路径
 * @param folderPath 文件夹路径
 * @param options 配置项
 * @param options.recursive 递归搜索所有文件
 * @returns 文件路径数组
 * @category Files
 */
export function getFilePathsInFolderSync(folderPath: string, options?: { recursive?: boolean }) {
  try {
    const files = readdirSync(folderPath);
    let filePaths: string[] = [];

    files.forEach((file) => {
      const filePath = join(folderPath, file);
      const stats = statSync(filePath);

      if (stats.isFile()) {
        // 是文件，将文件路径添加到结果数组中
        filePaths.push(filePath);
      } else if (stats.isDirectory() && options?.recursive) {
        // 是目录，递归调用函数获取子目录中的文件路径
        const subDirectoryPaths = getFilePathsInFolderSync(filePath, options);
        filePaths = filePaths.concat(subDirectoryPaths);
      }
    });

    return filePaths;
  } catch {
    return [];
  }
}

/**
 * @description 获取文件夹内所有文件路径
 * @param folderPath 文件夹路径
 * @param options 配置项
 * @param options.recursive 递归搜索所有文件
 * @returns 文件路径数组
 * @category Files
 */
export async function getFilePathsInFolder(folderPath: string, options?: { recursive?: boolean }) {
  return getFilePathsInFolderSync(folderPath, options);
}
