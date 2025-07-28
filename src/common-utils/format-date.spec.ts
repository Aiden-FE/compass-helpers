import formatDate, { type DateInput } from './format-date';

describe('formatDate', () => {
  // 基础功能测试
  describe('基础功能测试', () => {
    it('应该返回默认格式的当前时间', () => {
      const result = formatDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('应该格式化字符串日期', () => {
      const result = formatDate('2023-05-15 10:30:45');
      expect(result).toBe('2023-05-15 10:30:45');
    });

    it('应该格式化时间戳', () => {
      const timestamp = new Date('2023-05-15 10:30:45').getTime();
      const result = formatDate(timestamp);
      expect(result).toBe('2023-05-15 10:30:45');
    });

    it('应该格式化Date对象', () => {
      const date = new Date('2023-05-15 10:30:45');
      const result = formatDate(date);
      expect(result).toBe('2023-05-15 10:30:45');
    });
  });

  // 格式化占位符测试
  describe('格式化占位符测试', () => {
    const testDate = new Date('2023-05-15 14:30:45.123');

    it('应该正确格式化年份(YYYY)', () => {
      expect(formatDate(testDate, 'YYYY')).toBe('2023');
    });

    it('应该正确格式化月份(MM)', () => {
      expect(formatDate(testDate, 'MM')).toBe('05');
    });

    it('应该正确格式化日期(DD)', () => {
      expect(formatDate(testDate, 'DD')).toBe('15');
    });

    it('应该正确格式化24小时制小时(hh)', () => {
      expect(formatDate(testDate, 'hh')).toBe('14');
    });

    it('应该正确格式化12小时制小时(HH)', () => {
      expect(formatDate(testDate, 'HH')).toBe('02');
    });

    it('应该正确格式化分钟(mm)', () => {
      expect(formatDate(testDate, 'mm')).toBe('30');
    });

    it('应该正确格式化秒(ss)', () => {
      expect(formatDate(testDate, 'ss')).toBe('45');
    });

    it('应该正确格式化毫秒(SSS)', () => {
      expect(formatDate(testDate, 'SSS')).toBe('123');
    });

    it('应该正确格式化季度(Q)', () => {
      expect(formatDate(testDate, 'Q')).toBe('2');
    });

    it('应该正确格式化星期数字(d)', () => {
      expect(formatDate(testDate, 'd')).toBe('1'); // 周一
    });

    it('应该正确格式化星期名称(W)', () => {
      expect(formatDate(testDate, 'W')).toBe('一');
    });
  });

  // 12小时制特殊情况测试
  describe('12小时制特殊情况测试', () => {
    it('应该正确处理午夜(00:00)', () => {
      const midnightDate = new Date('2023-05-15 00:30:00');
      expect(formatDate(midnightDate, 'HH:mm')).toBe('12:30');
    });

    it('应该正确处理中午(12:00)', () => {
      const noonDate = new Date('2023-05-15 12:30:00');
      expect(formatDate(noonDate, 'HH:mm')).toBe('12:30');
    });

    it('应该正确处理下午时间', () => {
      const afternoonDate = new Date('2023-05-15 15:30:00');
      expect(formatDate(afternoonDate, 'HH:mm')).toBe('03:30');
    });
  });

  // 季度测试
  describe('季度测试', () => {
    it('应该正确识别第1季度', () => {
      expect(formatDate(new Date('2023-01-15'), 'Q')).toBe('1');
      expect(formatDate(new Date('2023-02-15'), 'Q')).toBe('1');
      expect(formatDate(new Date('2023-03-15'), 'Q')).toBe('1');
    });

    it('应该正确识别第2季度', () => {
      expect(formatDate(new Date('2023-04-15'), 'Q')).toBe('2');
      expect(formatDate(new Date('2023-05-15'), 'Q')).toBe('2');
      expect(formatDate(new Date('2023-06-15'), 'Q')).toBe('2');
    });

    it('应该正确识别第3季度', () => {
      expect(formatDate(new Date('2023-07-15'), 'Q')).toBe('3');
      expect(formatDate(new Date('2023-08-15'), 'Q')).toBe('3');
      expect(formatDate(new Date('2023-09-15'), 'Q')).toBe('3');
    });

    it('应该正确识别第4季度', () => {
      expect(formatDate(new Date('2023-10-15'), 'Q')).toBe('4');
      expect(formatDate(new Date('2023-11-15'), 'Q')).toBe('4');
      expect(formatDate(new Date('2023-12-15'), 'Q')).toBe('4');
    });
  });

  // 本地化测试
  describe('本地化测试', () => {
    const testDate = new Date('2023-05-15'); // 周一

    it('应该使用中文星期名称(默认)', () => {
      expect(formatDate(testDate, 'W')).toBe('一');
    });

    it('应该使用中文星期名称(显式指定)', () => {
      expect(formatDate(testDate, 'W', { locale: 'zh-CN' })).toBe('一');
    });

    it('应该使用英文星期名称', () => {
      expect(formatDate(testDate, 'W', { locale: 'en-US' })).toBe('Mon');
    });

    it('应该对未知locale降级到中文', () => {
      expect(formatDate(testDate, 'W', { locale: 'fr-FR' })).toBe('一');
    });
  });

  // 配置选项测试
  describe('配置选项测试', () => {
    const testDate = new Date('2023-05-05 09:05:05.005');

    it('应该支持关闭填充', () => {
      const result = formatDate(testDate, 'YYYY-MM-DD hh:mm:ss.SSS', { isPadStart: false });
      expect(result).toBe('2023-5-5 9:5:5.5');
    });

    it('应该支持自定义填充字符', () => {
      const result = formatDate(testDate, 'MM-DD', { padSymbol: '#' });
      expect(result).toBe('#5-#5');
    });

    it('应该支持组合配置', () => {
      const result = formatDate(testDate, 'MM-DD', { isPadStart: false, padSymbol: '#' });
      expect(result).toBe('5-5');
    });
  });

  // 复杂格式测试
  describe('复杂格式测试', () => {
    const testDate = new Date('2023-05-15 14:30:45.123');

    it('应该支持完整的日期时间格式', () => {
      const result = formatDate(testDate, 'YYYY年MM月DD日 hh:mm:ss.SSS');
      expect(result).toBe('2023年05月15日 14:30:45.123');
    });

    it('应该支持带季度的格式', () => {
      const result = formatDate(testDate, 'YYYY年第Q季度');
      expect(result).toBe('2023年第2季度');
    });

    it('应该支持带星期的格式', () => {
      const result = formatDate(testDate, 'YYYY-MM-DD (星期W)');
      expect(result).toBe('2023-05-15 (星期一)');
    });

    it('应该支持混合12/24小时制', () => {
      const result = formatDate(testDate, '24h: hh:mm, 12h: HH:mm');
      expect(result).toBe('24h: 14:30, 12h: 02:30');
    });
  });

  // 边界情况测试
  describe('边界情况测试', () => {
    it('应该处理闰年', () => {
      const leapYearDate = new Date('2024-02-29');
      expect(formatDate(leapYearDate, 'YYYY-MM-DD')).toBe('2024-02-29');
    });

    it('应该处理年末年初', () => {
      const yearEnd = new Date('2023-12-31 23:59:59');
      expect(formatDate(yearEnd, 'YYYY-MM-DD hh:mm:ss')).toBe('2023-12-31 23:59:59');
    });

    it('应该处理最小毫秒值', () => {
      const date = new Date('2023-05-15 10:30:45.001');
      expect(formatDate(date, 'SSS')).toBe('001');
    });
  });

  // 错误处理测试
  describe('错误处理测试', () => {
    it('应该拒绝null输入', () => {
      expect(() => formatDate(null as unknown as DateInput)).toThrow('日期参数不能为空');
    });

    it('应该拒绝undefined输入', () => {
      expect(() => formatDate(undefined as unknown as DateInput)).toThrow('日期参数不能为空');
    });

    it('应该拒绝空字符串', () => {
      expect(() => formatDate('')).toThrow('日期字符串不能为空');
    });

    it('应该拒绝只有空格的字符串', () => {
      expect(() => formatDate('   ')).toThrow('日期字符串不能为空');
    });

    it('应该拒绝无效的时间戳', () => {
      expect(() => formatDate(NaN)).toThrow('时间戳必须为有效数字');
      expect(() => formatDate(Infinity)).toThrow('时间戳必须为有效数字');
    });

    it('应该拒绝无效的日期字符串', () => {
      expect(() => formatDate('invalid-date')).toThrow('时间格式化失败: 无效的日期格式: invalid-date');
    });

    it('应该拒绝无效的Date对象', () => {
      const invalidDate = new Date('invalid');
      expect(() => formatDate(invalidDate)).toThrow('时间格式化失败');
    });
  });

  // 性能和兼容性测试
  describe('性能和兼容性测试', () => {
    it('应该正确处理格式冲突(避免YYYY被替换为YY+YY)', () => {
      const testDate = new Date('2023-05-15');
      const result = formatDate(testDate, 'YYYY-MM');
      expect(result).toBe('2023-05');
      expect(result).not.toContain('YY');
    });

    it('应该支持重复的格式占位符', () => {
      const testDate = new Date('2023-05-15');
      const result = formatDate(testDate, 'YYYY年YYYY');
      expect(result).toBe('2023年2023');
    });

    it('应该保留非格式字符', () => {
      const testDate = new Date('2023-05-15 14:30:45');
      const result = formatDate(testDate, 'Today is YYYY-MM-DD at hh:mm:ss!');
      expect(result).toBe('Today is 2023-05-15 at 14:30:45!');
    });
  });
});
