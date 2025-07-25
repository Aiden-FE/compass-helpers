import formatDate from '@/common-utils/format-date';

/** 日志级别枚举 */
export const LogLevel = {
  DEBUG: 0,
  LOG: 1,
  INFO: 2,
  SUCCESS: 3,
  WARN: 4,
  ERROR: 5,
} as const;

export type LogLevelKey = keyof typeof LogLevel;
export type LogLevelValue = (typeof LogLevel)[LogLevelKey];

/** 日志方法类型 */
export type LogMethod = 'debug' | 'log' | 'info' | 'success' | 'warn' | 'error';

/** ANSI 颜色代码 */
export const ANSI = {
  reset: '\x1b[0m',

  // 字体颜色
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // 亮色版本
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // 字体样式
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // 背景颜色
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

/** 样式配置 */
export interface StyleConfig {
  /** 浏览器环境的 CSS 样式 */
  browser: string;
  /** Node.js 环境的 ANSI 样式 */
  node: string;
}

/** 日志配置选项 */
export interface LoggerOptions {
  /** 业务域标题 */
  subject?: string;
  /** 日志输出级别，大于等于指定级别均会打印日志 */
  logLevel?: LogLevelKey;
  /** 标题前缀 */
  prefix?: string;
  /** 标题后缀 */
  suffix?: string;
  /** 日志格式化字符串，false 表示不显示时间 */
  dateFormat?: string | boolean;
  /** 日期不足位数是否补0 */
  isDatePadZero?: boolean;
  /** 是否启用样式输出 */
  enableStyling?: boolean;
  /** 是否显示堆栈跟踪（仅错误级别） */
  showStackTrace?: boolean;
  /** 各日志样式 */
  styles?: Partial<LoggerStyles>;
  /** 打印后的hook函数 */
  afterPrint?: (level: LogMethod, message: string, ...args: unknown[]) => void;
}

/** 日志样式配置 */
export interface LoggerStyles {
  debug: StyleConfig;
  log: StyleConfig;
  info: StyleConfig;
  success: StyleConfig;
  warn: StyleConfig;
  error: StyleConfig;
}

/** 日志消息格式化选项 */
interface FormatOptions {
  level: LogMethod;
  message?: string;
  timestamp?: string;
  subject?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * @description 检测是否在浏览器环境
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * @description 安全获取全局变量
 */
function safeGlobal<T>(name: string): T | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return (globalThis as any)[name];
  } catch {
    return undefined;
  }
}

/**
 * @description 检测是否支持颜色输出
 */
function supportsColor(): boolean {
  if (isBrowser()) {
    return true; // 浏览器总是支持样式
  }

  // Node.js 环境检测
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const processObj = safeGlobal<any>('process');
  if (!processObj) {
    return false;
  }

  // 检查环境变量
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (processObj.env?.FORCE_COLOR) {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (processObj.env?.NO_COLOR || processObj.env?.NODE_DISABLE_COLORS) {
    return false;
  }

  // 检查 TTY 和颜色支持
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return processObj.stdout?.isTTY && processObj.stdout?.hasColors?.() !== false;
}

/**
 * @description 创建 ANSI 样式字符串
 */
function createAnsiStyle(...codes: string[]): string {
  return codes.join('');
}

/**
 * @description 应用 ANSI 样式到文本
 */
function ansiColorize(text: string, ansiStyle: string): string {
  if (!ansiStyle) return text;
  return ansiStyle + text + ANSI.reset;
}

/**
 * @description 获取默认样式配置
 */
function getDefaultStyles(): LoggerStyles {
  return {
    debug: {
      browser: 'padding: 2px 6px; border-radius: 2px; background-color: #6b7280; color: #fff; font-weight: 600;',
      node: createAnsiStyle(ANSI.dim, ANSI.cyan),
    },
    log: {
      browser: 'padding: 2px 6px; border-radius: 2px; background-color: #374151; color: #fff; font-weight: 600;',
      node: createAnsiStyle(ANSI.white),
    },
    info: {
      browser: 'padding: 2px 6px; border-radius: 2px; background-color: #3b82f6; color: #fff; font-weight: 600;',
      node: createAnsiStyle(ANSI.brightBlue),
    },
    success: {
      browser: 'padding: 2px 6px; border-radius: 2px; background-color: #10b981; color: #fff; font-weight: 600;',
      node: createAnsiStyle(ANSI.brightGreen),
    },
    warn: {
      browser: 'padding: 2px 6px; border-radius: 2px; background-color: #f59e0b; color: #fff; font-weight: 600;',
      node: createAnsiStyle(ANSI.brightYellow),
    },
    error: {
      browser: 'padding: 2px 6px; border-radius: 2px; background-color: #ef4444; color: #fff; font-weight: 600;',
      node: createAnsiStyle(ANSI.brightRed),
    },
  };
}

/**
 * @description 获取默认配置
 */
function getDefaultConfig(): Required<LoggerOptions> {
  return {
    subject: '',
    logLevel: 'LOG',
    prefix: '',
    suffix: '',
    dateFormat: false,
    isDatePadZero: true,
    enableStyling: supportsColor(),
    showStackTrace: false,
    styles: getDefaultStyles(),
    afterPrint: () => {},
  };
}

/**
 * @description 格式化日志消息
 */
function formatMessage(options: FormatOptions): string {
  const { level, message = '', timestamp, subject, prefix, suffix } = options;

  const parts = [prefix, timestamp, subject, level.toUpperCase(), suffix, message].filter(Boolean);

  return parts.join(' ');
}

/**
 * @description 获取格式化的时间戳
 */
function getTimestamp(config: Required<LoggerOptions>): string | undefined {
  if (!config.dateFormat) return undefined;

  const format = typeof config.dateFormat === 'string' ? config.dateFormat : 'YYYY-MM-DD hh:mm:ss';

  return formatDate(new Date(), format, { isPadStart: config.isDatePadZero });
}

/**
 * @description 获取堆栈跟踪信息
 */
function getStackTrace(): string | undefined {
  try {
    throw new Error();
  } catch (error) {
    const stack = (error as Error).stack;
    if (!stack) return undefined;

    // 移除 getStackTrace 和 Logger 相关的堆栈帧
    const lines = stack.split('\n');
    const relevantLines = lines.slice(4); // 跳过前4行（Error + getStackTrace + Logger 内部调用）
    return relevantLines.join('\n');
  }
}

/**
 * @description 核心日志打印函数
 */
function printLog(level: LogMethod, config: Required<LoggerOptions>, args: unknown[]): void {
  // 检查日志级别
  const currentLevelValue = LogLevel[config.logLevel];
  const messageLevelValue = LogLevel[level.toUpperCase() as LogLevelKey] ?? LogLevel.LOG;

  if (messageLevelValue < currentLevelValue) {
    return;
  }

  const timestamp = getTimestamp(config);
  const firstArg = args[0];
  const message = typeof firstArg === 'string' ? firstArg : '';
  const restArgs = typeof firstArg === 'string' ? args.slice(1) : args;

  // 格式化消息
  const formattedMessage = formatMessage({
    level,
    message,
    timestamp,
    subject: config.subject,
    prefix: config.prefix,
    suffix: config.suffix,
  });

  // 获取控制台方法
  const consoleMethod = level === 'success' ? 'log' : level;
  const consoleFn = console[consoleMethod] as (...args: unknown[]) => void;

  // 应用样式
  if (config.enableStyling) {
    const styleConfig = config.styles[level];

    if (styleConfig) {
      if (isBrowser()) {
        // 浏览器环境使用 CSS 样式
        const style = styleConfig.browser;
        consoleFn(`%c${formattedMessage}`, style, ...restArgs);
      } else {
        // Node.js 环境使用 ANSI 颜色
        const ansiStyle = styleConfig.node;
        const coloredMessage = ansiColorize(formattedMessage, ansiStyle);
        consoleFn(coloredMessage, ...restArgs);
      }
    } else {
      consoleFn(formattedMessage, ...restArgs);
    }
  } else {
    consoleFn(formattedMessage, ...restArgs);
  }

  // 添加堆栈跟踪（仅错误级别）
  if (config.showStackTrace && level === 'error') {
    const stackTrace = getStackTrace();
    if (stackTrace) {
      console.groupCollapsed('Stack Trace');
      console.log(stackTrace);
      console.groupEnd();
    }
  }

  // 调用后处理钩子
  try {
    config.afterPrint(level, formattedMessage, ...restArgs);
  } catch (error) {
    console.warn('Logger afterPrint hook error:', error);
  }
}

/**
 * @description 日志记录器类
 * @category Factories
 * @example
 * // 使用静态方法（单例模式）
 * Logger.updateConfig({
 *   subject: 'APP',
 *   logLevel: 'DEBUG',
 *   dateFormat: 'YYYY-MM-DD hh:mm:ss',
 *   showStackTrace: true,
 *   enableStyling: true // 自动检测并启用颜色支持
 * });
 *
 * Logger.debug('调试信息', { data: 'test' });
 * Logger.info('普通信息');
 * Logger.success('操作成功');
 * Logger.warn('警告信息');
 * Logger.error('错误信息', new Error('Something went wrong'));
 *
 * // 使用实例（多例模式）
 * const apiLogger = new Logger({
 *   subject: 'API',
 *   prefix: '[API]',
 *   logLevel: 'INFO',
 *   styles: {
 *     info: {
 *       browser: 'color: blue; font-weight: bold;',
 *       node: ANSI.bold + ANSI.blue // 自定义 Node.js 样式
 *     }
 *   }
 * });
 *
 * const dbLogger = new Logger({
 *   subject: 'DB',
 *   prefix: '[DATABASE]',
 *   logLevel: 'WARN'
 * });
 *
 * apiLogger.info('API 请求开始');
 * dbLogger.warn('数据库连接缓慢');
 *
 * // 日志分组
 * Logger.group('用户操作');
 * Logger.info('用户登录');
 * Logger.info('加载用户数据');
 * Logger.groupEnd();
 *
 * // 性能测量
 * Logger.time('数据处理');
 * // ... 一些处理逻辑
 * Logger.timeEnd('数据处理');
 *
 * // 条件日志
 * Logger.assert(user.id, '用户ID不能为空');
 *
 * // 表格日志
 * Logger.table([
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 30 }
 * ]);
 */
export default class Logger {
  /** 静态配置（单例模式使用） */
  private static staticConfig: Required<LoggerOptions> = getDefaultConfig();

  /** 实例配置 */
  private config: Required<LoggerOptions>;

  /** 记录原始 ERROR 级别值 */
  private static originalErrorLevel = LogLevel.ERROR;

  constructor(options: LoggerOptions = {}) {
    const defaultStyles = getDefaultStyles();
    const mergedStyles = this.mergeStyles(defaultStyles, options.styles || {});

    this.config = {
      ...getDefaultConfig(),
      ...options,
      styles: {
        ...defaultStyles,
        ...mergedStyles,
      } as LoggerStyles,
    };
  }

  /**
   * @description 合并样式配置
   */
  private mergeStyles(defaultStyles: LoggerStyles, customStyles: Partial<LoggerStyles>): LoggerStyles {
    const merged: LoggerStyles = { ...defaultStyles };

    for (const [level, style] of Object.entries(customStyles)) {
      const levelKey = level as keyof LoggerStyles;
      const defaultStyle = defaultStyles[levelKey];

      if (typeof style === 'string') {
        // 向后兼容：如果传入字符串，同时用于浏览器和 Node.js
        merged[levelKey] = {
          browser: style,
          node: style,
        };
      } else if (style && typeof style === 'object') {
        // 新格式：分别指定浏览器和 Node.js 样式
        merged[levelKey] = {
          browser: style.browser || defaultStyle.browser,
          node: style.node || defaultStyle.node,
        };
      }
    }

    return merged;
  }

  /**
   * @description 获取当前配置（静态）
   */
  static get currentConfig(): Readonly<Required<LoggerOptions>> {
    return { ...this.staticConfig };
  }

  /**
   * @description 获取当前配置（实例）
   */
  get currentConfig(): Readonly<Required<LoggerOptions>> {
    return { ...this.config };
  }

  /**
   * @description 更新配置（静态）
   */
  static updateConfig(options: Partial<LoggerOptions>): void {
    const mergedStyles = this.mergeStylesStatic(this.staticConfig.styles as LoggerStyles, options.styles || {});

    this.staticConfig = {
      ...this.staticConfig,
      ...options,
      styles: {
        ...this.staticConfig.styles,
        ...mergedStyles,
      } as LoggerStyles,
    };
  }

  /**
   * @description 静态方法的样式合并
   */
  private static mergeStylesStatic(defaultStyles: LoggerStyles, customStyles: Partial<LoggerStyles>): LoggerStyles {
    const merged: LoggerStyles = { ...defaultStyles };

    for (const [level, style] of Object.entries(customStyles)) {
      const levelKey = level as keyof LoggerStyles;
      const defaultStyle = defaultStyles[levelKey];

      if (typeof style === 'string') {
        merged[levelKey] = {
          browser: style,
          node: style,
        };
      } else if (style && typeof style === 'object') {
        merged[levelKey] = {
          browser: style.browser || defaultStyle.browser,
          node: style.node || defaultStyle.node,
        };
      }
    }

    return merged;
  }

  /**
   * @description 更新配置（实例）
   */
  updateConfig(options: Partial<LoggerOptions>): void {
    const mergedStyles = this.mergeStyles(this.config.styles as LoggerStyles, options.styles || {});

    this.config = {
      ...this.config,
      ...options,
      styles: {
        ...this.config.styles,
        ...mergedStyles,
      } as LoggerStyles,
    };
  }

  /**
   * @description 重置配置为默认值（静态）
   */
  static resetConfig(): void {
    this.staticConfig = getDefaultConfig();
  }

  /**
   * @description 重置配置为默认值（实例）
   */
  resetConfig(): void {
    this.config = getDefaultConfig();
  }

  // 静态日志方法
  static debug(...args: unknown[]): void {
    printLog('debug', this.staticConfig, args);
  }

  static log(...args: unknown[]): void {
    printLog('log', this.staticConfig, args);
  }

  static info(...args: unknown[]): void {
    printLog('info', this.staticConfig, args);
  }

  static success(...args: unknown[]): void {
    printLog('success', this.staticConfig, args);
  }

  static warn(...args: unknown[]): void {
    printLog('warn', this.staticConfig, args);
  }

  static error(...args: unknown[]): void {
    printLog('error', this.staticConfig, args);
  }

  // 实例日志方法
  debug(...args: unknown[]): void {
    printLog('debug', this.config, args);
  }

  log(...args: unknown[]): void {
    printLog('log', this.config, args);
  }

  info(...args: unknown[]): void {
    printLog('info', this.config, args);
  }

  success(...args: unknown[]): void {
    printLog('success', this.config, args);
  }

  warn(...args: unknown[]): void {
    printLog('warn', this.config, args);
  }

  error(...args: unknown[]): void {
    printLog('error', this.config, args);
  }

  // 扩展日志功能

  /**
   * @description 日志分组开始（静态）
   */
  static group(label?: string): void {
    if (console.group) {
      console.group(label);
    }
  }

  /**
   * @description 日志分组开始（实例）
   */
  group(label?: string): void {
    Logger.group(label);
  }

  /**
   * @description 日志分组开始（折叠）（静态）
   */
  static groupCollapsed(label?: string): void {
    if (console.groupCollapsed) {
      console.groupCollapsed(label);
    }
  }

  /**
   * @description 日志分组开始（折叠）（实例）
   */
  groupCollapsed(label?: string): void {
    Logger.groupCollapsed(label);
  }

  /**
   * @description 日志分组结束（静态）
   */
  static groupEnd(): void {
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * @description 日志分组结束（实例）
   */
  groupEnd(): void {
    Logger.groupEnd();
  }

  /**
   * @description 性能计时开始（静态）
   */
  static time(label: string): void {
    if (console.time) {
      console.time(label);
    }
  }

  /**
   * @description 性能计时开始（实例）
   */
  time(label: string): void {
    Logger.time(label);
  }

  /**
   * @description 性能计时结束（静态）
   */
  static timeEnd(label: string): void {
    if (console.timeEnd) {
      console.timeEnd(label);
    }
  }

  /**
   * @description 性能计时结束（实例）
   */
  timeEnd(label: string): void {
    Logger.timeEnd(label);
  }

  /**
   * @description 性能计时日志（静态）
   */
  static timeLog(label: string, ...data: unknown[]): void {
    if (console.timeLog) {
      console.timeLog(label, ...data);
    }
  }

  /**
   * @description 性能计时日志（实例）
   */
  timeLog(label: string, ...data: unknown[]): void {
    Logger.timeLog(label, ...data);
  }

  /**
   * @description 断言日志（静态）
   */
  static assert(condition: boolean, message?: string, ...data: unknown[]): void {
    if (console.assert) {
      console.assert(condition, message, ...data);
    }
  }

  /**
   * @description 断言日志（实例）
   */
  assert(condition: boolean, message?: string, ...data: unknown[]): void {
    Logger.assert(condition, message, ...data);
  }

  /**
   * @description 表格日志（静态）
   */
  static table(data: unknown[], columns?: string[]): void {
    if (console.table) {
      console.table(data, columns);
    }
  }

  /**
   * @description 表格日志（实例）
   */
  table(data: unknown[], columns?: string[]): void {
    Logger.table(data, columns);
  }

  /**
   * @description 清空控制台（静态）
   */
  static clear(): void {
    if (console.clear) {
      console.clear();
    }
  }

  /**
   * @description 清空控制台（实例）
   */
  clear(): void {
    Logger.clear();
  }

  /**
   * @description 计数日志（静态）
   */
  static count(label?: string): void {
    if (console.count) {
      console.count(label);
    }
  }

  /**
   * @description 计数日志（实例）
   */
  count(label?: string): void {
    Logger.count(label);
  }

  /**
   * @description 重置计数器（静态）
   */
  static countReset(label?: string): void {
    if (console.countReset) {
      console.countReset(label);
    }
  }

  /**
   * @description 重置计数器（实例）
   */
  countReset(label?: string): void {
    Logger.countReset(label);
  }

  /**
   * @description 获取支持的日志级别列表
   */
  static getSupportedLevels(): LogLevelKey[] {
    return Object.keys(LogLevel) as LogLevelKey[];
  }

  /**
   * @description 检查指定级别是否会被输出
   */
  static isLevelEnabled(level: LogLevelKey): boolean {
    const currentLevelValue = LogLevel[this.staticConfig.logLevel];
    const checkLevelValue = LogLevel[level];
    return checkLevelValue >= currentLevelValue;
  }

  /**
   * @description 检查指定级别是否会被输出（实例）
   */
  isLevelEnabled(level: LogLevelKey): boolean {
    const currentLevelValue = LogLevel[this.config.logLevel];
    const checkLevelValue = LogLevel[level];
    return checkLevelValue >= currentLevelValue;
  }

  /**
   * @description 创建子记录器（继承当前配置但可以覆盖）
   */
  createChild(options: Partial<LoggerOptions> = {}): Logger {
    const mergedStyles = this.mergeStyles(this.config.styles as LoggerStyles, options.styles || {});

    return new Logger({
      ...this.config,
      ...options,
      styles: {
        ...this.config.styles,
        ...mergedStyles,
      },
    });
  }

  /**
   * @description 禁用所有日志输出（静态）
   */
  static disable(): void {
    this.updateConfig({ logLevel: 'ERROR' });
    // 临时修改 ERROR 级别为最高值以禁用所有输出
    Object.defineProperty(LogLevel, 'ERROR', {
      value: Number.MAX_SAFE_INTEGER,
      writable: true,
      configurable: true,
    });
  }

  /**
   * @description 启用所有日志输出（静态）
   */
  static enable(): void {
    // 恢复 ERROR 级别的正常值
    Object.defineProperty(LogLevel, 'ERROR', {
      value: this.originalErrorLevel,
      writable: true,
      configurable: true,
    });
    this.updateConfig({ logLevel: 'DEBUG' });
  }

  /**
   * @description 检查当前环境是否支持颜色（静态）
   */
  static supportsColor(): boolean {
    return supportsColor();
  }

  /**
   * @description 检查当前环境是否支持颜色（实例）
   */
  supportsColor(): boolean {
    return supportsColor();
  }

  /**
   * @description 获取环境信息（静态）
   */
  static getEnvironmentInfo(): {
    isBrowser: boolean;
    supportsColor: boolean;
    platform: string;
    colorDepth?: number;
  } {
    if (isBrowser()) {
      return {
        isBrowser: true,
        supportsColor: true,
        platform: 'browser',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const processObj = safeGlobal<any>('process');

    return {
      isBrowser: false,
      supportsColor: supportsColor(),
      platform: 'node',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      colorDepth: processObj?.stdout?.getColorDepth?.() || 0,
    };
  }

  /**
   * @description 获取环境信息（实例）
   */
  getEnvironmentInfo(): ReturnType<typeof Logger.getEnvironmentInfo> {
    return Logger.getEnvironmentInfo();
  }
}
