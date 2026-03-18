import fs from 'fs/promises';
import chardet from 'chardet';
import iconv from 'iconv-lite';

/**
 * 读取文件内容
 */
export async function _read(file: string): Promise<string> {
    const buffer = await fs.readFile(file);

    // encoding (via chardet)
    const encoding = chardet.detect(buffer);
    if (!encoding) {
        throw new Error(`未知编码文件`);
    }

    // content (via iconv-lite, Nodejs 不支持读取 GBK 编码文件)
    if (!iconv.encodingExists(encoding)) {
        throw new Error(`iconv 不支持检测到的编码 ${encoding}`);
    }
    const content = iconv.decode(buffer, encoding);

    return content;
}