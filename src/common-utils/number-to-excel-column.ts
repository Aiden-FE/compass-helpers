/**
 * 将数值转为Excel列名
 * @param columnNumber 列的数值（从1开始）
 * @returns Excel列名字符串
 * @category Number
 * @throws {Error} 当输入不是正整数时抛出错误
 * @example
 * ```ts
 * console.log(numberToExcelColumn(1));   // 输出: "A"
 * console.log(numberToExcelColumn(26));  // 输出: "Z"
 * console.log(numberToExcelColumn(27));  // 输出: "AA"
 * console.log(numberToExcelColumn(28));  // 输出: "AB"
 * console.log(numberToExcelColumn(702)); // 输出: "ZZ"
 * console.log(numberToExcelColumn(703)); // 输出: "AAA"
 * ```
 */
export default function numberToExcelColumn(columnNumber: number): string {
  // 输入验证
  if (typeof columnNumber !== 'number') {
    throw new Error('列数值必须为数字类型');
  }

  if (!Number.isInteger(columnNumber)) {
    throw new Error('列数值必须为整数');
  }

  if (columnNumber < 1) {
    throw new Error('列数值必须大于0（Excel列从1开始）');
  }

  let num = columnNumber;
  let result = '';

  // 使用26进制转换算法
  // 注意：Excel列名是一种特殊的26进制，没有0，从A(1)到Z(26)
  while (num > 0) {
    // 将数字调整为0-25的范围，因为我们的字符是A-Z（0-25的索引）
    num = num - 1;

    // 获取当前位的余数（0-25）
    const remainder = num % 26;

    // 更新数字为下一位
    num = Math.floor(num / 26);

    // 将余数转换为对应的字符（A=65的ASCII码）
    const char = String.fromCharCode(65 + remainder);

    // 在结果前面添加字符（因为我们是从右到左构建的）
    result = char + result;
  }

  return result;
}
