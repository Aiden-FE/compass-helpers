/**
 * @description 文件下载方法
 *
 * @param {BlobPart} data 可被Blob处理的数据
 * @param {string} filename 指定的文件名
 * @param blobOption blob处理data时的配置选项
 */
export default function downloadFile(data: BlobPart, filename: string, blobOption?: BlobPropertyBag) {
  const blob = new Blob([data], blobOption);
  const downloadElement = document.createElement('a');
  const href = window.URL.createObjectURL(blob);
  downloadElement.setAttribute('download', filename);
  downloadElement.setAttribute('href', href);
  downloadElement.click();
  window.URL.revokeObjectURL(href);
  downloadElement.remove();
}
