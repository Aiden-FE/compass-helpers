import { join } from 'path';
import isFileOrFolderExists from './is-file-or-folder-exists';

/**
 * @description 扫描依赖管理器
 * @category Tools
 */
export default function scanDependencyManager(opt?: { cwd?: string }): 'npm' | 'pnpm' | 'yarn' {
  const { cwd } = {
    cwd: opt?.cwd || process.cwd(),
  };
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
  return 'npm';
}
