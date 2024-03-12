import { TMConstructor, TMThemeConfig, ThemeVariables } from './theme-manager.type';

function convertToCSSData(data: Record<string, string | number>): string {
  return Object.keys(data)
    .map((key) => `${key}: ${data[key]}`)
    .join(';');
}

/**
 * @description 基于 CSS variables 与 DOM 的主题管理器
 * @example
 * const theme = new ThemeManager({
 *   baseVariables: { '--scope-font-color': '#212121' }, // 声明基础的公共变量,被所有注册主题继承
 *   hooks: {
 *     // 使用hook动态设置主题
 *     afterSystemThemeChange: (systemTheme) => {
 *       const currentTheme = theme.getCurrentTheme();
 *       if (!currentTheme || currentTheme === 'default') {
 *         theme.unregister('default')
 *         theme.register('default', ThemeConfig[theme])
 *         theme.toggle('default')
 *       }
 *     }
 *   }, // 各类hooks监听
 * });
 * console.log(theme.systemTheme); // 当前的系统主题
 * // 主题注册
 * theme.register('light', {
 *   '--scope-page-background-color': '#FFFFFF',
 * }).register('dark', {
 *   '--scope-page-background-color': 'black',
 *   '--scope-font-color': '#FFFFFF',
 * });
 * theme.toggle('light'); // 切换light主题
 * theme.toggle(); // 切换为空,不应用任何主题
 * theme.getCurrentTheme(); // 获取当前使用的主题标识, 例如: 'light'
 * theme.getThemeData(); // 返回当前使用主题的数据
 * theme.getThemeData('dark'); // 获取指定主题变量,不提供参数,则默认返回当前使用主题的数据
 * theme.unregister('purple'); // 移除已注册的主题
 * theme.destroy(); // 移除主题管理器,释放内部引用资源
 */
export default class ThemeManager {
  public systemTheme: 'light' | 'dark';

  private styleSheet: CSSStyleSheet;

  private styleElement: HTMLStyleElement;

  private container: Element; // css变量挂载的根节点

  private themeMap = new Map<string, TMThemeConfig>(); // 已注册的主题表

  constructor(private opt: TMConstructor) {
    let container: Element | null;
    if (opt.root === undefined) {
      container = document.querySelector('html');
    } else if (typeof opt.root === 'string') {
      container = document.querySelector(opt.root);
    } else {
      container = opt.root;
    }
    if (!container) {
      throw new Error('Not found container element!');
    }
    this.container = container;
    const styleElement = this.container.insertBefore(document.createElement('style'), this.container.firstChild);
    this.styleElement = styleElement;
    this.container.insertBefore(styleElement, this.container.firstChild);
    this.styleSheet = styleElement.sheet as CSSStyleSheet;
    const themeMedia = window.matchMedia('(prefers-color-scheme: light)');
    this.systemTheme = themeMedia.matches ? 'light' : 'dark';
    themeMedia.addEventListener('change', (e) => {
      this.systemTheme = e.matches ? 'light' : 'dark';
      this.applyDefaultTheme();
      if (opt.hooks?.afterSystemThemeChange) {
        opt.hooks.afterSystemThemeChange(this.systemTheme);
      }
    });
  }

  private applyDefaultTheme() {
    if (this.opt.disableFollowSystemTheme) return;
    const currentTheme = this.getCurrentTheme();
    if (this.systemTheme && (!currentTheme || currentTheme === 'default')) {
      const data = this.getThemeData(this.systemTheme);

      if (data) {
        this.unregister('default');
        this.register('default', data);
        this.toggle('default');
      }
    }
  }

  public register(themeName: string, themeData: ThemeVariables) {
    if (this.themeMap.has(themeName)) {
      this.unregister(themeName);
    }
    const data = {
      ...this.opt.baseVariables,
      ...themeData,
    };
    const index = this.styleSheet.insertRule(
      `[data-theme="${themeName}"] {${convertToCSSData(data)}}`,
      this.styleSheet.cssRules.length,
    );
    this.themeMap.set(themeName, {
      index,
      data,
    });
    // 确保当前应用的是最新的主题数据
    if (this.systemTheme === themeName) {
      this.applyDefaultTheme();
    }
    return this;
  }

  public unregister(themeName: string) {
    const config = this.themeMap.get(themeName);
    if (!config) return this;
    this.styleSheet.deleteRule(config.index);
    this.themeMap.delete(themeName);
    return this;
  }

  public toggle(themeName?: string) {
    if (themeName) {
      if (!this.themeMap.has(themeName)) {
        throw new Error('This theme is unregister.');
      }
      this.container.setAttribute('data-theme', themeName);
      const themeConfig = this.themeMap.get(themeName);
      try {
        // eslint-disable-next-line no-unused-expressions
        this.opt.hooks?.afterToggle?.(themeName, themeConfig?.data || null);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    } else {
      this.container.removeAttribute('data-theme');
      try {
        // eslint-disable-next-line no-unused-expressions
        this.opt.hooks?.afterToggle?.(themeName, null);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }

    return this;
  }

  public getCurrentTheme() {
    return this.container.getAttribute('data-theme');
  }

  public getThemeData(themeName?: string) {
    const name = themeName || this.getCurrentTheme();
    if (!name || !this.themeMap.has(name)) return null;
    const themeMap = this.themeMap.get(name);
    return themeMap ? themeMap.data : null;
  }

  public destroy() {
    this.themeMap.clear();
    this.styleElement.remove();
    this.container.removeAttribute('data-theme');
  }
}
