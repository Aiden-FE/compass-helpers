import { resolve } from 'path';
import { stat, mkdirSync, statSync } from 'fs';

/**
 * @description 创建文件夹
 * @param targetPath 目标路径
 * @param [options] 配置项
 * @param [options.cwd=process.cwd()] 执行路径
 * @category Files
 */
export function createFolder(
  targetPath: string,
  options?: {
    cwd?: string;
  },
) {
  const { cwd } = {
    cwd: process.cwd(),
    ...options,
  };
  const target = resolve(cwd, targetPath);
  return new Promise<void>((res) => {
    stat(target, (err, stats) => {
      if (err || !stats) {
        mkdirSync(target, { recursive: true });
      }
      res();
    });
  });
}

/**
 * @description 同步创建文件夹
 * @param targetPath 目标路径
 * @param [options] 配置项
 * @param [options.cwd=process.cwd()] 执行路径
 * @category Files
 */
export function createFolderSync(
  targetPath: string,
  options?: {
    cwd?: string;
  },
) {
  const { cwd } = {
    cwd: process.cwd(),
    ...options,
  };
  const target = resolve(cwd, targetPath);
  const stats = statSync(target);
  if (!stats) {
    mkdirSync(target, { recursive: true });
  }
}
