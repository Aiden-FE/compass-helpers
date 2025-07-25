import { execSync, exec } from 'child_process';
import { platform } from 'os';

/**
 * @description 检查命令是否存在（同步版本）
 * @param command 命令
 * @returns 是否存在
 * @category Tools
 */
export function isCommandExistsSync(command: string): boolean {
  try {
    const isWindows = platform() === 'win32';
    const checkCommand = isWindows ? `where "${command}"` : `command -v "${command}"`;

    // 使用execSync执行命令，并捕获命令执行结果
    execSync(checkCommand, {
      stdio: 'ignore',
      // Windows 下设置编码以避免中文路径问题
      encoding: 'utf8',
    });
    // 如果执行成功，返回true
    return true;
  } catch {
    // 如果执行失败，则捕获到错误，说明命令不存在，返回false
    return false;
  }
}

/**
 * @description 检查命令是否存在（异步版本）
 * @param command 命令
 * @returns 是否存在
 * @category Tools
 */
export function isCommandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const isWindows = platform() === 'win32';
    const checkCommand = isWindows ? `where "${command}"` : `command -v "${command}"`;

    exec(
      checkCommand,
      {
        encoding: 'utf8',
        timeout: 10000, // 10秒超时
      },
      (error) => {
        // 如果没有错误，说明命令存在
        resolve(!error);
      },
    );
  });
}
