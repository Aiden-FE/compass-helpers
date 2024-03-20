import { resolve } from 'path';
import { writeFile, writeFileSync } from 'fs';

/**
 * @description 创建文件
 * @param filePath 文件路径
 * @param fileData 文件数据
 * @param options 配置项
 * @param options.cwd 执行路径, 默认process.cwd()
 * @param options.encoding 编码格式, 默认utf8
 * @category Files
 */
export function createFile(
  filePath: string,
  fileData: string | NodeJS.ArrayBufferView,
  options?: {
    cwd?: string;
    encoding?: BufferEncoding;
  },
): Promise<void> {
  return new Promise((res, rej) => {
    const target = resolve(options?.cwd || process.cwd(), filePath);
    writeFile(target, fileData, { encoding: options?.encoding || 'utf-8' }, (err) => {
      if (err) {
        rej(err);
        return;
      }
      res();
    });
  });
}

/**
 * @description 创建文件
 * @param filePath 文件路径
 * @param fileData 文件数据
 * @param options 配置项
 * @param options.cwd 执行路径, 默认process.cwd()
 * @param options.encoding 编码格式, 默认utf8
 * @category Files
 */
export function createFileSync(
  filePath: string,
  fileData: string | NodeJS.ArrayBufferView,
  options?: {
    cwd?: string;
    encoding?: BufferEncoding;
  },
) {
  const target = resolve(options?.cwd || process.cwd(), filePath);
  writeFileSync(target, fileData, { encoding: options?.encoding || 'utf8' });
}
