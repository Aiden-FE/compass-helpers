import { resolve } from 'path';
import { stat, mkdirSync } from 'fs';

/**
 * @description 创建文件夹
 * @param targetPath 目标路径
 * @param [options] 配置项
 * @param [options.cwd=process.cwd()] 执行路径
 */
export default function createFolder(
  targetPath: string,
  options: {
    cwd?: string;
  },
) {
  const { cwd } = {
    cwd: process.cwd(),
    ...options,
  };
  const target = resolve(cwd, targetPath);
  return new Promise<true>((res) => {
    stat(target, (err, stats) => {
      if (err || !stats) {
        mkdirSync(target, { recursive: true });
      }
      res(true);
    });
  });
}
