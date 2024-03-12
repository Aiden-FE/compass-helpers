/**
 * @description 时间格式化
 * @param date
 * @param format 格式化字符串; YYYY-年, MM 月, DD 日, hh 时, mm 分, ss 秒, SSS 毫秒
 * @param [option] 配置项
 * @param [option.isPadStart=true] 是否填充字符
 * @param [option.padSymbol='0'] 填充字符
 * @example
 * import { formatDate } from '@compass-aiden/utils';
 *
 * formatDate(); // 返回当前时间,格式为 'YYYY-MM-DD hh:mm:ss'
 * formatDate('2020/03/12'); // 指定可被Date处理的时间字符串,格式为 'YYYY-MM-DD hh:mm:ss'
 * formatDate(Date.now(), 'YYYY/MM/DD'); // 指定可被Date处理的时间戳,格式为 'YYYY/MM/DD'
 */
export default function formatDate(
  date: string | number | Date = new Date(),
  format = 'YYYY-MM-DD hh:mm:ss',
  option?: {
    isPadStart?: boolean;
    padSymbol?: string;
  },
) {
  const { isPadStart, padSymbol } = {
    isPadStart: true,
    padSymbol: '0',
    ...option,
  };
  const localDate = date instanceof Date ? date : new Date(date);

  const year = localDate.getFullYear();
  const month = localDate.getMonth() + 1;
  const day = localDate.getDate();
  const hours = localDate.getHours();
  const minutes = localDate.getMinutes();
  const seconds = localDate.getSeconds();
  const ms = localDate.getMilliseconds();

  let str = format;
  str = str.replace(/YYYY/g, isPadStart ? year.toString().padStart(4, padSymbol) : year.toString());
  str = str.replace(/MM/g, isPadStart ? month.toString().padStart(2, padSymbol) : month.toString());
  str = str.replace(/DD/g, isPadStart ? day.toString().padStart(2, padSymbol) : day.toString());
  str = str.replace(/hh/g, isPadStart ? hours.toString().padStart(2, padSymbol) : hours.toString());
  str = str.replace(/mm/g, isPadStart ? minutes.toString().padStart(2, padSymbol) : minutes.toString());
  str = str.replace(/ss/g, isPadStart ? seconds.toString().padStart(2, padSymbol) : seconds.toString());
  str = str.replace(/SSS/g, isPadStart ? ms.toString().padStart(3, padSymbol) : ms.toString());

  return str;
}
