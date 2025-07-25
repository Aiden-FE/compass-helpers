import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { resolve, extname, isAbsolute } from 'path';
import { existsSync } from 'fs';

interface ImportOptions {
  cwd?: string;
  fallback?: boolean;
}

/**
 * @description 动态导入 CommonJS 模块（同步）
 * @param filePath 文件路径或模块名
 * @param options 配置项
 * @param options.cwd 工作目录，默认为 process.cwd()
 * @param options.fallback 是否在失败时尝试其他导入方式，默认为 true
 * @returns 模块导出内容
 * @category Files
 * @example
 * // 导入本地模块
 * const config = importCJS<Config>('./config.json');
 *
 * // 导入 npm 包
 * const lodash = importCJS<typeof import('lodash')>('lodash');
 *
 * // 指定工作目录
 * const data = importCJS('./data.js', { cwd: '/custom/path' });
 */
export function importCJS<T = unknown>(filePath: string, options?: ImportOptions): T {
  const { cwd = process.cwd(), fallback = true } = options || {};

  try {
    // 创建 require 函数
    const requireFunc = createRequire(import.meta.url);

    // 如果是相对路径，解析为绝对路径
    const resolvedPath = isAbsolute(filePath) ? filePath : resolve(cwd, filePath);

    // 检查文件是否存在（仅对本地文件）
    if (filePath.startsWith('.') || isAbsolute(filePath)) {
      if (!existsSync(resolvedPath)) {
        throw new Error(`Module file not found: ${resolvedPath}`);
      }
    }

    return requireFunc(isAbsolute(filePath) || filePath.startsWith('.') ? resolvedPath : filePath) as T;
  } catch (error) {
    if (fallback && filePath.startsWith('.')) {
      // 尝试添加常见的文件扩展名
      const extensions = ['.js', '.json', '.node', '.mjs'];
      const basePath = extname(filePath) ? filePath : filePath;

      for (const ext of extensions) {
        try {
          const pathWithExt = extname(filePath) ? filePath : `${basePath}${ext}`;
          return importCJS<T>(pathWithExt, { ...options, fallback: false });
        } catch {
          // 继续尝试下一个扩展名
        }
      }
    }

    throw new Error(`Failed to import CommonJS module '${filePath}': ${(error as Error).message}`);
  }
}

/**
 * @description 动态导入 ES 模块（异步）
 * @param modulePath 模块路径或模块名
 * @param options 配置项
 * @param options.cwd 工作目录，默认为 process.cwd()
 * @returns Promise<模块导出内容>
 * @category Files
 * @example
 * // 导入本地 ES 模块
 * const { default: config } = await importESM<{ default: Config }>('./config.mjs');
 *
 * // 导入 npm 包
 * const { default: chalk } = await importESM<typeof import('chalk')>('chalk');
 *
 * // 指定工作目录
 * const module = await importESM('./module.js', { cwd: '/custom/path' });
 */
export async function importESM<T = unknown>(modulePath: string, options?: ImportOptions): Promise<T> {
  const { cwd = process.cwd() } = options || {};

  try {
    let importPath: string;

    if (modulePath.startsWith('.') || isAbsolute(modulePath)) {
      // 本地文件路径
      const resolvedPath = isAbsolute(modulePath) ? modulePath : resolve(cwd, modulePath);

      // 检查文件是否存在
      if (!existsSync(resolvedPath)) {
        throw new Error(`Module file not found: ${resolvedPath}`);
      }

      // 转换为 file:// URL
      importPath = pathToFileURL(resolvedPath).href;
    } else {
      // npm 包或内置模块
      importPath = modulePath;
    }

    // 使用动态 import() - 这是安全的方式
    return (await import(importPath)) as T;
  } catch (error) {
    throw new Error(`Failed to import ES module '${modulePath}': ${(error as Error).message}`);
  }
}

/**
 * @description 尝试导入模块，优先使用 ES 模块，失败时回退到 CommonJS
 * @param modulePath 模块路径或模块名
 * @param options 配置项
 * @returns Promise<模块导出内容>
 * @category Files
 * @example
 * // 自动检测并导入合适的模块格式
 * const module = await importModule<MyModule>('./module');
 *
 * // 对于 npm 包也会自动选择最佳导入方式
 * const utils = await importModule<typeof import('utils')>('utils');
 */
export async function importModule<T = unknown>(modulePath: string, options?: ImportOptions): Promise<T> {
  try {
    // 首先尝试 ES 模块导入
    return await importESM<T>(modulePath, options);
  } catch (esmError) {
    try {
      // 回退到 CommonJS 导入
      return importCJS<T>(modulePath, options);
    } catch (cjsError) {
      throw new Error(
        `Failed to import module '${modulePath}' using both ES modules and CommonJS:\n` +
          `ES Module Error: ${(esmError as Error).message}\n` +
          `CommonJS Error: ${(cjsError as Error).message}`,
      );
    }
  }
}

/**
 * @description 检查模块是否存在并可导入
 * @param modulePath 模块路径或模块名
 * @param options 配置项
 * @returns 模块是否存在
 * @category Files
 * @example
 * // 检查本地模块
 * if (await moduleExists('./optional-config.js')) {
 *   const config = await importModule('./optional-config.js');
 * }
 *
 * // 检查 npm 包
 * if (await moduleExists('optional-dependency')) {
 *   const lib = await importModule('optional-dependency');
 * }
 */
export async function moduleExists(modulePath: string, options?: ImportOptions): Promise<boolean> {
  try {
    await importModule(modulePath, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * @description 安全地尝试导入可选模块，失败时返回 null
 * @param modulePath 模块路径或模块名
 * @param options 配置项
 * @returns Promise<模块导出内容 | null>
 * @category Files
 * @example
 * // 导入可选配置文件
 * const config = await tryImportModule<Config>('./optional-config.js') || defaultConfig;
 *
 * // 导入可选依赖
 * const optionalLib = await tryImportModule<OptionalLib>('optional-lib');
 * if (optionalLib) {
 *   // 使用可选库
 *   optionalLib.doSomething();
 * }
 */
export async function tryImportModule<T = unknown>(modulePath: string, options?: ImportOptions): Promise<T | null> {
  try {
    return await importModule<T>(modulePath, options);
  } catch {
    return null;
  }
}

/**
 * @description 批量导入多个模块
 * @param modulePaths 模块路径数组
 * @param options 配置项
 * @returns Promise<模块导出内容数组>
 * @category Files
 * @example
 * // 批量导入多个配置文件
 * const [config1, config2, config3] = await importModules([
 *   './config/database.js',
 *   './config/redis.js',
 *   './config/app.js'
 * ]);
 */
export async function importModules<T = unknown>(modulePaths: string[], options?: ImportOptions): Promise<T[]> {
  const promises = modulePaths.map((path) => importModule<T>(path, options));
  return Promise.all(promises);
}
