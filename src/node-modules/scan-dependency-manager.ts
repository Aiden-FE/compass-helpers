import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import isFileOrFolderExists from './is-file-or-folder-exists';

/**
 * @description 扫描依赖管理器
 * @category Tools
 */
export default function scanDependencyManager(opt?: { cwd?: string }): 'npm' | 'pnpm' | 'yarn' {
  const { cwd } = {
    cwd: opt?.cwd || process.cwd(),
  };
  // 存在依赖文件直接返回对应管理器
  let isPnpm = false;
  isPnpm = isFileOrFolderExists(join(cwd, 'pnpm-lock.yaml'));
  if (isPnpm) {
    return 'pnpm';
  }
  let isYarn = false;
  isYarn = isFileOrFolderExists(join(cwd, 'yarn.lock'));
  if (isYarn) {
    return 'yarn';
  }
  if (isFileOrFolderExists(join(cwd, 'package-lock.json'))) {
    return 'npm';
  }
  // 读取package.json中的packageManager字段
  try {
    const packageData = readFileSync(join(cwd, 'package.json'), 'utf8');
    const packageJSON = JSON.parse(packageData);
    if (packageJSON.packageManager) {
      isPnpm = packageJSON.packageManager.includes('pnpm');
      if (isPnpm) {
        return 'pnpm';
      }
      isYarn = packageJSON.packageManager.includes('yarn');
      if (isYarn) {
        return 'yarn';
      }
    }
  } catch (e) {
    return 'npm';
  }
  return 'npm';
}
