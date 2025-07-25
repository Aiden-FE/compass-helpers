import {
  existsSync,
  mkdirSync,
  readdirSync,
  lstatSync,
  copyFileSync as fsCopyFileSync,
  readdir,
  lstat,
  copyFile as fsCopyFile,
  mkdir,
} from 'fs';
import { join } from 'path';

interface CopyFolderOptions {
  overwrite?: boolean;
  recursive?: boolean;
  filter?: (src: string, dest: string) => boolean;
  preserveTimestamps?: boolean;
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
 * @description Promise 化的 lstat
 */
function lstatAsync(path: string): Promise<import('fs').Stats> {
  return new Promise((resolve, reject) => {
    lstat(path, (error, stats) => {
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
 * @description Promise 化的 copyFile
 */
function copyFileAsync(src: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fsCopyFile(src, dest, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * @description 同步复制文件夹及其内容到目标文件夹
 * @param source 源文件夹路径
 * @param destination 目标文件夹路径
 * @param options 配置项
 * @param options.overwrite 是否覆盖已存在的文件/文件夹，默认为 true
 * @param options.recursive 是否递归复制子目录，默认为 true
 * @param options.filter 过滤器函数，返回 true 表示复制该项
 * @category Files
 */
export function copyFolderSync(source: string, destination: string, options?: CopyFolderOptions): void {
  const { overwrite = true, recursive = true, filter } = options || {};

  // 检查源文件夹是否存在
  if (!existsSync(source)) {
    throw new Error(`Source directory does not exist: ${source}`);
  }

  // 检查源路径是否为目录
  const sourceStats = lstatSync(source);
  if (!sourceStats.isDirectory()) {
    throw new Error(`Source is not a directory: ${source}`);
  }

  // 应用过滤器
  if (filter && !filter(source, destination)) {
    return;
  }

  // 创建目标文件夹（如果不存在）
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  } else if (!overwrite) {
    throw new Error(`Destination already exists: ${destination}`);
  }

  // 读取源文件夹中的所有文件/文件夹
  const files = readdirSync(source);

  // 遍历源文件夹中的所有文件/文件夹
  files.forEach((file) => {
    const sourcePath = join(source, file);
    const destinationPath = join(destination, file);

    // 应用过滤器
    if (filter && !filter(sourcePath, destinationPath)) {
      return;
    }

    const stats = lstatSync(sourcePath);

    if (stats.isDirectory()) {
      // 如果是文件夹且允许递归，则递归复制该文件夹及其内容
      if (recursive) {
        copyFolderSync(sourcePath, destinationPath, options);
      }
    } else if (stats.isFile()) {
      // 检查目标文件是否已存在
      if (!overwrite && existsSync(destinationPath)) {
        throw new Error(`File already exists: ${destinationPath}`);
      }

      // 如果是文件，则进行文件的复制
      fsCopyFileSync(sourcePath, destinationPath);
    }
    // 忽略符号链接和其他特殊文件类型
  });
}

/**
 * @description 异步复制文件夹及其内容到目标文件夹
 * @param source 源文件夹路径
 * @param destination 目标文件夹路径
 * @param options 配置项
 * @param options.overwrite 是否覆盖已存在的文件/文件夹，默认为 true
 * @param options.recursive 是否递归复制子目录，默认为 true
 * @param options.filter 过滤器函数，返回 true 表示复制该项
 * @category Files
 */
export async function copyFolder(source: string, destination: string, options?: CopyFolderOptions): Promise<void> {
  const { overwrite = true, recursive = true, filter } = options || {};

  // 检查源文件夹是否存在
  if (!existsSync(source)) {
    throw new Error(`Source directory does not exist: ${source}`);
  }

  // 检查源路径是否为目录
  const sourceStats = await lstatAsync(source);
  if (!sourceStats.isDirectory()) {
    throw new Error(`Source is not a directory: ${source}`);
  }

  // 应用过滤器
  if (filter && !filter(source, destination)) {
    return;
  }

  // 创建目标文件夹（如果不存在）
  if (!existsSync(destination)) {
    await mkdirAsync(destination, { recursive: true });
  } else if (!overwrite) {
    throw new Error(`Destination already exists: ${destination}`);
  }

  // 读取源文件夹中的所有文件/文件夹
  const files = await readdirAsync(source);

  // 并行处理所有文件和目录
  const promises = files.map(async (file) => {
    const sourcePath = join(source, file);
    const destinationPath = join(destination, file);

    // 应用过滤器
    if (filter && !filter(sourcePath, destinationPath)) {
      return;
    }

    try {
      const stats = await lstatAsync(sourcePath);

      if (stats.isDirectory()) {
        // 如果是文件夹且允许递归，则递归复制该文件夹及其内容
        if (recursive) {
          await copyFolder(sourcePath, destinationPath, options);
        }
      } else if (stats.isFile()) {
        // 检查目标文件是否已存在
        if (!overwrite && existsSync(destinationPath)) {
          throw new Error(`File already exists: ${destinationPath}`);
        }

        // 如果是文件，则进行文件的复制
        await copyFileAsync(sourcePath, destinationPath);
      }
      // 忽略符号链接和其他特殊文件类型
    } catch (error) {
      // 重新抛出错误，包含更多上下文信息
      throw new Error(`Failed to copy ${sourcePath} to ${destinationPath}: ${(error as Error).message}`);
    }
  });

  // 等待所有复制操作完成
  await Promise.all(promises);
}

/**
 * @description 复制单个文件（异步版本）
 * @param source 源文件路径
 * @param destination 目标文件路径
 * @param overwrite 是否覆盖已存在的文件，默认为 true
 * @category Files
 */
export async function copyFile(source: string, destination: string, overwrite: boolean = true): Promise<void> {
  // 检查源文件是否存在
  if (!existsSync(source)) {
    throw new Error(`Source file does not exist: ${source}`);
  }

  // 检查目标文件是否已存在
  if (!overwrite && existsSync(destination)) {
    throw new Error(`Destination file already exists: ${destination}`);
  }

  await copyFileAsync(source, destination);
}

/**
 * @description 复制单个文件（同步版本）
 * @param source 源文件路径
 * @param destination 目标文件路径
 * @param overwrite 是否覆盖已存在的文件，默认为 true
 * @category Files
 */
export function copyFileSync(source: string, destination: string, overwrite: boolean = true): void {
  // 检查源文件是否存在
  if (!existsSync(source)) {
    throw new Error(`Source file does not exist: ${source}`);
  }

  // 检查目标文件是否已存在
  if (!overwrite && existsSync(destination)) {
    throw new Error(`Destination file already exists: ${destination}`);
  }

  fsCopyFileSync(source, destination);
}
