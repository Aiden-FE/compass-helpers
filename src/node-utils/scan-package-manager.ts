import { join, dirname } from 'node:path';
import { readFileSync, readFile } from 'node:fs';
import { isFileOrFolderExistsSync, isFileOrFolderExists } from './is-file-or-folder-exists';

type PackageManager = 'npm' | 'pnpm' | 'yarn';

interface PackageJSON {
  workspaces?: string[] | { packages?: string[] };
  packageManager?: string;
}

interface LernaConfig {
  npmClient?: string;
}

interface ScanOptions {
  cwd?: string;
  maxLevels?: number;
}

/**
 * @description 检查 workspace 配置文件（同步版本）
 */
function checkWorkspaceConfigSync(currentPath: string): PackageManager | null {
  // 1. 检查 pnpm workspace 配置
  if (isFileOrFolderExistsSync(join(currentPath, 'pnpm-workspace.yaml'))) {
    return 'pnpm';
  }

  // 2. 检查 rush 配置 (通常使用 pnpm)
  if (isFileOrFolderExistsSync(join(currentPath, 'rush.json'))) {
    return 'pnpm';
  }

  // 3. 检查 lerna 配置
  if (isFileOrFolderExistsSync(join(currentPath, 'lerna.json'))) {
    try {
      const lernaData = readFileSync(join(currentPath, 'lerna.json'), 'utf8');
      const lernaConfig = JSON.parse(lernaData) as LernaConfig;

      if (lernaConfig.npmClient === 'yarn') return 'yarn';
      if (lernaConfig.npmClient === 'pnpm') return 'pnpm';
      return 'npm';
    } catch {
      return 'npm';
    }
  }

  return null;
}

/**
 * @description 检查 workspace 配置文件（异步版本）
 */
async function checkWorkspaceConfig(currentPath: string): Promise<PackageManager | null> {
  // 1. 检查 pnpm workspace 配置
  if (await isFileOrFolderExists(join(currentPath, 'pnpm-workspace.yaml'))) {
    return 'pnpm';
  }

  // 2. 检查 rush 配置 (通常使用 pnpm)
  if (await isFileOrFolderExists(join(currentPath, 'rush.json'))) {
    return 'pnpm';
  }

  // 3. 检查 lerna 配置
  if (await isFileOrFolderExists(join(currentPath, 'lerna.json'))) {
    try {
      const lernaData = await readFileAsync(join(currentPath, 'lerna.json'));
      const lernaConfig = JSON.parse(lernaData) as LernaConfig;

      if (lernaConfig.npmClient === 'yarn') return 'yarn';
      if (lernaConfig.npmClient === 'pnpm') return 'pnpm';
      return 'npm';
    } catch {
      return 'npm';
    }
  }

  return null;
}

/**
 * @description 通过 lock 文件检查包管理器（同步版本）
 */
function checkLockFilesSync(currentPath: string): PackageManager | null {
  if (isFileOrFolderExistsSync(join(currentPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (isFileOrFolderExistsSync(join(currentPath, 'yarn.lock'))) return 'yarn';
  if (isFileOrFolderExistsSync(join(currentPath, 'package-lock.json'))) return 'npm';

  return null;
}

/**
 * @description 通过 lock 文件检查包管理器（异步版本）
 */
async function checkLockFiles(currentPath: string): Promise<PackageManager | null> {
  if (await isFileOrFolderExists(join(currentPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await isFileOrFolderExists(join(currentPath, 'yarn.lock'))) return 'yarn';
  if (await isFileOrFolderExists(join(currentPath, 'package-lock.json'))) return 'npm';

  return null;
}

/**
 * @description 从 package.json 中获取包管理器信息（同步版本）
 */
function getPackageManagerFromPackageJSONSync(currentPath: string): PackageManager | null {
  try {
    const packagePath = join(currentPath, 'package.json');
    if (!isFileOrFolderExistsSync(packagePath)) return null;

    const packageData = readFileSync(packagePath, 'utf8');
    const packageJSON = JSON.parse(packageData) as PackageJSON;

    // 检查 packageManager 字段
    if (packageJSON.packageManager) {
      if (packageJSON.packageManager.includes('pnpm')) return 'pnpm';
      if (packageJSON.packageManager.includes('yarn')) return 'yarn';
      return 'npm';
    }

    // 如果有 workspaces 字段，通过 lock 文件判断
    if (packageJSON.workspaces) {
      return checkLockFilesSync(currentPath) || 'npm';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * @description 从 package.json 中获取包管理器信息（异步版本）
 */
async function getPackageManagerFromPackageJSON(currentPath: string): Promise<PackageManager | null> {
  try {
    const packagePath = join(currentPath, 'package.json');
    if (!(await isFileOrFolderExists(packagePath))) return null;

    const packageData = await readFileAsync(packagePath);
    const packageJSON = JSON.parse(packageData) as PackageJSON;

    // 检查 packageManager 字段
    if (packageJSON.packageManager) {
      if (packageJSON.packageManager.includes('pnpm')) return 'pnpm';
      if (packageJSON.packageManager.includes('yarn')) return 'yarn';
      return 'npm';
    }

    // 如果有 workspaces 字段，通过 lock 文件判断
    if (packageJSON.workspaces) {
      return (await checkLockFiles(currentPath)) || 'npm';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * @description Promise 化的 readFile
 */
function readFileAsync(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(path, 'utf8', (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * @description 向上搜索包管理器（同步版本）
 */
function searchUpwardsSync(currentPath: string, levels: number): PackageManager | null {
  if (levels < 0) return null;

  // 1. 优先检查 workspace 配置文件
  const workspaceResult = checkWorkspaceConfigSync(currentPath);
  if (workspaceResult) return workspaceResult;

  // 2. 检查 package.json 中的配置
  const packageResult = getPackageManagerFromPackageJSONSync(currentPath);
  if (packageResult) return packageResult;

  // 3. 检查 lock 文件
  const lockResult = checkLockFilesSync(currentPath);
  if (lockResult) return lockResult;

  // 4. 向上查找
  if (levels > 0) {
    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) return null; // 已到根目录
    return searchUpwardsSync(parentPath, levels - 1);
  }

  return null;
}

/**
 * @description 向上搜索包管理器（异步版本）
 */
async function searchUpwards(currentPath: string, levels: number): Promise<PackageManager | null> {
  if (levels < 0) return null;

  // 1. 优先检查 workspace 配置文件
  const workspaceResult = await checkWorkspaceConfig(currentPath);
  if (workspaceResult) return workspaceResult;

  // 2. 检查 package.json 中的配置
  const packageResult = await getPackageManagerFromPackageJSON(currentPath);
  if (packageResult) return packageResult;

  // 3. 检查 lock 文件
  const lockResult = await checkLockFiles(currentPath);
  if (lockResult) return lockResult;

  // 4. 向上查找
  if (levels > 0) {
    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) return null; // 已到根目录
    return searchUpwards(parentPath, levels - 1);
  }

  return null;
}

/**
 * @description 扫描依赖管理器，支持向上查找，优先识别 monorepo 结构（同步版本）
 * @category Tools
 * @param opt.cwd 起始查找目录，默认为当前工作目录
 * @param opt.maxLevels 最大向上查找层级，默认为3
 */
export function scanPackageManagerSync(opt?: ScanOptions): PackageManager {
  const { cwd = process.cwd(), maxLevels = 3 } = opt || {};

  // 尝试向上查找
  const result = searchUpwardsSync(cwd, maxLevels);
  return result || 'npm'; // 默认返回 npm
}

/**
 * @description 扫描依赖管理器，支持向上查找，优先识别 monorepo 结构（异步版本）
 * @category Tools
 * @param opt.cwd 起始查找目录，默认为当前工作目录
 * @param opt.maxLevels 最大向上查找层级，默认为3
 */
export async function scanPackageManager(opt?: ScanOptions): Promise<PackageManager> {
  const { cwd = process.cwd(), maxLevels = 3 } = opt || {};

  // 尝试向上查找
  const result = await searchUpwards(cwd, maxLevels);
  return result || 'npm'; // 默认返回 npm
}
