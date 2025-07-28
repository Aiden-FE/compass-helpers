import { readdirSync, statSync, readdir, stat } from 'fs';
import { join } from 'path';

interface GetFilePathsOptions {
  recursive?: boolean;
  includeDirectories?: boolean;
  fileFilter?: (filePath: string) => boolean;
  directoryFilter?: (dirPath: string) => boolean;
}

/**
 * @description 同步获取文件夹内所有文件路径
 * @param folderPath 文件夹路径
 * @param options 配置项
 * @param options.recursive 递归搜索所有文件，默认 false
 * @param options.includeDirectories 是否包含目录路径，默认 false
 * @param options.fileFilter 文件过滤器函数
 * @param options.directoryFilter 目录过滤器函数
 * @returns 文件路径数组
 * @category Files
 */
export function getFilePathsInFolderSync(folderPath: string, options?: GetFilePathsOptions): string[] {
  try {
    const files = readdirSync(folderPath);
    let filePaths: string[] = [];

    files.forEach((file) => {
      const filePath = join(folderPath, file);
      const stats = statSync(filePath);

      if (stats.isFile()) {
        // 应用文件过滤器
        if (!options?.fileFilter || options.fileFilter(filePath)) {
          filePaths.push(filePath);
        }
      } else if (stats.isDirectory()) {
        // 应用目录过滤器
        if (!options?.directoryFilter || options.directoryFilter(filePath)) {
          // 如果需要包含目录路径
          if (options?.includeDirectories) {
            filePaths.push(filePath);
          }

          // 如果需要递归搜索
          if (options?.recursive) {
            const subDirectoryPaths = getFilePathsInFolderSync(filePath, options);
            filePaths = filePaths.concat(subDirectoryPaths);
          }
        }
      }
    });

    return filePaths;
  } catch {
    return [];
  }
}

/**
 * @description Promise 化的 readdir
 */
function readdirAsync(path: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readdir(path, (error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}

/**
 * @description Promise 化的 stat
 */
function statAsync(path: string): Promise<import('fs').Stats> {
  return new Promise((resolve, reject) => {
    stat(path, (error, stats) => {
      if (error) {
        reject(error);
      } else {
        resolve(stats);
      }
    });
  });
}

/**
 * @description 异步获取文件夹内所有文件路径
 * @param folderPath 文件夹路径
 * @param options 配置项
 * @param options.recursive 递归搜索所有文件，默认 false
 * @param options.includeDirectories 是否包含目录路径，默认 false
 * @param options.fileFilter 文件过滤器函数
 * @param options.directoryFilter 目录过滤器函数
 * @returns 文件路径数组
 * @category Files
 */
export async function getFilePathsInFolder(folderPath: string, options?: GetFilePathsOptions): Promise<string[]> {
  try {
    const files = await readdirAsync(folderPath);
    const results: string[] = [];

    // 并行处理所有文件和目录
    const promises = files.map(async (file) => {
      const filePath = join(folderPath, file);

      try {
        const stats = await statAsync(filePath);
        const fileResults: string[] = [];

        if (stats.isFile()) {
          // 应用文件过滤器
          if (!options?.fileFilter || options.fileFilter(filePath)) {
            fileResults.push(filePath);
          }
        } else if (stats.isDirectory()) {
          // 应用目录过滤器
          if (!options?.directoryFilter || options.directoryFilter(filePath)) {
            // 如果需要包含目录路径
            if (options?.includeDirectories) {
              fileResults.push(filePath);
            }

            // 如果需要递归搜索
            if (options?.recursive) {
              const subDirectoryPaths = await getFilePathsInFolder(filePath, options);
              fileResults.push(...subDirectoryPaths);
            }
          }
        }

        return fileResults;
      } catch {
        // 忽略单个文件/目录的错误，继续处理其他项
        return [];
      }
    });

    // 等待所有 Promise 完成并合并结果
    const allResults = await Promise.all(promises);
    allResults.forEach((fileResults) => {
      results.push(...fileResults);
    });

    return results;
  } catch {
    return [];
  }
}
