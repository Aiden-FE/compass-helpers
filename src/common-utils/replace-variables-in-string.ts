export interface ReplaceVariablesOptions {
  /** 变量包裹符号，默认为 '{{' 和 '}}' */
  wrapper?: [string, string];
  /** 是否严格模式，如果为true，未找到的变量会抛出错误，默认为false */
  strict?: boolean;
  /** 未找到变量时的默认值，仅在非严格模式下生效 */
  defaultValue?: string;
}

export type VariableValue = string | number | boolean | null | undefined;

/**
 * 验证输入参数
 */
function validateInputs(templateString: string, params: Record<string, VariableValue>): void {
  if (typeof templateString !== 'string') {
    throw new Error('模板字符串必须为字符串类型');
  }

  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('参数对象必须为有效的对象类型');
  }
}

/**
 * 转换变量值为字符串
 */
function convertValueToString(value: VariableValue): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
}

/**
 * 创建变量匹配的正则表达式
 */
function createVariableRegex(key: string, wrapper: [string, string]): RegExp {
  const [startWrapper, endWrapper] = wrapper;
  // 转义特殊字符
  const escapedStart = startWrapper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = endWrapper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 匹配包装符号内的变量名，允许前后有空白字符
  return new RegExp(`${escapedStart}\\s*(${escapedKey})\\s*${escapedEnd}`, 'g');
}

/**
 * @description 替换字符串中包裹起来的变量
 * @param templateString 字符串模板
 * @param params 参数对象，支持字符串、数字、布尔值、null、undefined
 * @param [options] 配置选项
 * @param [options.wrapper=['{{', '}}']] 变量包裹符号
 * @param [options.strict=false] 是否严格模式，如果为true，未找到的变量会抛出错误
 * @param [options.defaultValue=''] 未找到变量时的默认值，仅在非严格模式下生效
 * @category Tools
 * @throws {Error} 当输入参数类型无效时抛出错误
 * @throws {Error} 当严格模式下存在未定义变量时抛出错误
 * @example
 * import { replaceVariablesInString } from '@compass-aiden/utils';
 *
 * // 基础用法
 * replaceVariablesInString('Hello {{name}}!', { name: 'World' }); // 'Hello World!'
 *
 * // 支持多种数据类型
 * replaceVariablesInString('用户ID: {{id}}, 年龄: {{age}}, 是否VIP: {{isVip}}', {
 *   id: 12345,
 *   age: 25,
 *   isVip: true
 * }); // '用户ID: 12345, 年龄: 25, 是否VIP: true'
 *
 * // 自定义包裹符号
 * replaceVariablesInString('Hello [name]!', { name: 'World' }, {
 *   wrapper: ['[', ']']
 * }); // 'Hello World!'
 *
 * // 严格模式
 * replaceVariablesInString('Hello {{name}}!', {}, { strict: true }); // 抛出错误
 *
 * // 默认值
 * replaceVariablesInString('Hello {{name}}!', {}, {
 *   defaultValue: 'Guest'
 * }); // 'Hello Guest!'
 */
export default function replaceVariablesInString(
  templateString: string,
  params: Record<string, VariableValue>,
  options: ReplaceVariablesOptions = {},
): string {
  const { wrapper = ['{{', '}}'], strict = false, defaultValue = '' } = options;

  try {
    // 参数验证
    validateInputs(templateString, params);

    if (!Array.isArray(wrapper) || wrapper.length !== 2) {
      throw new Error('包裹符号必须为包含2个元素的数组');
    }

    // 注释掉相同包裹符号的限制，因为很多模板引擎支持相同符号（如 %name%）
    // if (wrapper[0] === wrapper[1]) {
    //   throw new Error('开始和结束包裹符号不能相同');
    // }

    // 获取所有可能的变量名
    const allKeys = Object.keys(params);

    // 如果没有参数且是严格模式，检查模板中是否有变量
    if (allKeys.length === 0 && strict) {
      const [startWrapper, endWrapper] = wrapper;
      const escapedStart = startWrapper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedEnd = endWrapper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hasVariables = new RegExp(`${escapedStart}\\s*\\w+\\s*${escapedEnd}`).test(templateString);

      if (hasVariables) {
        throw new Error('严格模式下不允许存在未定义的变量');
      }
    }

    // 按键名长度降序排序，避免替换冲突（如name被n先替换）
    const sortedKeys = allKeys.sort((a, b) => b.length - a.length);

    let result = templateString;

    // 替换所有变量
    for (const key of sortedKeys) {
      const value = params[key];
      const regex = createVariableRegex(key, wrapper);
      const stringValue = convertValueToString(value);

      result = result.replace(regex, stringValue);
    }

    // 检查是否还有未替换的变量
    if (strict || options.defaultValue !== undefined) {
      const [startWrapper, endWrapper] = wrapper;
      const escapedStart = startWrapper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedEnd = endWrapper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const remainingVariables = new RegExp(`${escapedStart}\\s*(\\w+)\\s*${escapedEnd}`, 'g');

      if (strict) {
        const matches = result.match(remainingVariables);
        if (matches && matches.length > 0) {
          const variables = matches.map((match) => match.replace(remainingVariables, '$1')).join(', ');
          throw new Error(`严格模式下存在未定义的变量: ${variables}`);
        }
      } else {
        // 无论defaultValue是否为空字符串，都进行替换
        result = result.replace(remainingVariables, defaultValue);
      }
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`变量替换失败: ${error.message}`);
    }
    throw new Error('变量替换失败: 未知错误');
  }
}
