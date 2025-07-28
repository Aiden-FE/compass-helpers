import { TMConstructor, TMThemeConfig, ThemeVariables } from './theme-manager.type';

// 扩展类型定义
interface ThemeInfo {
  name: string;
  data: ThemeVariables;
  isActive: boolean;
}

interface ThemeManagerEvents {
  themeChange: (themeName: string | null, themeData: ThemeVariables | null) => void;
  systemThemeChange: (systemTheme: 'light' | 'dark') => void;
  themeRegister: (themeName: string, themeData: ThemeVariables) => void;
  themeUnregister: (themeName: string) => void;
}

type ThemeManagerEventType = keyof ThemeManagerEvents;

/**
 * @description 将对象转换为 CSS 变量字符串
 * @param data 主题变量对象
 * @returns CSS 变量字符串
 */
function convertToCSSData(data: Record<string, string | number>): string {
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join(';');
}

/**
 * @description 验证主题名称是否有效
 * @param themeName 主题名称
 * @returns 是否有效
 */
function isValidThemeName(themeName: string): boolean {
  return typeof themeName === 'string' && themeName.trim().length > 0 && !/[<>"'&]/.test(themeName);
}

/**
 * @description 验证主题变量是否有效
 * @param themeData 主题变量
 * @returns 是否有效
 */
function isValidThemeData(themeData: ThemeVariables): boolean {
  if (!themeData || typeof themeData !== 'object') return false;

  return Object.entries(themeData).every(([key, value]) => {
    return typeof key === 'string' && key.trim().length > 0 && (typeof value === 'string' || typeof value === 'number');
  });
}

/**
 * @description 基于 CSS variables 与 DOM 的主题管理器
 * @category Factories
 * @example
 * // 基本用法
 * const themeManager = new ThemeManager({
 *   baseVariables: { '--primary-color': '#007bff' },
 * });
 *
 * // 注册主题
 * themeManager
 *   .register('light', {
 *     '--bg-color': '#ffffff',
 *     '--text-color': '#333333'
 *   })
 *   .register('dark', {
 *     '--bg-color': '#1a1a1a',
 *     '--text-color': '#ffffff'
 *   });
 *
 * // 切换主题
 * themeManager.toggle('dark');
 *
 * // 获取主题信息
 * console.log(themeManager.getCurrentTheme()); // 'dark'
 * console.log(themeManager.getAllThemes());    // 所有已注册的主题
 *
 * // 批量注册
 * themeManager.registerBatch({
 *   blue: { '--primary-color': '#007bff' },
 *   green: { '--primary-color': '#28a745' }
 * });
 *
 * // 事件监听
 * themeManager.on('themeChange', (name, data) => {
 *   console.log('主题已切换:', name);
 * });
 *
 * // 清理资源
 * themeManager.destroy();
 */
export default class ThemeManager {
  private systemTheme: 'light' | 'dark';

  private styleSheet: CSSStyleSheet;
  private styleElement: HTMLStyleElement;
  private container: Element;
  private themeMap = new Map<string, TMThemeConfig>();
  private eventListeners = new Map<ThemeManagerEventType, Set<(...args: unknown[]) => void>>();
  private mediaQuery: MediaQueryList;
  private isDestroyed = false;
  private boundSystemThemeHandler: (event: MediaQueryListEvent) => void;

  constructor(private options: TMConstructor = {}) {
    this.validateEnvironment();
    this.container = this.initializeContainer();
    this.styleElement = this.createStyleElement();
    this.styleSheet = this.styleElement.sheet as CSSStyleSheet;

    // 初始化系统主题检测
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    this.systemTheme = this.mediaQuery.matches ? 'light' : 'dark';

    // 绑定系统主题处理器
    this.boundSystemThemeHandler = this.handleSystemThemeChange.bind(this);

    // 监听系统主题变化
    this.setupSystemThemeListener();

    // 应用初始主题
    this.applyDefaultTheme();
  }

  get currentSystemTheme(): 'light' | 'dark' {
    return this.systemTheme;
  }

  /**
   * @description 验证运行环境
   * @private
   */
  private validateEnvironment(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('ThemeManager requires a browser environment');
    }
  }

  /**
   * @description 初始化容器元素
   * @private
   */
  private initializeContainer(): Element {
    let container: Element | null = null;

    if (this.options.root === undefined) {
      container = document.documentElement || document.querySelector('html');
    } else if (typeof this.options.root === 'string') {
      container = document.querySelector(this.options.root);
      if (!container) {
        throw new Error(`Container element not found: ${this.options.root}`);
      }
    } else if (this.options.root instanceof Element) {
      container = this.options.root;
    }

    if (!container) {
      throw new Error('Invalid container element');
    }

    return container;
  }

  /**
   * @description 创建样式元素
   * @private
   */
  private createStyleElement(): HTMLStyleElement {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-theme-manager', 'true');
    styleElement.textContent = '/* Theme Manager Styles */';

    // 插入到容器的第一个子元素之前
    this.container.insertBefore(styleElement, this.container.firstChild);

    return styleElement;
  }

  /**
   * @description 处理系统主题变更
   * @private
   */
  private handleSystemThemeChange(event: MediaQueryListEvent): void {
    const newSystemTheme = event.matches ? 'light' : 'dark';
    // 使用类型断言来更新只读属性
    this.systemTheme = newSystemTheme;

    this.applyDefaultTheme();
    this.emit('systemThemeChange', newSystemTheme);
  }

  /**
   * @description 设置系统主题监听器
   * @private
   */
  private setupSystemThemeListener(): void {
    this.mediaQuery.addEventListener('change', this.boundSystemThemeHandler);
  }

  /**
   * @description 应用默认主题（跟随系统主题）
   * @private
   */
  private applyDefaultTheme(): void {
    if (this.options.disableFollowSystemTheme) return;

    const currentTheme = this.getCurrentTheme();
    if (!currentTheme || currentTheme === 'default') {
      const systemThemeData = this.getThemeData(this.systemTheme);

      if (systemThemeData) {
        this.unregister('default');
        this.register('default', systemThemeData);
        this.toggle('default');
      }
    }
  }

  /**
   * @description 重建 CSS 规则索引
   * @private
   */
  private rebuildRuleIndexes(): void {
    const themes = Array.from(this.themeMap.entries());

    // 清除所有规则
    while (this.styleSheet.cssRules.length > 0) {
      this.styleSheet.deleteRule(0);
    }

    // 重新添加所有主题规则
    themes.forEach(([themeName, config]) => {
      const mergedData = {
        ...this.options.baseVariables,
        ...config.data,
      };

      const newIndex = this.styleSheet.insertRule(
        `[data-theme="${themeName}"] {${convertToCSSData(mergedData)}}`,
        this.styleSheet.cssRules.length,
      );

      config.index = newIndex;
    });
  }

  /**
   * @description 触发事件
   * @private
   */
  private emit<T extends ThemeManagerEventType>(event: T, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  /**
   * @description 检查管理器是否已销毁
   * @private
   */
  private checkDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error('ThemeManager has been destroyed');
    }
  }

  /**
   * @description 注册主题
   * @param themeName 主题名称
   * @param themeData 主题变量
   * @returns 当前实例（支持链式调用）
   * @example
   * themeManager.register('dark', {
   *   '--bg-color': '#1a1a1a',
   *   '--text-color': '#ffffff'
   * });
   */
  public register(themeName: string, themeData: ThemeVariables): this {
    this.checkDestroyed();

    if (!isValidThemeName(themeName)) {
      throw new Error(`Invalid theme name: ${themeName}`);
    }

    if (!isValidThemeData(themeData)) {
      throw new Error(`Invalid theme data for theme: ${themeName}`);
    }

    // 如果主题已存在，先卸载
    if (this.themeMap.has(themeName)) {
      this.unregister(themeName);
    }

    const mergedData = {
      ...this.options.baseVariables,
      ...themeData,
    };

    try {
      const index = this.styleSheet.insertRule(
        `[data-theme="${themeName}"] {${convertToCSSData(mergedData)}}`,
        this.styleSheet.cssRules.length,
      );

      this.themeMap.set(themeName, {
        index,
        data: themeData, // 保存原始数据，不包含 baseVariables
      });

      this.emit('themeRegister', themeName, themeData);

      // 如果当前应用的是同名主题，重新应用
      if (this.getCurrentTheme() === themeName) {
        this.applyDefaultTheme();
      }
    } catch (error) {
      throw new Error(`Failed to register theme "${themeName}": ${(error as Error).message}`);
    }

    return this;
  }

  /**
   * @description 批量注册主题
   * @param themes 主题对象
   * @returns 当前实例（支持链式调用）
   * @example
   * themeManager.registerBatch({
   *   light: { '--bg-color': '#ffffff' },
   *   dark: { '--bg-color': '#1a1a1a' }
   * });
   */
  public registerBatch(themes: Record<string, ThemeVariables>): this {
    this.checkDestroyed();

    Object.entries(themes).forEach(([name, data]) => {
      this.register(name, data);
    });

    return this;
  }

  /**
   * @description 卸载主题
   * @param themeName 主题名称
   * @returns 当前实例（支持链式调用）
   * @example
   * themeManager.unregister('old-theme');
   */
  public unregister(themeName: string): this {
    this.checkDestroyed();

    const config = this.themeMap.get(themeName);
    if (!config) return this;

    try {
      this.styleSheet.deleteRule(config.index);
      this.themeMap.delete(themeName);

      // 重建索引以保持一致性
      this.rebuildRuleIndexes();

      this.emit('themeUnregister', themeName);

      // 如果卸载的是当前主题，清除主题
      if (this.getCurrentTheme() === themeName) {
        this.toggle();
      }
    } catch (error) {
      console.error(`Failed to unregister theme "${themeName}":`, error);
    }

    return this;
  }

  /**
   * @description 切换主题
   * @param themeName 主题名称，不传或传 null 则清除主题
   * @returns 当前实例（支持链式调用）
   * @example
   * themeManager.toggle('dark');  // 切换到暗色主题
   * themeManager.toggle();        // 清除主题
   */
  public toggle(themeName?: string | null): this {
    this.checkDestroyed();

    if (themeName && themeName !== null) {
      if (!isValidThemeName(themeName)) {
        throw new Error(`Invalid theme name: ${themeName}`);
      }

      if (!this.themeMap.has(themeName)) {
        throw new Error(`Theme "${themeName}" is not registered`);
      }

      this.container.setAttribute('data-theme', themeName);
      const themeConfig = this.themeMap.get(themeName);
      const mergedData = {
        ...this.options.baseVariables,
        ...themeConfig?.data,
      };

      this.emit('themeChange', themeName, mergedData);
    } else {
      this.container.removeAttribute('data-theme');
      this.emit('themeChange', null, null);
    }

    return this;
  }

  /**
   * @description 获取当前应用的主题名称
   * @returns 当前主题名称，无主题时返回 null
   * @example
   * const currentTheme = themeManager.getCurrentTheme(); // 'dark' | null
   */
  public getCurrentTheme(): string | null {
    this.checkDestroyed();
    return this.container.getAttribute('data-theme');
  }

  /**
   * @description 获取主题数据
   * @param themeName 主题名称，不传则返回当前主题的数据
   * @returns 主题数据，不存在时返回 null
   * @example
   * const currentData = themeManager.getThemeData();        // 当前主题数据
   * const darkData = themeManager.getThemeData('dark');     // 指定主题数据
   */
  public getThemeData(themeName?: string): ThemeVariables | null {
    this.checkDestroyed();

    const name = themeName || this.getCurrentTheme();
    if (!name || !this.themeMap.has(name)) return null;

    const themeConfig = this.themeMap.get(name);
    if (!themeConfig) return null;

    // 返回合并后的数据
    return {
      ...this.options.baseVariables,
      ...themeConfig.data,
    };
  }

  /**
   * @description 获取所有已注册的主题信息
   * @returns 主题信息数组
   * @example
   * const themes = themeManager.getAllThemes();
   * themes.forEach(theme => {
   *   console.log(`${theme.name}: ${theme.isActive ? '活跃' : '非活跃'}`);
   * });
   */
  public getAllThemes(): ThemeInfo[] {
    this.checkDestroyed();

    const currentTheme = this.getCurrentTheme();
    return Array.from(this.themeMap.entries()).map(([name, config]) => ({
      name,
      data: {
        ...this.options.baseVariables,
        ...config.data,
      },
      isActive: name === currentTheme,
    }));
  }

  /**
   * @description 检查主题是否已注册
   * @param themeName 主题名称
   * @returns 是否已注册
   * @example
   * if (themeManager.hasTheme('dark')) {
   *   themeManager.toggle('dark');
   * }
   */
  public hasTheme(themeName: string): boolean {
    this.checkDestroyed();
    return this.themeMap.has(themeName);
  }

  /**
   * @description 获取已注册的主题名称列表
   * @returns 主题名称数组
   * @example
   * const themeNames = themeManager.getThemeNames(); // ['light', 'dark', 'blue']
   */
  public getThemeNames(): string[] {
    this.checkDestroyed();
    return Array.from(this.themeMap.keys());
  }

  /**
   * @description 复制主题
   * @param sourceName 源主题名称
   * @param targetName 目标主题名称
   * @param overrides 覆盖的变量
   * @returns 当前实例（支持链式调用）
   * @example
   * // 基于 dark 主题创建 dark-blue 主题
   * themeManager.cloneTheme('dark', 'dark-blue', {
   *   '--primary-color': '#007bff'
   * });
   */
  public cloneTheme(sourceName: string, targetName: string, overrides: ThemeVariables = {}): this {
    this.checkDestroyed();

    const sourceData = this.themeMap.get(sourceName)?.data;
    if (!sourceData) {
      throw new Error(`Source theme "${sourceName}" not found`);
    }

    const clonedData = {
      ...sourceData,
      ...overrides,
    };

    return this.register(targetName, clonedData);
  }

  /**
   * @description 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   * @returns 当前实例（支持链式调用）
   * @example
   * themeManager.on('themeChange', (name, data) => {
   *   console.log('主题变更:', name);
   * });
   */
  public on<T extends ThemeManagerEventType>(event: T, listener: ThemeManagerEvents[T]): this {
    this.checkDestroyed();

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * @description 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   * @returns 当前实例（支持链式调用）
   * @example
   * themeManager.off('themeChange', myListener);
   */
  public off<T extends ThemeManagerEventType>(event: T, listener: ThemeManagerEvents[T]): this {
    this.checkDestroyed();

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener as (...args: unknown[]) => void);
    }

    return this;
  }

  /**
   * @description 清除所有事件监听器
   * @param event 事件类型，不传则清除所有事件的监听器
   * @returns 当前实例（支持链式调用）
   * @example
   * themeManager.clearListeners('themeChange'); // 清除特定事件监听器
   * themeManager.clearListeners();              // 清除所有监听器
   */
  public clearListeners(event?: ThemeManagerEventType): this {
    this.checkDestroyed();

    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }

    return this;
  }

  /**
   * @description 更新基础变量
   * @param baseVariables 新的基础变量
   * @returns 当前实例（支持链式调用）
   * @example
   * themeManager.updateBaseVariables({
   *   '--font-family': 'Arial, sans-serif'
   * });
   */
  public updateBaseVariables(baseVariables: ThemeVariables): this {
    this.checkDestroyed();

    this.options.baseVariables = {
      ...this.options.baseVariables,
      ...baseVariables,
    };

    // 重建所有主题规则
    this.rebuildRuleIndexes();

    return this;
  }

  /**
   * @description 销毁主题管理器，释放所有资源
   * @example
   * themeManager.destroy();
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    try {
      // 移除系统主题监听器
      this.mediaQuery.removeEventListener('change', this.boundSystemThemeHandler);

      // 清除所有主题
      this.themeMap.clear();

      // 移除样式元素
      if (this.styleElement && this.styleElement.parentNode) {
        this.styleElement.parentNode.removeChild(this.styleElement);
      }

      // 移除主题属性
      this.container.removeAttribute('data-theme');

      // 清除事件监听器
      this.eventListeners.clear();

      this.isDestroyed = true;
    } catch (error) {
      console.error('Error during ThemeManager destruction:', error);
    }
  }

  /**
   * @description 获取管理器状态信息
   * @returns 状态信息对象
   * @example
   * const status = themeManager.getStatus();
   * console.log(`注册主题数: ${status.registeredThemes}`);
   */
  public getStatus(): {
    isDestroyed: boolean;
    registeredThemes: number;
    currentTheme: string | null;
    systemTheme: 'light' | 'dark';
    followSystemTheme: boolean;
    eventListeners: number;
  } {
    return {
      isDestroyed: this.isDestroyed,
      registeredThemes: this.themeMap.size,
      currentTheme: this.isDestroyed ? null : this.getCurrentTheme(),
      systemTheme: this.systemTheme,
      followSystemTheme: !this.options.disableFollowSystemTheme,
      eventListeners: Array.from(this.eventListeners.values()).reduce((total, listeners) => total + listeners.size, 0),
    };
  }
}
