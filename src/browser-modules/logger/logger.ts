import formatDate from '@/common-modules/format-date';

/** 日志配置选项 */
interface LoggerOption {
  /** 业务域标题 */
  subject: string;
  /** 日志输出级别, debug级别最低,error级别最高,大于等于指定级别均会打印日志, default: log */
  logLevel: 'debug' | 'log' | 'info' | 'success' | 'warn' | 'error';
  /** 标题前缀 */
  prefix: string;
  /** 标题后缀 */
  suffix: string;
  /** 日志格式化字符串, default: false */
  dateFormat: string | boolean;
  /** 日期不足位数是否补0, default: true */
  isDatePadZero: boolean;
  /** 各日志样式 */
  styles: {
    debug: string;
    log: string;
    info: string;
    success: string;
    warn: string;
    error: string;
  };
  /** 打印后的hook函数,可以用来自行实现日志堆栈或node写日志文件 */
  afterPrintln?: (...args: unknown[]) => void;
}

function println(
  {
    logKey,
    subject,
    styles,
    dateFormat,
    prefix,
    suffix,
    isDatePadZero,
    afterPrintln,
  }: LoggerOption & {
    logKey: string;
  },
  ...args: unknown[]
) {
  // eslint-disable-next-line no-nested-ternary
  const format = typeof dateFormat === 'string' ? dateFormat : dateFormat ? 'YYYY-MM-DD hh:mm:ss' : undefined;
  // @ts-ignore
  // eslint-disable-next-line no-console
  console[logKey === 'success' ? 'log' : logKey](
    `%c${prefix}${dateFormat ? `${formatDate(new Date(), format, { isPadStart: isDatePadZero })} ` : ''}${
      subject ? `${subject} ` : ''
    }${logKey.toLocaleUpperCase()}${suffix}`,
    // @ts-ignore
    styles[logKey],
    ...args,
  );
  try {
    if (afterPrintln) {
      afterPrintln(
        `${prefix}${dateFormat ? `${formatDate(new Date(), format, { isPadStart: isDatePadZero })} ` : ''}${
          subject ? `${subject} ` : ''
        }${logKey.toLocaleUpperCase()}${suffix}`,
        ...args,
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err);
  }
}

const defaultConfig = (): LoggerOption => ({
  subject: '',
  logLevel: 'log',
  dateFormat: false,
  isDatePadZero: true,
  prefix: '',
  suffix: '',
  styles: {
    debug: 'padding: 2px 6px;border-radius: 2px;background-color: #b2bbbe;color: #fff;font-weight: 600;',
    log: 'padding: 2px 6px;border-radius: 2px;background-color: #35333c;color: #fff;font-weight: 600;',
    info: 'padding: 2px 6px;border-radius: 2px;background-color: #0ea5e9;color: #fff;font-weight: 600;',
    success: 'padding: 2px 6px;border-radius: 2px;background-color: #22c55e;color: #fff;font-weight: 600;',
    warn: 'padding: 2px 6px;border-radius: 2px;background-color: #f59e0b;color: #fff;font-weight: 600;',
    error: 'padding: 2px 6px;border-radius: 2px;background-color: #f43f5e;color: #fff;font-weight: 600;',
  },
});

/**
 * @description 日志记录器
 * @example
 * import { Logger } from '@compass-aiden/utils';
 *
 * // 单例模式使用
 * console.log(Logger.config); // 默认配置项
 * Logger.config.logLevel = 'debug'; // 修改单个配置
 * Logger.updateConfig({
 *   logLevel: 'debug',
 *   dateFormat: 'YYYY-MM-DD hh:mm:ss:SSS',
 * }); // 批量修改配置
 * Logger.debug('Hello world');
 * Logger.log('Hello world');
 * Logger.info('Hello world');
 * Logger.success('Hello world');
 * Logger.warn('Hello world');
 * Logger.error('Hello world');
 *
 * // 多例模式使用
 * const loggerMulti = new Logger();
 * console.log(loggerMulti.config); // 默认配置项
 * loggerMulti.config.logLevel = 'debug'; // 修改单个配置
 * loggerMulti.updateConfig({
 *   subject: 'Aiden2',
 *   logLevel: 'debug',
 *   dateFormat: 'YYYY-MM-DD hh:mm:ss',
 * }); // 批量修改配置
 * loggerMulti.debug('Hello world');
 * loggerMulti.log('Hello world');
 * loggerMulti.info('Hello world');
 * loggerMulti.success('Hello world');
 * loggerMulti.warn('Hello world');
 * loggerMulti.error('Hello world');
 */
export default class Logger {
  static config: LoggerOption = defaultConfig();

  config: LoggerOption = defaultConfig();

  static updateConfig(option?: Partial<LoggerOption>) {
    this.config = {
      ...this.config,
      ...option,
      ...{ styles: option?.styles ? Object.assign(this.config.styles, option.styles) : this.config.styles },
    };
  }

  updateConfig(option?: Partial<LoggerOption>) {
    this.config = {
      ...this.config,
      ...option,
      ...{ styles: option?.styles ? Object.assign(this.config.styles, option.styles) : this.config.styles },
    };
  }

  static debug(...args: unknown[]) {
    if (['debug'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'debug',
          ...this.config,
        },
        ...args,
      );
    }
  }

  debug(...args: unknown[]) {
    if (['debug'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'debug',
          ...this.config,
        },
        ...args,
      );
    }
  }

  static log(...args: unknown[]) {
    if (['debug', 'log'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'log',
          ...this.config,
        },
        ...args,
      );
    }
  }

  log(...args: unknown[]) {
    if (['debug', 'log'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'log',
          ...this.config,
        },
        ...args,
      );
    }
  }

  static info(...args: unknown[]) {
    if (['debug', 'log', 'info'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'info',
          ...this.config,
        },
        ...args,
      );
    }
  }

  info(...args: unknown[]) {
    if (['debug', 'log', 'info'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'info',
          ...this.config,
        },
        ...args,
      );
    }
  }

  static success(...args: unknown[]) {
    if (['debug', 'log', 'info', 'success'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'success',
          ...this.config,
        },
        ...args,
      );
    }
  }

  success(...args: unknown[]) {
    if (['debug', 'log', 'info', 'success'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'success',
          ...this.config,
        },
        ...args,
      );
    }
  }

  static warn(...args: unknown[]) {
    if (['debug', 'log', 'info', 'success', 'warn'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'warn',
          ...this.config,
        },
        ...args,
      );
    }
  }

  warn(...args: unknown[]) {
    if (['debug', 'log', 'info', 'success', 'warn'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'warn',
          ...this.config,
        },
        ...args,
      );
    }
  }

  static error(...args: unknown[]) {
    if (['debug', 'log', 'info', 'success', 'warn', 'error'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'error',
          ...this.config,
        },
        ...args,
      );
    }
  }

  error(...args: unknown[]) {
    if (['debug', 'log', 'info', 'success', 'warn', 'error'].includes(this.config.logLevel)) {
      println(
        {
          logKey: 'error',
          ...this.config,
        },
        ...args,
      );
    }
  }
}
