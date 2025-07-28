import compareVersion from './compare-version';

describe('Test compareVersion', () => {
  // 基础功能测试
  it('should return -1 when current version is smaller', () => {
    expect(compareVersion('v1.0.0', '2.0.0')).toEqual(-1);
  });

  it('should return 1 when current version is larger', () => {
    expect(compareVersion('a2.0.0', 'B1.0.0', /a|b/gi)).toEqual(1);
  });

  it('should return 0 when versions are equal', () => {
    expect(compareVersion('v1.0.0', 'V1.0.0')).toEqual(0);
  });

  it('should return 1 when current version has more segments', () => {
    expect(compareVersion('V1.10.0.12', 'v1.10.0')).toEqual(1);
  });

  it('should return -1 when compared version has more segments', () => {
    expect(compareVersion('v1.10.0', 'V1.10.0.12')).toEqual(-1);
  });

  // 边界情况测试
  it('should handle single digit versions', () => {
    expect(compareVersion('1', '2')).toEqual(-1);
    expect(compareVersion('2', '1')).toEqual(1);
    expect(compareVersion('1', '1')).toEqual(0);
  });

  it('should handle versions with many segments', () => {
    expect(compareVersion('1.2.3.4.5', '1.2.3.4.6')).toEqual(-1);
    expect(compareVersion('1.2.3.4.6', '1.2.3.4.5')).toEqual(1);
  });

  // 专门测试四位版本号
  it('should handle four-digit version numbers correctly', () => {
    // 基本四位版本号比较
    expect(compareVersion('1.2.3.4', '1.2.3.5')).toEqual(-1);
    expect(compareVersion('1.2.3.5', '1.2.3.4')).toEqual(1);
    expect(compareVersion('1.2.3.4', '1.2.3.4')).toEqual(0);

    // 不同位数的比较
    expect(compareVersion('1.2.3.10', '1.2.3.9')).toEqual(1);
    expect(compareVersion('2.0.0.0', '1.9.9.9')).toEqual(1);
    expect(compareVersion('1.0.0.1', '1.0.0')).toEqual(1);
    expect(compareVersion('1.0.0', '1.0.0.1')).toEqual(-1);

    // 带前缀的四位版本号
    expect(compareVersion('v1.2.3.4', 'v1.2.3.5')).toEqual(-1);
    expect(compareVersion('release-2.1.0.0', 'release-2.0.9.9', /release-/gi)).toEqual(1);
  });

  it('should handle versions with leading zeros', () => {
    expect(compareVersion('01.02.03', '1.2.3')).toEqual(0);
    expect(compareVersion('01.02.04', '1.2.3')).toEqual(1);
  });

  it('should handle custom trim patterns', () => {
    expect(compareVersion('alpha1.0.0', 'beta2.0.0', /alpha|beta/gi)).toEqual(-1);
    expect(compareVersion('prefix-2.0.0', 'prefix-1.0.0', /prefix-/gi)).toEqual(1);
  });

  // 错误处理测试
  it('should throw error for non-string versions', () => {
    expect(() => compareVersion(null as unknown as string, '1.0.0')).toThrow('版本号必须为字符串类型');
    expect(() => compareVersion('1.0.0', undefined as unknown as string)).toThrow('版本号必须为字符串类型');
    expect(() => compareVersion(123 as unknown as string, '1.0.0')).toThrow('版本号必须为字符串类型');
  });

  it('should throw error for empty versions', () => {
    expect(() => compareVersion('', '1.0.0')).toThrow('版本号不能为空');
    expect(() => compareVersion('1.0.0', '')).toThrow('版本号不能为空');
    expect(() => compareVersion('   ', '1.0.0')).toThrow('版本号不能为空');
  });

  it('should throw error for invalid version formats', () => {
    expect(() => compareVersion('1.0.0-alpha', '1.0.0')).toThrow('无效的版本号格式');
    expect(() => compareVersion('1.0.0', '1.0.0-beta')).toThrow('无效的版本号格式');
    expect(() => compareVersion('1.0.a', '1.0.0')).toThrow('无效的版本号格式');
    expect(() => compareVersion('1..0', '1.0.0')).toThrow('无效的版本号格式');
    expect(() => compareVersion('1.0.', '1.0.0')).toThrow('无效的版本号格式');
    expect(() => compareVersion('.1.0', '1.0.0')).toThrow('无效的版本号格式');
  });

  // 白板测试
  it('should handle whitespace correctly', () => {
    expect(compareVersion(' v1.0.0 ', ' V1.0.0 ')).toEqual(0);
    expect(compareVersion('\tv1.0.0\t', '\nV1.0.1\n')).toEqual(-1);
  });
});
