import numberToExcelColumn from './number-to-excel-column';

describe('Test numberToExcelColumn', () => {
  // 基础功能测试
  it('should convert single digit numbers correctly', () => {
    expect(numberToExcelColumn(1)).toBe('A');
    expect(numberToExcelColumn(26)).toBe('Z');
  });

  it('should convert double letter columns correctly', () => {
    expect(numberToExcelColumn(27)).toBe('AA');
    expect(numberToExcelColumn(28)).toBe('AB');
    expect(numberToExcelColumn(52)).toBe('AZ');
    expect(numberToExcelColumn(53)).toBe('BA');
    expect(numberToExcelColumn(702)).toBe('ZZ');
  });

  it('should convert triple letter columns correctly', () => {
    expect(numberToExcelColumn(703)).toBe('AAA');
    expect(numberToExcelColumn(704)).toBe('AAB');
    expect(numberToExcelColumn(18278)).toBe('ZZZ');
  });

  it('should handle large numbers correctly', () => {
    expect(numberToExcelColumn(18279)).toBe('AAAA');
    expect(numberToExcelColumn(475254)).toBe('ZZZZ');
  });

  // 边界情况测试
  it('should handle the first column', () => {
    expect(numberToExcelColumn(1)).toBe('A');
  });

  it('should handle the 26th column', () => {
    expect(numberToExcelColumn(26)).toBe('Z');
  });

  it('should handle the 27th column', () => {
    expect(numberToExcelColumn(27)).toBe('AA');
  });

  // 错误情况测试
  it('should throw error for non-number input', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    expect(() => numberToExcelColumn('1' as any)).toThrow('列数值必须为数字类型');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    expect(() => numberToExcelColumn(null as any)).toThrow('列数值必须为数字类型');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    expect(() => numberToExcelColumn(undefined as any)).toThrow('列数值必须为数字类型');
  });

  it('should throw error for non-integer input', () => {
    expect(() => numberToExcelColumn(1.5)).toThrow('列数值必须为整数');
    expect(() => numberToExcelColumn(2.1)).toThrow('列数值必须为整数');
  });

  it('should throw error for zero or negative input', () => {
    expect(() => numberToExcelColumn(0)).toThrow('列数值必须大于0（Excel列从1开始）');
    expect(() => numberToExcelColumn(-1)).toThrow('列数值必须大于0（Excel列从1开始）');
    expect(() => numberToExcelColumn(-10)).toThrow('列数值必须大于0（Excel列从1开始）');
  });

  it('should throw error for infinite numbers', () => {
    expect(() => numberToExcelColumn(Infinity)).toThrow('列数值必须为整数');
    expect(() => numberToExcelColumn(-Infinity)).toThrow('列数值必须为整数');
    expect(() => numberToExcelColumn(NaN)).toThrow('列数值必须为整数');
  });

  // 性能测试 - 确保大数值也能正常处理
  it('should handle reasonably large numbers efficiently', () => {
    const start = Date.now();
    const result = numberToExcelColumn(100000);
    const end = Date.now();

    expect(result).toBe('EQXD');
    expect(end - start).toBeLessThan(10); // 应该在10ms内完成
  });
});
