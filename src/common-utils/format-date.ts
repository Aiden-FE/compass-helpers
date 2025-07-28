export interface FormatDateOption {
  /** 是否填充字符，默认为true */
  isPadStart?: boolean;
  /** 填充字符，默认为'0' */
  padSymbol?: string;
  /** 本地化设置，影响星期名称显示，默认为'zh-CN' */
  locale?: string;
}

export type DateInput = string | number | Date;

// 预定义的星期名称映射
const WEEKDAY_NAMES: Record<string, string[]> = {
  'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
  'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/**
 * 验证日期输入是否有效
 */
function validateDateInput(date: DateInput): void {
  if (date === null || date === undefined) {
    throw new Error('日期参数不能为空');
  }

  if (typeof date === 'string' && date.trim() === '') {
    throw new Error('日期字符串不能为空');
  }

  if (typeof date === 'number' && (!isFinite(date) || isNaN(date))) {
    throw new Error('时间戳必须为有效数字');
  }
}

/**
 * 创建并验证Date对象
 */
function createValidDate(date: DateInput): Date {
  validateDateInput(date);

  const localDate = date instanceof Date ? date : new Date(date);

  if (isNaN(localDate.getTime())) {
    throw new Error(`无效的日期格式: ${String(date)}`);
  }

  return localDate;
}

/**
 * 获取格式化的数值
 */
function formatNumber(value: number, isPadStart: boolean, padSymbol: string, length: number): string {
  return isPadStart ? value.toString().padStart(length, padSymbol) : value.toString();
}

/**
 * 获取季度
 */
function getQuarter(month: number): number {
  return Math.ceil(month / 3);
}

/**
 * 获取星期名称
 */
function getWeekdayName(dayOfWeek: number, locale: string): string {
  const weekdays = WEEKDAY_NAMES[locale] || WEEKDAY_NAMES['zh-CN'];
  return weekdays[dayOfWeek] || dayOfWeek.toString();
}

/**
 * @description 时间格式化
 * @param date 时间输入，支持字符串、数字时间戳或Date对象
 * @param format 格式化字符串; YYYY-年, MM-月, DD-日, hh-时(24小时制), HH-时(12小时制), mm-分, ss-秒, SSS-毫秒, Q-季度, d-星期数字, W-星期名称
 * @param [option] 配置项
 * @param [option.isPadStart=true] 是否填充字符
 * @param [option.padSymbol='0'] 填充字符
 * @param [option.locale='zh-CN'] 本地化设置，影响星期名称显示
 * @category Date
 * @example
 * import { formatDate } from '@compass-aiden/utils';
 *
 * formatDate(); // 返回当前时间,格式为 'YYYY-MM-DD hh:mm:ss'
 * formatDate('2020/03/12'); // 指定可被Date处理的时间字符串,格式为 'YYYY-MM-DD hh:mm:ss'
 * formatDate(Date.now(), 'YYYY/MM/DD'); // 指定可被Date处理的时间戳,格式为 'YYYY/MM/DD'
 * formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss'); // 12小时制格式
 * formatDate(Date.now(), 'YYYY年Q季度'); // 季度格式
 * formatDate(Date.now(), 'YYYY-MM-DD W'); // 包含星期名称
 */
export default function formatDate(
  date?: DateInput,
  format = 'YYYY-MM-DD hh:mm:ss',
  option: FormatDateOption = {},
): string {
  const { isPadStart = true, padSymbol = '0', locale = 'zh-CN' } = option;

  try {
    // 如果没有提供date参数，使用当前时间
    // 如果显式传入undefined，则抛出错误
    let actualDate: DateInput;
    if (arguments.length === 0) {
      actualDate = new Date();
    } else if (date === undefined) {
      // 显式传入undefined，应该抛出错误
      throw new Error('日期参数不能为空');
    } else {
      actualDate = date;
    }

    const localDate = createValidDate(actualDate);

    const year = localDate.getFullYear();
    const month = localDate.getMonth() + 1;
    const day = localDate.getDate();
    const hours = localDate.getHours();
    const minutes = localDate.getMinutes();
    const seconds = localDate.getSeconds();
    const ms = localDate.getMilliseconds();
    const quarter = getQuarter(month);
    const dayOfWeek = localDate.getDay();
    const weekdayName = getWeekdayName(dayOfWeek, locale);

    // 12小时制处理
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    // 使用对象映射提高性能，避免多次字符串替换
    const formatMap: Record<string, string> = {
      YYYY: formatNumber(year, isPadStart, padSymbol, 4),
      MM: formatNumber(month, isPadStart, padSymbol, 2),
      DD: formatNumber(day, isPadStart, padSymbol, 2),
      hh: formatNumber(hours, isPadStart, padSymbol, 2), // 24小时制
      HH: formatNumber(hours12, isPadStart, padSymbol, 2), // 12小时制
      mm: formatNumber(minutes, isPadStart, padSymbol, 2),
      ss: formatNumber(seconds, isPadStart, padSymbol, 2),
      SSS: formatNumber(ms, isPadStart, padSymbol, 3),
      Q: quarter.toString(),
      d: dayOfWeek.toString(),
      W: weekdayName,
    };

    // 按长度降序排列，避免替换冲突（如YYYY被YY先替换）
    const sortedKeys = Object.keys(formatMap).sort((a, b) => b.length - a.length);

    let result = format;
    for (const key of sortedKeys) {
      // 使用单词边界或非字母字符确保只替换完整的格式占位符
      const regex = new RegExp(`\\b${key}\\b|(?<![A-Za-z])${key}(?![A-Za-z])`, 'g');
      result = result.replace(regex, formatMap[key]);
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`时间格式化失败: ${error.message}`);
    }
    throw new Error('时间格式化失败: 未知错误');
  }
}
