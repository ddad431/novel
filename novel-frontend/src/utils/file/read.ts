/**
 * 读取文件内容 (UTF-8/GBK)
 */
export async function _read(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    return utf8Decoder.decode(buffer);
  }
  catch (e) {
    const gbkDecoder = new TextDecoder('gbk');
    return gbkDecoder.decode(buffer);
  }
}