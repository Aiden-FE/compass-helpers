/** 主题配置数据 */
export type ThemeVariables = Record<string, string | number>;

export type TMToggleCallback = (themeName: string | undefined, themeData: ThemeVariables | null) => void;

export interface TMConstructor {
  /**
   * @description 主题变量挂载的根节点
   * @default 'html'
   * @example
   *   '#id', '.class', document.querySelector('.anyElement')
   */
  root?: string | Element | null;
  /** 会被各主题继承的公共主题变量 */
  baseVariables?: ThemeVariables;
  /**
   * @description 是否禁用 在未设置主题或主题为 default 情况下自动跟随系统主题
   * @todo 自动跟随系统主题时,会自动应用名为 light 或 dark 对应的主题数据,不存在则不应用主题
   */
  disableFollowSystemTheme?: boolean;
}

export type TMThemeConfig = {
  index: number;
  data: ThemeVariables;
};
