import { resolve, dirname } from 'path';
import { writeFile, writeFileSync, access, accessSync } from 'fs';
import { createFolder, createFolderSync } from './create-folder';

interface CreateFileOptions {
  cwd?: string;
  encoding?: BufferEncoding;
  createParentDirs?: boolean;
  overwrite?: boolean;
}

/**
 * @description Promise 化的 access 检查文件是否存在
 */
function accessAsync(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    access(path, (error) => {
      resolve(!error);
    });
  });
}

/**
 * @description Promise 化的 writeFile
 */
function writeFileAsync(
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options: { encoding?: BufferEncoding },
): Promise<void> {
  return new Promise((resolve, reject) => {
    writeFile(path, data, options, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * @description 创建文件（异步版本）
 * @param filePath 文件路径
 * @param fileData 文件数据
 * @param options 配置项
 * @param options.cwd 执行路径，默认为 process.cwd()
 * @param options.encoding 编码格式，默认为 utf8
 * @param options.createParentDirs 是否自动创建父目录，默认为 false
 * @param options.overwrite 是否覆盖已存在的文件，默认为 true
 * @category Files
 */
export async function createFile(
  filePath: string,
  fileData: string | NodeJS.ArrayBufferView,
  options?: CreateFileOptions,
): Promise<void> {
  const { cwd = process.cwd(), encoding = 'utf8', createParentDirs = false, overwrite = true } = options || {};

  const target = resolve(cwd, filePath);

  // 检查文件是否已存在
  if (!overwrite && (await accessAsync(target))) {
    throw new Error(`File already exists: ${target}`);
  }

  // 如果需要，创建父目录
  if (createParentDirs) {
    const parentDir = dirname(target);
    await createFolder(parentDir, { recursive: true });
  }

  await writeFileAsync(target, fileData, { encoding });
}

/**
 * @description 创建文件（同步版本）
 * @param filePath 文件路径
 * @param fileData 文件数据
 * @param options 配置项
 * @param options.cwd 执行路径，默认为 process.cwd()
 * @param options.encoding 编码格式，默认为 utf8
 * @param options.createParentDirs 是否自动创建父目录，默认为 false
 * @param options.overwrite 是否覆盖已存在的文件，默认为 true
 * @category Files
 */
export function createFileSync(
  filePath: string,
  fileData: string | NodeJS.ArrayBufferView,
  options?: CreateFileOptions,
): void {
  const { cwd = process.cwd(), encoding = 'utf8', createParentDirs = false, overwrite = true } = options || {};

  const target = resolve(cwd, filePath);

  // 检查文件是否已存在
  if (!overwrite) {
    try {
      accessSync(target);
      throw new Error(`File already exists: ${target}`);
    } catch (error) {
      // 如果文件不存在，继续创建
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // 如果需要，创建父目录
  if (createParentDirs) {
    const parentDir = dirname(target);
    createFolderSync(parentDir, { recursive: true });
  }

  writeFileSync(target, fileData, { encoding });
}
