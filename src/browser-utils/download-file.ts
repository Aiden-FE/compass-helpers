/** 文件下载配置选项 */
export interface DownloadOptions {
  /** 文件名（包含扩展名） */
  filename: string;
  /** Blob 配置选项 */
  blobOptions?: BlobPropertyBag;
  /** 是否自动添加时间戳到文件名 */
  addTimestamp?: boolean;
  /** 自定义时间戳格式 */
  timestampFormat?: 'datetime' | 'date' | 'time' | 'unix';
  /** 下载完成后的回调 */
  onSuccess?: () => void;
  /** 下载失败后的回调 */
  onError?: (error: Error) => void;
  /** 是否在下载前显示确认对话框 */
  showConfirm?: boolean;
  /** 确认对话框的消息 */
  confirmMessage?: string;
}

/** 支持的数据类型 */
export type DownloadData = BlobPart | Blob | File | ArrayBuffer | string | object | unknown[];

/** 下载结果 */
export interface DownloadResult {
  success: boolean;
  filename: string;
  size: number;
  error?: Error;
}

/**
 * @description 检测浏览器是否支持下载功能
 */
export function isBrowserSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  return !!(
    window.URL &&
    !!window.URL.createObjectURL &&
    document.createElement &&
    'download' in document.createElement('a')
  );
}

/**
 * @description 验证文件名是否合法
 */
export function validateFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // 检查非法字符（Windows 和 Unix 系统的限制）
  // eslint-disable-next-line no-control-regex
  const invalidChars = /[<>:"/\\|?*\u0000-\u001f]/;
  if (invalidChars.test(filename)) {
    return false;
  }

  // 检查长度限制
  if (filename.length > 255) {
    return false;
  }

  // 检查保留名称（Windows）
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(filename)) {
    return false;
  }

  return true;
}

/**
 * @description 生成带时间戳的文件名
 */
export function addTimestampToFilename(
  filename: string,
  format: 'datetime' | 'date' | 'time' | 'unix' = 'datetime',
): string {
  const now = new Date();
  const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
  const name = ext ? filename.substring(0, filename.lastIndexOf('.')) : filename;

  let timestamp: string;

  switch (format) {
    case 'date':
      timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
      break;
    case 'time':
      timestamp = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      break;
    case 'unix':
      timestamp = Math.floor(now.getTime() / 1000).toString();
      break;
    case 'datetime':
    default:
      timestamp = now.toISOString().replace(/[:.]/g, '-').split('T').join('_').slice(0, -1); // YYYY-MM-DD_HH-MM-SS
      break;
  }

  return `${name}_${timestamp}${ext}`;
}

/**
 * @description 将数据转换为 Blob
 */
export function convertToBlob(data: DownloadData, blobOptions?: BlobPropertyBag): Blob {
  if (data instanceof Blob) {
    return data;
  }

  if (data instanceof File) {
    return new Blob([data], blobOptions);
  }

  if (data instanceof ArrayBuffer) {
    return new Blob([data], blobOptions);
  }

  if (typeof data === 'string') {
    return new Blob([data], { type: 'text/plain;charset=utf-8', ...blobOptions });
  }

  if (typeof data === 'object') {
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: 'application/json;charset=utf-8', ...blobOptions });
  }

  // 其他类型转换为字符串
  const stringData = String(data);
  return new Blob([stringData], { type: 'text/plain;charset=utf-8', ...blobOptions });
}

/**
 * @description 获取文件大小的可读格式
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * @description 核心下载函数
 */
function performDownload(blob: Blob, filename: string): Promise<DownloadResult> {
  return new Promise((resolve, reject) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.style.display = 'none';
      link.href = url;
      link.download = filename;

      // 添加到 DOM 中以确保在所有浏览器中都能工作
      document.body.appendChild(link);

      // 触发下载
      link.click();

      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        resolve({
          success: true,
          filename,
          size: blob.size,
        });
      }, 100);
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown download error'));
    }
  });
}

/**
 * @description 主要的文件下载函数
 * @param data 要下载的数据
 * @param options 下载配置选项
 * @returns Promise<DownloadResult>
 *
 * @example
 * // 基本使用
 * await downloadFile('Hello World', { filename: 'hello.txt' });
 *
 * // 下载 JSON 数据
 * await downloadFile({ name: 'test', value: 123 }, {
 *   filename: 'data.json',
 *   addTimestamp: true
 * });
 *
 * // 下载二进制数据
 * const buffer = new ArrayBuffer(1024);
 * await downloadFile(buffer, {
 *   filename: 'binary.dat',
 *   blobOptions: { type: 'application/octet-stream' }
 * });
 *
 * // 带确认和回调
 * await downloadFile(csvData, {
 *   filename: 'export.csv',
 *   showConfirm: true,
 *   confirmMessage: '确定要下载这个 CSV 文件吗？',
 *   onSuccess: () => console.log('下载成功'),
 *   onError: (error) => console.error('下载失败:', error)
 * });
 */
export async function downloadFile(data: DownloadData, options: DownloadOptions): Promise<DownloadResult> {
  // 环境检查
  if (!isBrowserSupported()) {
    const error = new Error('Current environment does not support file download');
    options.onError?.(error);
    return { success: false, filename: options.filename, size: 0, error };
  }

  // 参数验证
  if (!data) {
    const error = new Error('Download data cannot be empty');
    options.onError?.(error);
    return { success: false, filename: options.filename, size: 0, error };
  }

  if (!validateFilename(options.filename)) {
    const error = new Error(`Invalid filename: ${options.filename}`);
    options.onError?.(error);
    return { success: false, filename: options.filename, size: 0, error };
  }

  // 处理文件名
  let finalFilename = options.filename;
  if (options.addTimestamp) {
    finalFilename = addTimestampToFilename(options.filename, options.timestampFormat);
  }

  // 确认对话框
  if (options.showConfirm) {
    const message = options.confirmMessage || `确定要下载文件 "${finalFilename}" 吗？`;
    const confirmed = window.confirm(message);
    if (!confirmed) {
      const error = new Error('Download cancelled by user');
      return { success: false, filename: finalFilename, size: 0, error };
    }
  }

  try {
    // 转换数据为 Blob
    const blob = convertToBlob(data, options.blobOptions);

    // 执行下载
    const result = await performDownload(blob, finalFilename);

    // 成功回调
    options.onSuccess?.();

    return result;
  } catch (error) {
    const downloadError = error instanceof Error ? error : new Error('Unknown download error');
    options.onError?.(downloadError);

    return {
      success: false,
      filename: finalFilename,
      size: 0,
      error: downloadError,
    };
  }
}

/**
 * @description 下载文本文件
 * @param text 文本内容
 * @param filename 文件名
 * @param encoding 编码格式
 */
export async function downloadTextFile(
  text: string,
  filename: string,
  encoding: string = 'utf-8',
): Promise<DownloadResult> {
  return downloadFile(text, {
    filename,
    blobOptions: { type: `text/plain;charset=${encoding}` },
  });
}

/**
 * @description 下载 JSON 文件
 * @param data 要序列化的数据
 * @param filename 文件名
 * @param indent 缩进空格数
 */
export async function downloadJsonFile(data: unknown, filename: string, indent: number = 2): Promise<DownloadResult> {
  const jsonString = JSON.stringify(data, null, indent);
  return downloadFile(jsonString, {
    filename: filename.endsWith('.json') ? filename : `${filename}.json`,
    blobOptions: { type: 'application/json;charset=utf-8' },
  });
}

/**
 * @description 下载 CSV 文件
 * @param data 二维数组数据
 * @param filename 文件名
 * @param separator 分隔符
 */
export async function downloadCsvFile(
  data: (string | number)[][],
  filename: string,
  separator: string = ',',
): Promise<DownloadResult> {
  const csvContent = data
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell);
          // 如果包含分隔符、换行符或引号，需要用引号包围并转义内部引号
          if (cellStr.includes(separator) || cellStr.includes('\n') || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(separator),
    )
    .join('\n');

  return downloadFile(csvContent, {
    filename: filename.endsWith('.csv') ? filename : `${filename}.csv`,
    blobOptions: { type: 'text/csv;charset=utf-8' },
  });
}

/**
 * @description 下载 Blob 或 File 对象
 * @param blob Blob 或 File 对象
 * @param filename 文件名（可选，File 对象会使用其原始名称）
 */
export async function downloadBlob(blob: Blob | File, filename?: string): Promise<DownloadResult> {
  const finalFilename = filename || (blob instanceof File ? blob.name : 'download');

  return downloadFile(blob, { filename: finalFilename });
}

/**
 * @description 下载 Base64 编码的文件
 * @param base64 Base64 字符串（可包含 data URL 前缀）
 * @param filename 文件名
 * @param mimeType MIME 类型（如果 base64 不包含则需要提供）
 */
export async function downloadBase64File(base64: string, filename: string, mimeType?: string): Promise<DownloadResult> {
  let actualBase64 = base64;
  let actualMimeType = mimeType;

  // 处理 data URL 格式
  if (base64.startsWith('data:')) {
    const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      actualMimeType = matches[1];
      actualBase64 = matches[2];
    }
  }

  if (!actualMimeType) {
    actualMimeType = 'application/octet-stream';
  }

  try {
    // 将 Base64 转换为 ArrayBuffer
    const binaryString = window.atob(actualBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return downloadFile(bytes.buffer, {
      filename,
      blobOptions: { type: actualMimeType },
    });
  } catch (error) {
    throw new Error(`Failed to decode Base64 data: ${(error as Error).message}`);
  }
}

/**
 * @description 批量下载文件（串行）
 * @param downloads 下载任务列表
 * @param delayBetween 下载间隔（毫秒）
 */
export async function downloadMultipleFiles(
  downloads: Array<{ data: DownloadData; options: DownloadOptions }>,
  delayBetween: number = 500,
): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];

  for (let i = 0; i < downloads.length; i++) {
    const { data, options } = downloads[i];

    try {
      const result = await downloadFile(data, options);
      results.push(result);

      // 添加延迟避免浏览器阻止多个下载
      if (i < downloads.length - 1 && delayBetween > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetween));
      }
    } catch (error) {
      results.push({
        success: false,
        filename: options.filename,
        size: 0,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  return results;
}
