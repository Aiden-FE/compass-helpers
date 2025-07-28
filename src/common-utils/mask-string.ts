/**
 * 手机号码掩码处理选项配置
 */
export interface PhoneMaskOptions {
  /** 掩码字符的长度，默认为4 */
  maskLength?: number;
  /** 掩码开始位置的偏移量，默认为3 */
  startOffset?: number;
  /** 是否为国际号码，默认为false */
  isInternational?: boolean;
  /** 国际区号后的分隔符，默认为空格 */
  internationalSeparator?: string;
  /** 掩码替换字符，默认为'*' */
  maskChar?: string;
}

/**
 * 通用字符串掩码处理选项配置
 */
export interface StringMaskOptions {
  /** 掩码字符的长度，默认为4 */
  maskLength?: number;
  /** 掩码开始位置的偏移量，默认为3 */
  startOffset?: number;
  /** 掩码替换字符，默认为'*' */
  maskChar?: string;
  /** 是否保留字符串两端的指定长度，如果设置此选项，会覆盖startOffset和maskLength */
  preserveEdges?: {
    /** 保留开头的字符数 */
    start: number;
    /** 保留结尾的字符数 */
    end: number;
  };
}

/**
 * 手机号码解析结果
 */
interface ParsedPhone {
  countryCode: string;
  phoneNumber: string;
  separator: string;
}

/**
 * @description 对手机号码进行脱敏处理，将指定位置的数字替换为掩码字符
 * @param phone 待处理的手机号码字符串
 * @param options 配置选项
 * @returns 脱敏后的手机号码字符串
 * @throws {Error} 当输入参数无效时抛出错误
 * @category Tools
 *
 * @example
 * ```typescript
 * // 基础用法
 * maskPhoneNumber('13812345678') // => '138****5678'
 *
 * // 自定义掩码长度和位置
 * maskPhoneNumber('13812345678', { maskLength: 3, startOffset: 4 }) // => '1381***5678'
 *
 * // 国际号码处理
 * maskPhoneNumber('+86 13812345678', { isInternational: true }) // => '+86 138****5678'
 *
 * // 自定义掩码字符
 * maskPhoneNumber('13812345678', { maskChar: '#' }) // => '138####5678'
 * ```
 */
export function maskPhoneNumber(phone: string, options: PhoneMaskOptions = {}): string {
  // 输入验证
  validateInput(phone);

  // 设置默认选项
  const opts: Required<PhoneMaskOptions> = {
    maskLength: 4,
    startOffset: 3,
    isInternational: false,
    internationalSeparator: ' ',
    maskChar: '*',
    ...options,
  };

  try {
    // 解析手机号码
    const parsed = parsePhoneNumber(phone, opts);

    // 应用掩码
    const maskedNumber = applyMask(parsed.phoneNumber, opts);

    // 如果是国际号码，重新组合
    return opts.isInternational ? `${parsed.countryCode}${parsed.separator}${maskedNumber}` : maskedNumber;
  } catch (error) {
    throw new Error(`手机号码掩码处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 验证输入参数
 */
function validateInput(phone: string): void {
  if (typeof phone !== 'string') {
    throw new Error('手机号码必须是字符串类型');
  }

  if (!phone || phone.trim().length === 0) {
    throw new Error('手机号码不能为空');
  }

  // 基本格式验证：应该包含数字
  if (!/\d/.test(phone)) {
    throw new Error('手机号码必须包含至少一个数字');
  }
}

/**
 * 解析手机号码，分离国际区号和本地号码
 */
function parsePhoneNumber(phone: string, opts: Required<PhoneMaskOptions>): ParsedPhone {
  if (!opts.isInternational) {
    return {
      countryCode: '',
      phoneNumber: phone.trim(),
      separator: '',
    };
  }

  const parts = phone.split(opts.internationalSeparator);

  if (parts.length < 2) {
    throw new Error(`国际号码格式错误，缺少分隔符 "${opts.internationalSeparator}"`);
  }

  const [countryCode, ...numberParts] = parts;
  const phoneNumber = numberParts.join(opts.internationalSeparator);

  if (!phoneNumber || phoneNumber.trim().length === 0) {
    throw new Error('国际号码中缺少有效的手机号码部分');
  }

  return {
    countryCode: countryCode.trim(),
    phoneNumber: phoneNumber.trim(),
    separator: opts.internationalSeparator,
  };
}

/**
 * 应用掩码到手机号码
 */
function applyMask(phoneNumber: string, opts: Required<PhoneMaskOptions>): string {
  const cleanNumber = phoneNumber.replace(/\s/g, ''); // 移除空格
  const numberLength = cleanNumber.length;

  // 边界检查和自动调整
  const safeStartOffset = Math.max(0, Math.min(opts.startOffset, numberLength - 1));
  const maxMaskLength = numberLength - safeStartOffset;
  const safeMaskLength = Math.max(0, Math.min(opts.maskLength, maxMaskLength));

  // 如果掩码长度为0或起始位置超出范围，返回原号码
  if (safeMaskLength === 0 || safeStartOffset >= numberLength) {
    return phoneNumber;
  }

  // 构建掩码
  const beforeMask = cleanNumber.slice(0, safeStartOffset);
  const maskPart = opts.maskChar.repeat(safeMaskLength);
  const afterMask = cleanNumber.slice(safeStartOffset + safeMaskLength);

  return beforeMask + maskPart + afterMask;
}

/**
 * @description 对任意敏感字符串进行掩码处理，将指定位置的字符替换为掩码字符
 * @param input 待处理的字符串
 * @param options 配置选项
 * @returns 掩码处理后的字符串
 * @throws {Error} 当输入参数无效时抛出错误
 * @category Tools
 *
 * @example
 * ```typescript
 * // 基础用法
 * maskString('12345678901234567890') // => '123****7890'
 *
 * // 自定义掩码长度和位置
 * maskString('sensitive-data-here', { maskLength: 6, startOffset: 4 }) // => 'sens******here'
 *
 * // 使用preserveEdges保留两端字符
 * maskString('john.doe@example.com', {
 *   preserveEdges: { start: 2, end: 10 }
 * }) // => 'jo*******ample.com'
 *
 * // 自定义掩码字符
 * maskString('credit-card-number', { maskChar: '#' }) // => 'cre############ber'
 *
 * // 处理身份证号
 * maskString('110101199001011234', {
 *   preserveEdges: { start: 6, end: 4 }
 * }) // => '110101********1234'
 * ```
 */
export function maskString(input: string, options: StringMaskOptions = {}): string {
  // 输入验证
  validateStringInput(input);

  // 设置默认选项
  const opts: Required<Omit<StringMaskOptions, 'preserveEdges'>> & Pick<StringMaskOptions, 'preserveEdges'> = {
    maskLength: 4,
    startOffset: 3,
    maskChar: '*',
    preserveEdges: options.preserveEdges,
    ...options,
  };

  try {
    return applyStringMask(input, opts);
  } catch (error) {
    throw new Error(`字符串掩码处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 验证字符串输入参数
 */
function validateStringInput(input: string): void {
  if (typeof input !== 'string') {
    throw new Error('输入必须是字符串类型');
  }

  if (input.length === 0) {
    throw new Error('输入字符串不能为空');
  }
}

/**
 * 应用掩码到字符串
 */
function applyStringMask(
  input: string,
  opts: Required<Omit<StringMaskOptions, 'preserveEdges'>> & Pick<StringMaskOptions, 'preserveEdges'>,
): string {
  const inputLength = input.length;

  // 如果使用preserveEdges模式
  if (opts.preserveEdges) {
    const { start, end } = opts.preserveEdges;

    // 验证preserveEdges参数
    if (start < 0 || end < 0) {
      throw new Error('preserveEdges的start和end值不能为负数');
    }

    if (start + end >= inputLength) {
      // 如果保留的字符数大于等于总长度，返回原字符串
      return input;
    }

    // 计算中间需要掩码的部分
    const beforeMask = input.slice(0, start);
    const maskLength = inputLength - start - end;
    const maskPart = opts.maskChar.repeat(maskLength);
    const afterMask = input.slice(-end);

    return beforeMask + maskPart + afterMask;
  }

  // 使用标准的startOffset和maskLength模式
  const safeStartOffset = Math.max(0, Math.min(opts.startOffset, inputLength - 1));
  const maxMaskLength = inputLength - safeStartOffset;
  const safeMaskLength = Math.max(0, Math.min(opts.maskLength, maxMaskLength));

  // 如果掩码长度为0或起始位置超出范围，返回原字符串
  if (safeMaskLength === 0 || safeStartOffset >= inputLength) {
    return input;
  }

  // 构建掩码
  const beforeMask = input.slice(0, safeStartOffset);
  const maskPart = opts.maskChar.repeat(safeMaskLength);
  const afterMask = input.slice(safeStartOffset + safeMaskLength);

  return beforeMask + maskPart + afterMask;
}
