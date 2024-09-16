/**
 * 获取命令行参数
 * @param param 参数名
 * @param defaultValue 默认值
 * @param opt 配置项
 * @param opt.valueType 参数的值类型
 * @param opt.validator 参数的值自定义验证函数
 * @category Tools
 */
export default function getCliParam(
  param: string,
  defaultValue = undefined,
  opt: { valueType?: string; validator?: (value?: string) => boolean } = {},
) {
  const option = {
    valueType: 'string',
    ...opt,
  };
  const valueIndex = process.argv.indexOf(param);

  if (option.valueType === 'boolean') {
    return valueIndex !== -1;
  }
  if (valueIndex === -1) {
    return defaultValue;
  }

  const value = process.argv[valueIndex + 1];

  if (option.validator) {
    const valid = option.validator(value);
    if (valid !== true) {
      throw new Error(valid || `参数${param}的值验证失败`);
    }
  }
  return value || defaultValue;
}
