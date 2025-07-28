import { resolve } from 'path';
import { stat, mkdir, mkdirSync, statSync } from 'fs';

interface CreateFolderOptions {
  cwd?: string;
  recursive?: boolean;
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
 * @description Promise 化的 mkdir
 */
function mkdirAsync(path: string, options?: { recursive?: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    mkdir(path, options, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * @description 创建文件夹（异步版本）
 * @param targetPath 目标路径
 * @param options 配置项
 * @param options.cwd 执行路径，默认为 process.cwd()
 * @param options.recursive 是否递归创建父目录，默认为 true
 * @category Files
 */
export async function createFolder(targetPath: string, options?: CreateFolderOptions): Promise<void> {
  const { cwd = process.cwd(), recursive = true } = options || {};
  const target = resolve(cwd, targetPath);

  try {
    const stats = await statAsync(target);

    // 如果路径存在且是目录，直接返回
    if (stats.isDirectory()) {
      return;
    }

    // 如果路径存在但是文件，抛出错误
    if (stats.isFile()) {
      throw new Error(`Cannot create directory '${target}': File exists`);
    }
  } catch (error) {
    // 如果是 ENOENT 错误（路径不存在），继续创建目录
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  try {
    await mkdirAsync(target, { recursive });
  } catch (error) {
    // 如果目录已存在，忽略错误
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * @description 创建文件夹（同步版本）
 * @param targetPath 目标路径
 * @param options 配置项
 * @param options.cwd 执行路径，默认为 process.cwd()
 * @param options.recursive 是否递归创建父目录，默认为 true
 * @category Files
 */
export function createFolderSync(targetPath: string, options?: CreateFolderOptions): void {
  const { cwd = process.cwd(), recursive = true } = options || {};
  const target = resolve(cwd, targetPath);

  try {
    const stats = statSync(target);

    // 如果路径存在且是目录，直接返回
    if (stats.isDirectory()) {
      return;
    }

    // 如果路径存在但是文件，抛出错误
    if (stats.isFile()) {
      throw new Error(`Cannot create directory '${target}': File exists`);
    }
  } catch (error) {
    // 如果是 ENOENT 错误（路径不存在），继续创建目录
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  try {
    mkdirSync(target, { recursive });
  } catch (error) {
    // 如果目录已存在，忽略错误
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}
