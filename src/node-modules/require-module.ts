import { createRequire } from 'module';

/**
 * @description 读取模块文件,类似require()函数
 * @param filePath
 * @category Files
 */
export default function requireModule(filePath: string) {
  // @ts-ignore
  const requireFunc = createRequire(import.meta.url);
  return requireFunc(filePath);
}
