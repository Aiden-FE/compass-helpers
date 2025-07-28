interface CookieOptions {
  /** Cookie 的路径，默认为 '/' */
  path?: string;
  /** Cookie 的域名 */
  domain?: string;
  /** Cookie 的过期时间（毫秒），undefined 表示会话 cookie */
  expiresIn?: number;
  /** Cookie 的过期日期 */
  expires?: Date;
  /** 是否只能通过 HTTPS 传输 */
  secure?: boolean;
  /** 是否只能通过 HTTP 访问（不能通过 JavaScript） */
  httpOnly?: boolean;
  /** SameSite 属性 */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

interface ParsedCookie {
  name: string;
  value: string;
}

/**
 * @description 检查是否在浏览器环境中
 * @returns 是否在浏览器环境
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * @description 验证 cookie 名称是否有效
 * @param name Cookie 名称
 * @returns 是否有效
 */
function isValidCookieName(name: string): boolean {
  // Cookie 名称不能包含控制字符、空格、制表符、以及特殊字符
  const invalidChars = /[\s\t\n\r\f;,=]/;
  return name.length > 0 && !invalidChars.test(name);
}

/**
 * @description 编码 cookie 值
 * @param value 原始值
 * @returns 编码后的值
 */
function encodeCookieValue(value: string): string {
  return encodeURIComponent(value);
}

/**
 * @description 解码 cookie 值
 * @param value 编码的值
 * @returns 解码后的值
 */
function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // 如果解码失败，返回原值
    return value;
  }
}

/**
 * @description 获取指定名称的 cookie 值
 * @param name Cookie 名称
 * @returns Cookie 值，如果不存在则返回 null
 * @category Tools
 * @example
 * // 获取用户ID
 * const userId = getCookie('user_id');
 * if (userId) {
 *   console.log('用户ID:', userId);
 * } else {
 *   console.log('用户未登录');
 * }
 *
 * // 获取主题设置
 * const theme = getCookie('theme') || 'light';
 */
export function getCookie(name: string): string | null {
  if (!isBrowser()) {
    console.warn('getCookie: Not in browser environment');
    return null;
  }

  if (!isValidCookieName(name)) {
    console.warn(`getCookie: Invalid cookie name "${name}"`);
    return null;
  }

  try {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.trim().split('=');

      if (cookieName === name) {
        const cookieValue = cookieValueParts.join('='); // 处理值中可能包含 '=' 的情况
        return cookieValue ? decodeCookieValue(cookieValue) : '';
      }
    }

    return null;
  } catch (error) {
    console.error('getCookie: Failed to parse cookies', error);
    return null;
  }
}

/**
 * @description 设置 cookie
 * @param name Cookie 名称
 * @param value Cookie 值
 * @param options Cookie 配置选项
 * @category Tools
 * @example
 * // 基本用法
 * setCookie('username', 'john_doe');
 *
 * // 设置过期时间（7天后过期）
 * setCookie('session_token', 'abc123', {
 *   expiresIn: 7 * 24 * 60 * 60 * 1000, // 7天
 *   secure: true,
 *   sameSite: 'Strict'
 * });
 *
 * // 设置域名和路径
 * setCookie('site_preference', 'dark_mode', {
 *   domain: '.example.com',
 *   path: '/app',
 *   expiresIn: 30 * 24 * 60 * 60 * 1000 // 30天
 * });
 *
 * // 会话 cookie（浏览器关闭时删除）
 * setCookie('temp_data', 'some_value'); // 不设置 expiresIn
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): boolean {
  if (!isBrowser()) {
    console.warn('setCookie: Not in browser environment');
    return false;
  }

  if (!isValidCookieName(name)) {
    console.warn(`setCookie: Invalid cookie name "${name}"`);
    return false;
  }

  try {
    const { path = '/', domain, expiresIn, expires, secure, httpOnly, sameSite } = options;

    // 构建 cookie 字符串
    let cookieString = `${name}=${encodeCookieValue(value)}`;

    // 添加路径
    if (path) {
      cookieString += `; Path=${path}`;
    }

    // 添加域名
    if (domain) {
      cookieString += `; Domain=${domain}`;
    }

    // 处理过期时间
    if (expires) {
      cookieString += `; Expires=${expires.toUTCString()}`;
    } else if (expiresIn !== undefined && expiresIn > 0) {
      const expireDate = new Date();
      expireDate.setTime(expireDate.getTime() + expiresIn);
      cookieString += `; Expires=${expireDate.toUTCString()}`;
    }

    // 添加安全选项
    if (secure) {
      cookieString += '; Secure';
    }

    if (httpOnly) {
      cookieString += '; HttpOnly';
    }

    if (sameSite) {
      cookieString += `; SameSite=${sameSite}`;
    }

    document.cookie = cookieString;
    return true;
  } catch (error) {
    console.error('setCookie: Failed to set cookie', error);
    return false;
  }
}

/**
 * @description 删除指定名称的 cookie
 * @param name Cookie 名称
 * @param options 删除选项（主要是 path 和 domain）
 * @category Tools
 * @example
 * // 删除默认路径的 cookie
 * deleteCookie('session_token');
 *
 * // 删除特定路径和域名的 cookie
 * deleteCookie('user_pref', {
 *   path: '/app',
 *   domain: '.example.com'
 * });
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): boolean {
  return setCookie(name, '', {
    ...options,
    expiresIn: -1, // 设置为过期
  });
}

/**
 * @description 获取所有 cookies
 * @returns 包含所有 cookie 的对象，如果获取失败则返回空对象
 * @category Tools
 * @example
 * const allCookies = getAllCookies();
 * console.log('所有 cookies:', allCookies);
 *
 * // 检查特定 cookie 是否存在
 * if ('user_id' in allCookies) {
 *   console.log('用户已登录');
 * }
 */
export function getAllCookies(): Record<string, string> {
  if (!isBrowser()) {
    console.warn('getAllCookies: Not in browser environment');
    return {};
  }

  try {
    const cookies: Record<string, string> = {};
    const cookieString = document.cookie;

    if (!cookieString) {
      return cookies;
    }

    cookieString.split(';').forEach((cookie) => {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name) {
        const value = valueParts.join('=');
        cookies[name] = value ? decodeCookieValue(value) : '';
      }
    });

    return cookies;
  } catch (error) {
    console.error('getAllCookies: Failed to parse cookies', error);
    return {};
  }
}

/**
 * @description 解析 cookie 字符串为结构化数据
 * @param cookieString Cookie 字符串
 * @returns 解析后的 cookie 数组
 * @category Tools
 * @example
 * const cookieString = 'name1=value1; name2=value2';
 * const parsed = parseCookies(cookieString);
 * console.log(parsed); // [{ name: 'name1', value: 'value1' }, { name: 'name2', value: 'value2' }]
 */
export function parseCookies(cookieString: string): ParsedCookie[] {
  const cookies: ParsedCookie[] = [];

  if (!cookieString?.trim()) {
    return cookies;
  }

  try {
    cookieString.split(';').forEach((cookie) => {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name) {
        const value = valueParts.join('=');
        cookies.push({
          name: name.trim(),
          value: value ? decodeCookieValue(value) : '',
        });
      }
    });
  } catch (error) {
    console.error('parseCookies: Failed to parse cookie string', error);
  }

  return cookies;
}

/**
 * @description 检查是否支持 cookies
 * @returns 是否支持 cookies
 * @category Tools
 * @example
 * if (isCookieSupported()) {
 *   setCookie('test', 'value');
 * } else {
 *   console.warn('浏览器不支持 cookies');
 * }
 */
export function isCookieSupported(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const testCookieName = '__cookie_test__';
    const testCookieValue = 'test';

    // 尝试设置测试 cookie
    setCookie(testCookieName, testCookieValue);

    // 检查是否能读取
    const retrieved = getCookie(testCookieName);

    // 清理测试 cookie
    deleteCookie(testCookieName);

    return retrieved === testCookieValue;
  } catch {
    return false;
  }
}

/**
 * @description 清除所有 cookies（仅限当前域名和路径）
 * @param options 清除选项
 * @category Tools
 * @example
 * // 清除所有 cookies
 * clearAllCookies();
 *
 * // 清除特定路径的 cookies
 * clearAllCookies({ path: '/app' });
 */
export function clearAllCookies(options: Pick<CookieOptions, 'path' | 'domain'> = {}): number {
  if (!isBrowser()) {
    console.warn('clearAllCookies: Not in browser environment');
    return 0;
  }

  try {
    const cookies = getAllCookies();
    let clearedCount = 0;

    for (const name of Object.keys(cookies)) {
      if (deleteCookie(name, options)) {
        clearedCount++;
      }
    }

    return clearedCount;
  } catch (error) {
    console.error('clearAllCookies: Failed to clear cookies', error);
    return 0;
  }
}

/**
 * @description Cookie 管理器类，提供更高级的 cookie 操作
 * @category Tools
 * @example
 * const cookieManager = new CookieManager({
 *   domain: '.example.com',
 *   secure: true,
 *   sameSite: 'Strict'
 * });
 *
 * // 设置带默认选项的 cookie
 * cookieManager.set('user_id', '12345', { expiresIn: 7 * 24 * 60 * 60 * 1000 });
 *
 * // 获取 cookie
 * const userId = cookieManager.get('user_id');
 *
 * // 删除 cookie
 * cookieManager.delete('user_id');
 */
export class CookieManager {
  private defaultOptions: CookieOptions;

  constructor(defaultOptions: CookieOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * @description 获取 cookie
   * @param name Cookie 名称
   * @returns Cookie 值
   */
  get(name: string): string | null {
    return getCookie(name);
  }

  /**
   * @description 设置 cookie
   * @param name Cookie 名称
   * @param value Cookie 值
   * @param options 选项（会与默认选项合并）
   * @returns 是否设置成功
   */
  set(name: string, value: string, options: CookieOptions = {}): boolean {
    return setCookie(name, value, { ...this.defaultOptions, ...options });
  }

  /**
   * @description 删除 cookie
   * @param name Cookie 名称
   * @param options 选项
   * @returns 是否删除成功
   */
  delete(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): boolean {
    const deleteOptions = {
      path: options.path || this.defaultOptions.path,
      domain: options.domain || this.defaultOptions.domain,
    };
    return deleteCookie(name, deleteOptions);
  }

  /**
   * @description 获取所有 cookies
   * @returns 所有 cookies 对象
   */
  getAll(): Record<string, string> {
    return getAllCookies();
  }

  /**
   * @description 清除所有 cookies
   * @returns 清除的 cookie 数量
   */
  clearAll(): number {
    const clearOptions = {
      path: this.defaultOptions.path,
      domain: this.defaultOptions.domain,
    };
    return clearAllCookies(clearOptions);
  }

  /**
   * @description 更新默认选项
   * @param options 新的默认选项
   */
  updateDefaults(options: CookieOptions): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}
