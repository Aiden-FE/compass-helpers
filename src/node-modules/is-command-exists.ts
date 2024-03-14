import { execSync } from 'child_process';

/**
 * 命令是否存在
 * @param command
 * @category Tools
 */
export default function isCommandExists(command: string) {
  try {
    // 使用execSync执行命令，并捕获命令执行结果
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    // 如果执行成功，返回true
    return true;
  } catch (error) {
    // 如果执行失败，则捕获到错误，说明命令不存在，返回false
    return false;
  }
}
