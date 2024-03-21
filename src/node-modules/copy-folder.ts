import { existsSync, mkdirSync, readdirSync, lstatSync, copyFileSync } from 'fs';
import { join } from 'path';

/**
 * @description 同步复制文件夹及其内容到目标文件夹
 * @param source 源文件夹路径
 * @param destination 目标文件夹路径
 * @category Files
 */
export function copyFolderSync(source: string, destination: string) {
  // 检查源文件夹是否存在，如果不存在则返回
  if (!existsSync(source)) {
    throw new Error('源文件夹不存在');
  }

  // 创建目标文件夹
  mkdirSync(destination);

  // 读取源文件夹中的所有文件/文件夹
  const files = readdirSync(source);

  // 遍历源文件夹中的所有文件/文件夹
  files.forEach((file) => {
    const sourcePath = join(source, file);
    const destinationPath = join(destination, file);

    // 判断当前遍历到的是文件还是文件夹
    if (lstatSync(sourcePath).isDirectory()) {
      // 如果是文件夹，则递归复制该文件夹及其内容
      copyFolderSync(sourcePath, destinationPath);
    } else {
      // 如果是文件，则进行文件的复制
      copyFileSync(sourcePath, destinationPath);
    }
  });
}

/**
 * @description 异步复制文件夹及其内容到目标文件夹
 * @param source 源文件夹路径
 * @param destination 目标文件夹路径
 * @category Files
 */
export async function copyFolder(source: string, destination: string) {
  copyFolderSync(source, destination);
}
