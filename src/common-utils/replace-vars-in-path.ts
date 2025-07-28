export interface ReplaceVarsInPathOptions {
  /** 变量前缀符号，默认为 ':' */
  prefix?: string;
  /** 是否严格模式，如果为true，未找到的变量会抛出错误，默认为false */
  strict?: boolean;
  /** 未找到变量时的默认值，仅在非严格模式下生效 */
  defaultValue?: string;
  /** 是否对变量值进行URL编码，默认为false */
  encodeValue?: boolean;
}

export type VariableValue = string | number | boolean | null | undefined;

/**
 * 验证输入参数
 */
function validateInputs(pathStr: string, params: Record<string, VariableValue>): void {
  if (typeof pathStr !== 'string') {
    throw new Error('路径字符串必须为字符串类型');
  }

  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('参数对象必须为有效的对象类型');
  }
}

/**
 * 转换变量值为字符串
 */
function convertValueToString(value: VariableValue, encodeValue: boolean): string {
  let stringValue: string;

  if (value === null) {
    stringValue = 'null';
  } else if (value === undefined) {
    stringValue = 'undefined';
  } else {
    stringValue = String(value);
  }

  return encodeValue ? encodeURIComponent(stringValue) : stringValue;
}

/**
 * 创建路径变量匹配的正则表达式
 */
function createPathVariableRegex(key: string, prefix: string): RegExp {
  // 转义特殊字符
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 匹配路径变量，使用词边界确保是完整的变量名
  return new RegExp(`${escapedPrefix}${escapedKey}\\b`, 'g');
}

/**
 * @description 替换路径字符串中的变量
 * @param pathStr 路径字符串
 * @param params 参数对象，支持字符串、数字、布尔值、null、undefined
 * @param [options] 配置选项
 * @param [options.prefix=':'] 变量前缀符号
 * @param [options.strict=false] 是否严格模式，如果为true，未找到的变量会抛出错误
 * @param [options.defaultValue=''] 未找到变量时的默认值，仅在非严格模式下生效
 * @param [options.encodeValue=false] 是否对变量值进行URL编码
 * @category String
 * @throws {Error} 当输入参数类型无效时抛出错误
 * @throws {Error} 当严格模式下存在未定义变量时抛出错误
 * @example
 * import { replaceVarsInPath } from '@compass-aiden/utils';
 *
 * // 基础用法
 * replaceVarsInPath('/api/user/:id', { id: '123' }); // '/api/user/123'
 *
 * // 支持多种数据类型
 * replaceVarsInPath('/api/user/:id/active/:status', {
 *   id: 123,
 *   status: true
 * }); // '/api/user/123/active/true'
 *
 * // 自定义前缀
 * replaceVarsInPath('/api/user/{id}', { id: '123' }, {
 *   prefix: '{'
 * }); // '/api/user/123}'
 *
 * // URL编码
 * replaceVarsInPath('/search/:query', { query: 'hello world' }, {
 *   encodeValue: true
 * }); // '/search/hello%20world'
 *
 * // 严格模式
 * replaceVarsInPath('/api/user/:id', {}, { strict: true }); // 抛出错误
 *
 * // 默认值
 * replaceVarsInPath('/api/user/:id', {}, {
 *   defaultValue: 'unknown'
 * }); // '/api/user/unknown'
 */
export default function replaceVarsInPath(
  pathStr: string,
  params: Record<string, VariableValue>,
  options: ReplaceVarsInPathOptions = {},
): string {
  const { prefix = ':', strict = false, defaultValue = '', encodeValue = false } = options;

  try {
    // 参数验证
    validateInputs(pathStr, params);

    if (typeof prefix !== 'string' || prefix.length === 0) {
      throw new Error('前缀必须为非空字符串');
    }

    // 获取所有可能的变量名
    const allKeys = Object.keys(params);

    // 如果没有参数且是严格模式，检查路径中是否有变量
    if (allKeys.length === 0 && strict) {
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hasVariables = new RegExp(`${escapedPrefix}\\w+`).test(pathStr);

      if (hasVariables) {
        throw new Error('严格模式下不允许存在未定义的路径变量');
      }
    }

    // 按键名长度降序排序，避免替换冲突（如id被i先替换）
    const sortedKeys = allKeys.sort((a, b) => b.length - a.length);

    let result = pathStr;

    // 替换所有变量
    for (const key of sortedKeys) {
      const value = params[key];
      const regex = createPathVariableRegex(key, prefix);
      const stringValue = convertValueToString(value, encodeValue);

      result = result.replace(regex, stringValue);
    }

    // 检查是否还有未替换的变量
    if (strict || options.defaultValue !== undefined) {
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const remainingVariables = new RegExp(`${escapedPrefix}(\\w+)\\b`, 'g');

      if (strict) {
        const matches = Array.from(result.matchAll(remainingVariables));
        if (matches.length > 0) {
          const variables = matches.map((match) => `${prefix}${match[1]}`).join(', ');
          throw new Error(`严格模式下存在未定义的路径变量: ${variables}`);
        }
      } else {
        // 替换剩余变量为默认值
        result = result.replace(remainingVariables, () => {
          const encodedDefault = encodeValue ? encodeURIComponent(defaultValue) : defaultValue;
          return encodedDefault;
        });
      }
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`路径变量替换失败: ${error.message}`);
    }
    throw new Error('路径变量替换失败: 未知错误');
  }
}
