interface DeviceInfo {
  /** 设备平台类型 */
  platform: 'mobile' | 'tablet' | 'desktop';
  /** 操作系统类型 */
  os: 'harmonyos' | 'android' | 'ios' | 'macos' | 'windows' | 'linux' | 'desktop';
  /** 具体设备类型 */
  device: 'iphone' | 'ipad' | 'harmonyos_tablet' | 'android_tablet' | 'harmonyos_phone' | 'android_phone' | 'desktop';
  /** 操作系统版本号 */
  osVersion: string;
  /** 原始 User Agent */
  userAgent: string;
  /** 浏览器信息 */
  browser: BrowserInfo;
  /** 屏幕信息 */
  screen: ScreenInfo;
  /** 是否为移动设备 */
  isMobile: boolean;
  /** 是否为平板设备 */
  isTablet: boolean;
  /** 是否为桌面设备 */
  isDesktop: boolean;
  /** 是否为Android设备 */
  isAndroid: boolean;
  /** 是否为鸿蒙系统设备 */
  isHarmonyOS: boolean;
  /** 是否为iPhone设备 */
  isIPhone: boolean;
  /** 是否为iPad设备 */
  isIPad: boolean;
  /** 是否为Android平板 */
  isAndroidTablet: boolean;
  /** 是否为鸿蒙平板 */
  isHarmonyOSTablet: boolean;
  /** 是否为iPadOS 13+系统 */
  isIPadOS13Plus: boolean;
  /** 是否为 Mac 系统 */
  isMac: boolean;
  /** 是否为 Windows 系统 */
  isWindows: boolean;
  /** 是否为 Linux 系统 */
  isLinux: boolean;
  /** 是否支持触摸 */
  isTouchDevice: boolean;
  /** 是否为 PWA 环境 */
  isPWA: boolean;
}

interface BrowserInfo {
  /** 浏览器名称 */
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'ie' | 'unknown';
  /** 浏览器版本 */
  version: string;
  /** 浏览器引擎 */
  engine: 'webkit' | 'gecko' | 'blink' | 'trident' | 'unknown';
  /** 是否为移动浏览器 */
  isMobile: boolean;
}

interface ScreenInfo {
  /** 屏幕宽度 */
  width: number;
  /** 屏幕高度 */
  height: number;
  /** 设备像素比 */
  pixelRatio: number;
  /** 可视区域宽度 */
  availableWidth: number;
  /** 可视区域高度 */
  availableHeight: number;
  /** 颜色深度 */
  colorDepth: number;
  /** 方向 */
  orientation: 'portrait' | 'landscape' | 'unknown';
}

interface DeviceDetectionOptions {
  /** 自定义 User Agent，主要用于测试 */
  userAgent?: string;
  /** 是否启用缓存 */
  enableCache?: boolean;
}

// 缓存结果
let cachedDeviceInfo: DeviceInfo | null = null;
let lastUserAgent: string | null = null;

/**
 * @description 检测浏览器信息
 * @param ua User Agent 字符串
 * @returns 浏览器信息
 */
function detectBrowser(ua: string): BrowserInfo {
  const lowerUA = ua.toLowerCase();

  let name: BrowserInfo['name'] = 'unknown';
  let version = '';
  let engine: BrowserInfo['engine'] = 'unknown';

  // 检测浏览器名称和版本
  if (lowerUA.includes('edg/')) {
    name = 'edge';
    const match = lowerUA.match(/edg\/([\d.]+)/);
    version = match ? match[1] : '';
    engine = 'blink';
  } else if (lowerUA.includes('chrome/') && !lowerUA.includes('edg/')) {
    name = 'chrome';
    const match = lowerUA.match(/chrome\/([\d.]+)/);
    version = match ? match[1] : '';
    engine = 'blink';
  } else if (lowerUA.includes('firefox/')) {
    name = 'firefox';
    const match = lowerUA.match(/firefox\/([\d.]+)/);
    version = match ? match[1] : '';
    engine = 'gecko';
  } else if (lowerUA.includes('safari/') && !lowerUA.includes('chrome/')) {
    name = 'safari';
    const match = lowerUA.match(/version\/([\d.]+)/);
    version = match ? match[1] : '';
    engine = 'webkit';
  } else if (lowerUA.includes('opera/') || lowerUA.includes('opr/')) {
    name = 'opera';
    const match = lowerUA.match(/(opera|opr)\/([\d.]+)/);
    version = match ? match[2] : '';
    engine = 'blink';
  } else if (lowerUA.includes('msie') || lowerUA.includes('trident/')) {
    name = 'ie';
    const match = lowerUA.match(/(msie\s|rv:)([\d.]+)/);
    version = match ? match[2] : '';
    engine = 'trident';
  }

  const isMobile = lowerUA.includes('mobile') || lowerUA.includes('android');

  return { name, version, engine, isMobile };
}

/**
 * @description 获取屏幕信息
 * @returns 屏幕信息
 */
function getScreenInfo(): ScreenInfo {
  if (typeof window === 'undefined' || typeof screen === 'undefined') {
    return {
      width: 0,
      height: 0,
      pixelRatio: 1,
      availableWidth: 0,
      availableHeight: 0,
      colorDepth: 24,
      orientation: 'unknown',
    };
  }

  const { width, height, availWidth, availHeight, colorDepth } = screen;
  const pixelRatio = window.devicePixelRatio || 1;

  let orientation: ScreenInfo['orientation'] = 'unknown';
  if (typeof window.screen.orientation !== 'undefined') {
    orientation = window.screen.orientation.angle % 180 === 0 ? 'portrait' : 'landscape';
  } else if (width && height) {
    orientation = width > height ? 'landscape' : 'portrait';
  }

  return {
    width,
    height,
    pixelRatio,
    availableWidth: availWidth,
    availableHeight: availHeight,
    colorDepth,
    orientation,
  };
}

/**
 * @description 检测是否为触摸设备
 * @returns 是否支持触摸
 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return !!(
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - IE specific property
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * @description 检测是否为 PWA 环境
 * @returns 是否为 PWA
 */
function isPWAEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  return !!(
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - Safari specific property
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
  );
}

/**
 * @description 提取操作系统版本
 * @param ua User Agent 字符串
 * @param os 操作系统类型
 * @returns 版本号
 */
function extractOSVersion(ua: string, os: string): string {
  const lowerUA = ua.toLowerCase();

  switch (os) {
    case 'android': {
      const match = lowerUA.match(/android\s([\d.]+)/);
      return match ? match[1] : '';
    }
    case 'ios': {
      const match = lowerUA.match(/os\s([\d_]+)/);
      return match ? match[1].replace(/_/g, '.') : '';
    }
    case 'harmonyos': {
      const match = lowerUA.match(/harmonyos\s([\d.]+)/) || lowerUA.match(/hos\s([\d.]+)/);
      return match ? match[1] : '';
    }
    case 'macos': {
      const match = lowerUA.match(/mac os x\s([\d_]+)/);
      return match ? match[1].replace(/_/g, '.') : '';
    }
    case 'windows': {
      const match = lowerUA.match(/windows nt\s([\d.]+)/);
      return match ? match[1] : '';
    }
    default:
      return '';
  }
}

/**
 * @description 获取设备信息
 * @param options 检测选项
 * @returns 设备信息对象
 * @category Tools
 * @example
 * // 基本用法
 * const deviceInfo = getDeviceInfo();
 * console.log(deviceInfo.platform); // 'mobile'
 * console.log(deviceInfo.os); // 'android'
 * console.log(deviceInfo.device); // 'android_tablet'
 *
 * // 检查设备类型
 * if (deviceInfo.isMobile) {
 *   console.log('移动设备');
 * } else if (deviceInfo.isTablet) {
 *   console.log('平板设备');
 * } else {
 *   console.log('桌面设备');
 * }
 *
 * // 浏览器信息
 * console.log(`浏览器: ${deviceInfo.browser.name} ${deviceInfo.browser.version}`);
 *
 * // 屏幕信息
 * console.log(`屏幕: ${deviceInfo.screen.width}x${deviceInfo.screen.height}`);
 * console.log(`像素比: ${deviceInfo.screen.pixelRatio}`);
 *
 * // 自定义 User Agent（测试用）
 * const testInfo = getDeviceInfo({
 *   userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
 * });
 *
 * // 禁用缓存
 * const freshInfo = getDeviceInfo({ enableCache: false });
 */
export function getDeviceInfo(options: DeviceDetectionOptions = {}): DeviceInfo {
  const { userAgent: customUA, enableCache = true } = options;

  // 在非浏览器环境下，返回默认桌面对象
  if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
    console.warn('`getDeviceInfo` is intended for browser environments. Returning a default desktop object.');
    return createDefaultDeviceInfo();
  }

  const ua = customUA || navigator.userAgent;

  // 检查缓存
  if (enableCache && cachedDeviceInfo && lastUserAgent === ua) {
    return cachedDeviceInfo;
  }

  const lowerUA = ua.toLowerCase();

  // 基础设备检测
  const isAndroid = lowerUA.includes('android');
  const isHarmonyOS = lowerUA.includes('harmonyos') || lowerUA.includes('hos');
  const isIPhone = lowerUA.includes('iphone');
  const isIPad = lowerUA.includes('ipad') || (lowerUA.includes('macintosh') && navigator.maxTouchPoints > 1);
  const isMac = lowerUA.includes('macintosh') && !isIPad;
  const isWindows = lowerUA.includes('windows');
  const isLinux = lowerUA.includes('linux') && !isAndroid;

  // 平台类型判断
  const isTablet = isIPad || ((isAndroid || isHarmonyOS) && !lowerUA.includes('mobile'));
  const isMobile = isIPhone || ((isAndroid || isHarmonyOS) && lowerUA.includes('mobile'));
  const isDesktop = !isMobile && !isTablet;

  // 细化设备判断
  const isAndroidTablet = isAndroid && isTablet;
  const isHarmonyOSTablet = isHarmonyOS && isTablet;
  const isAndroidPhone = isAndroid && isMobile;
  const isHarmonyOSPhone = isHarmonyOS && isMobile;
  const isIPadOS13Plus = isIPad && !lowerUA.includes('ipad'); // iPadOS 13+ desktop-mode iPad

  // 确定操作系统
  const os: DeviceInfo['os'] = (() => {
    if (isHarmonyOS) return 'harmonyos';
    if (isAndroid) return 'android';
    if (isIPhone || isIPad) return 'ios';
    if (isMac) return 'macos';
    if (isWindows) return 'windows';
    if (isLinux) return 'linux';
    return 'desktop';
  })();

  // 确定平台
  const platform: DeviceInfo['platform'] = (() => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  })();

  // 确定具体设备
  const device: DeviceInfo['device'] = (() => {
    if (isIPhone) return 'iphone';
    if (isIPad) return 'ipad';
    if (isHarmonyOSTablet) return 'harmonyos_tablet';
    if (isAndroidTablet) return 'android_tablet';
    if (isHarmonyOSPhone) return 'harmonyos_phone';
    if (isAndroidPhone) return 'android_phone';
    return 'desktop';
  })();

  const osVersion = extractOSVersion(ua, os);
  const browser = detectBrowser(ua);
  const screen = getScreenInfo();
  const isTouchSupported = isTouchDevice();
  const isPWA = isPWAEnvironment();

  const deviceInfo: DeviceInfo = {
    platform,
    os,
    device,
    osVersion,
    userAgent: ua,
    browser,
    screen,
    isMobile,
    isTablet,
    isDesktop,
    isAndroid,
    isHarmonyOS,
    isIPhone,
    isIPad,
    isAndroidTablet,
    isHarmonyOSTablet,
    isIPadOS13Plus,
    isMac,
    isWindows,
    isLinux,
    isTouchDevice: isTouchSupported,
    isPWA,
  };

  // 缓存结果
  if (enableCache) {
    cachedDeviceInfo = deviceInfo;
    lastUserAgent = ua;
  }

  return deviceInfo;
}

/**
 * @description 创建默认的设备信息对象（用于非浏览器环境）
 * @returns 默认设备信息
 */
function createDefaultDeviceInfo(): DeviceInfo {
  return {
    platform: 'desktop',
    os: 'desktop',
    device: 'desktop',
    osVersion: '',
    userAgent: '',
    browser: {
      name: 'unknown',
      version: '',
      engine: 'unknown',
      isMobile: false,
    },
    screen: {
      width: 0,
      height: 0,
      pixelRatio: 1,
      availableWidth: 0,
      availableHeight: 0,
      colorDepth: 24,
      orientation: 'unknown',
    },
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isAndroid: false,
    isHarmonyOS: false,
    isIPhone: false,
    isIPad: false,
    isAndroidTablet: false,
    isHarmonyOSTablet: false,
    isIPadOS13Plus: false,
    isMac: false,
    isWindows: false,
    isLinux: false,
    isTouchDevice: false,
    isPWA: false,
  };
}

/**
 * @description 清除设备信息缓存
 * @category Tools
 * @example
 * // 清除缓存，下次调用时重新检测
 * clearDeviceInfoCache();
 * const freshInfo = getDeviceInfo();
 */
export function clearDeviceInfoCache(): void {
  cachedDeviceInfo = null;
  lastUserAgent = null;
}

/**
 * @description 检查是否为特定设备类型
 * @param deviceType 设备类型
 * @param options 检测选项
 * @returns 是否为指定设备类型
 * @category Tools
 * @example
 * // 检查是否为移动设备
 * if (isDeviceType('mobile')) {
 *   console.log('当前是移动设备');
 * }
 *
 * // 检查是否为特定操作系统
 * if (isDeviceType('ios')) {
 *   console.log('当前是 iOS 设备');
 * }
 */
export function isDeviceType(
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'android' | 'ios' | 'harmonyos' | 'macos' | 'windows' | 'linux',
  options?: DeviceDetectionOptions,
): boolean {
  const deviceInfo = getDeviceInfo(options);

  switch (deviceType) {
    case 'mobile':
      return deviceInfo.isMobile;
    case 'tablet':
      return deviceInfo.isTablet;
    case 'desktop':
      return deviceInfo.isDesktop;
    case 'android':
      return deviceInfo.isAndroid;
    case 'ios':
      return deviceInfo.isIPhone || deviceInfo.isIPad;
    case 'harmonyos':
      return deviceInfo.isHarmonyOS;
    case 'macos':
      return deviceInfo.isMac;
    case 'windows':
      return deviceInfo.isWindows;
    case 'linux':
      return deviceInfo.isLinux;
    default:
      return false;
  }
}
