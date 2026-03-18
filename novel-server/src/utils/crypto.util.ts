import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

/**
 * 计算文件的 MD5 哈希值
 */
export async function calcFileMd5(file: string): Promise<string> {
        const hash = createHash('md5');

        try {
            await pipeline(createReadStream(file), hash);
            return hash.digest('hex');
        }
        catch (err) {
            console.error('计算文件 MD5 出错');
            throw err;
        }
}