/**
 * @description 替换字符串中包裹起来的变量
 * @param templateString 字符串模板
 * @param params 参数对象
 */
export default function replaceVariablesInString(templateString: string, params: Record<string, string>) {
  return Object.keys(params).reduce((lastString, currentKey) => {
    const currentValue = params[currentKey];
    // eslint-disable-next-line no-useless-escape
    const reg = new RegExp(`{{[\s\x20]*(${currentKey})[\s\x20]*}}`, 'g');
    // eslint-disable-next-line no-param-reassign
    lastString = lastString.replace(reg, currentValue);
    return lastString;
  }, templateString);
}
