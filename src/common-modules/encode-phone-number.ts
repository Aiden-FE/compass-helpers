/**
 * @description 加密手机号码,脱敏处理
 * @param phone 手机号码或国际号码
 * @param options 配置对象
 */
export default function encodePhoneNumber(
  phone: string,
  options?: {
    /** 加密字符的长度 */
    encodeLength?: number;
    /** 向右偏移长度,影响加密块离左边的距离 */
    offsetLength?: number;
    /** 是否为国际号码,默认false */
    isCountry?: boolean;
    /** 国际区号后的分割符, 如 +86 176的分割符为' ' */
    countryAfterSymbol?: string;
    /**
     * @description 掩码的替换字符
     * @default *
     */
    maskChar?: string;
  },
) {
  const opts = {
    isCountry: false,
    countryAfterSymbol: ' ',
    encodeLength: 4,
    offsetLength: 3,
    maskChar: '*',
    ...options,
  };
  const phoneNum = opts.isCountry ? phone.split(opts.countryAfterSymbol)[1] : phone;
  const maskNum =
    phoneNum.slice(0, opts.offsetLength) +
    phoneNum.slice(opts.offsetLength, opts.offsetLength + opts.encodeLength).replace(/[0-9]/g, opts.maskChar) +
    phoneNum.slice(opts.offsetLength + opts.encodeLength, phoneNum.length);
  return opts.isCountry ? `${phone.split(opts.countryAfterSymbol)[0]}${opts.countryAfterSymbol}${maskNum}` : maskNum;
}
