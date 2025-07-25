import compareVersion from './compare-version';

describe('Test compareVersion', () => {
  it('should -1', () => {
    expect(compareVersion('v1.0.0', '2.0.0')).toEqual(-1);
  });
  it('should 1', () => {
    expect(compareVersion('a2.0.0', 'B1.0.0', /a|b/gi)).toEqual(1);
  });
  it('should 0', () => {
    expect(compareVersion('v1.0.0', 'V1.0.0')).toEqual(0);
  });
  it('Different lengths should 1', () => {
    expect(compareVersion('V1.10.0.12', 'v1.10.0')).toEqual(1);
  });
  it('Different lengths should -1', () => {
    expect(compareVersion('v1.10.0', 'V1.10.0.12')).toEqual(-1);
  });
});
