type ValueType = 'string' | 'number' | 'boolean' | 'array';

interface GetCommandParamOptions {
  valueType?: ValueType;
  validator?: (value: string | number | boolean | string[]) => boolean | string;
  alias?: string | string[];
  separator?: string; // 用于数组类型的分隔符
  required?: boolean;
}

/**
 * @description 获取命令行参数
 * @param param 参数名（支持 --param 或 -p 格式）
 * @param defaultValue 默认值
 * @param options 配置项
 * @param options.valueType 参数的值类型，默认为 'string'
 * @param options.validator 参数的值自定义验证函数，返回 true 或错误信息字符串
 * @param options.alias 参数别名，支持短参数
 * @param options.separator 数组类型的分隔符，默认为 ','
 * @param options.required 是否必需参数
 * @returns 解析后的参数值
 * @category Tools
 * @example
 * // 基本用法
 * const name = getCommandParam('name', 'default');
 * // node script.js --name John
 *
 * // 数字类型
 * const port = getCommandParam('port', 3000, { valueType: 'number' });
 * // node script.js --port 8080
 *
 * // 布尔标志
 * const debug = getCommandParam('debug', false, { valueType: 'boolean' });
 * // node script.js --debug
 *
 * // 数组类型
 * const files = getCommandParam('files', [], { valueType: 'array' });
 * // node script.js --files file1.txt,file2.txt,file3.txt
 *
 * // 带验证
 * const email = getCommandParam('email', '', {
 *   validator: (value) => {
 *     if (typeof value === 'string' && value.includes('@')) {
 *       return true;
 *     }
 *     return 'Email must contain @ symbol';
 *   }
 * });
 *
 * // 必需参数
 * const apiKey = getCommandParam('api-key', undefined, {
 *   required: true,
 *   alias: 'k'
 * });
 * // node script.js --api-key abc123 或 -k abc123
 *
 * // 批量解析
 * const config = parseCommandParams({
 *   host: { defaultValue: 'localhost' },
 *   port: { valueType: 'number', defaultValue: 3000 },
 *   ssl: { valueType: 'boolean', defaultValue: false },
 *   workers: { valueType: 'array', defaultValue: ['main'] }
 * });
 */
export function getCommandParam<T = string>(param: string, defaultValue?: T, options: GetCommandParamOptions = {}): T {
  const { valueType = 'string', validator, alias = [], separator = ',', required = false } = options;

  const aliases = Array.isArray(alias) ? alias : [alias];
  const allParams = [param, ...aliases.filter(Boolean)];

  // 查找参数在命令行中的位置
  let valueIndex = -1;
  let foundParam: string | undefined;

  for (const p of allParams) {
    const normalizedParam = p.startsWith('-') ? p : `--${p}`;
    const index = process.argv.indexOf(normalizedParam);
    if (index !== -1) {
      valueIndex = index;
      foundParam = normalizedParam;
      break;
    }
  }

  // 处理 boolean 类型
  if (valueType === 'boolean') {
    const result = valueIndex !== -1;
    if (validator) {
      const validationResult = validator(result);
      if (validationResult !== true) {
        const errorMessage =
          typeof validationResult === 'string'
            ? validationResult
            : `Validation failed for parameter ${foundParam || param}`;
        throw new Error(errorMessage);
      }
    }
    return result as T;
  }

  // 如果没有找到参数
  if (valueIndex === -1) {
    if (required) {
      throw new Error(`Required parameter ${param} is missing`);
    }
    return defaultValue as T;
  }

  // 获取参数值
  const rawValue = process.argv[valueIndex + 1];

  // 检查是否提供了值
  if (rawValue === undefined || rawValue.startsWith('-')) {
    if (required) {
      throw new Error(`Parameter ${foundParam} requires a value`);
    }
    return defaultValue as T;
  }

  // 根据类型转换值
  let convertedValue: string | number | boolean | string[];

  try {
    switch (valueType) {
      case 'string':
        convertedValue = rawValue;
        break;

      case 'number':
        convertedValue = parseFloat(rawValue);
        if (isNaN(convertedValue)) {
          throw new Error(`Parameter ${foundParam} must be a valid number, got: ${rawValue}`);
        }
        break;

      case 'array':
        convertedValue = rawValue
          .split(separator)
          .map((item) => item.trim())
          .filter(Boolean);
        break;

      default:
        convertedValue = rawValue;
    }
  } catch (error) {
    throw new Error(`Failed to parse parameter ${foundParam}: ${(error as Error).message}`);
  }

  // 执行自定义验证
  if (validator) {
    const validationResult = validator(convertedValue);
    if (validationResult !== true) {
      const errorMessage =
        typeof validationResult === 'string' ? validationResult : `Validation failed for parameter ${foundParam}`;
      throw new Error(errorMessage);
    }
  }

  return convertedValue as T;
}

/**
 * @description 解析所有命令行参数为对象
 * @param schema 参数模式定义
 * @returns 解析后的参数对象
 * @category Tools
 */
export function parseCommandParams<T extends Record<string, string | number | boolean | string[]>>(
  schema: Record<keyof T, GetCommandParamOptions & { defaultValue?: T[keyof T] }>,
): T {
  const result = {} as T;

  for (const [key, config] of Object.entries(schema)) {
    const { defaultValue, ...options } = config;
    try {
      (result as Record<string, string | number | boolean | string[]>)[key] = getCommandParam(
        key,
        defaultValue,
        options,
      );
    } catch (error) {
      throw new Error(`Error parsing parameter '${key}': ${(error as Error).message}`);
    }
  }

  return result;
}

/**
 * @description 检查是否存在指定的命令行参数
 * @param param 参数名
 * @param alias 参数别名
 * @returns 是否存在该参数
 * @category Tools
 */
export function hasCommandParam(param: string, alias?: string | string[]): boolean {
  return getCommandParam(param, false, {
    valueType: 'boolean',
    alias,
  });
}

/**
 * @description 获取所有未解析的命令行参数
 * @returns 未解析的参数数组
 * @category Tools
 */
export function getRemainingArgs(): string[] {
  // 跳过 node 和脚本文件名
  return process.argv.slice(2);
}
