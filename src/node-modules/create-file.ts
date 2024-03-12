import { resolve } from 'path';
import { writeFileSync } from 'fs';

/**
 * @description 创建文件
 * @param filePath 文件路径
 * @param fileData 文件数据
 * @param options 配置项
 * @param options.cwd 执行路径, 默认process.cwd()
 * @param options.encoding 编码格式, 默认utf8
 */
export default function createFile(
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
