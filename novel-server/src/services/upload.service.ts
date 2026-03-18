import fs from 'fs/promises';
import path from "path";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";

import type { Request } from "express";
import { _read } from '../utils/file.util';

// NOTE
// - 切片。不是前端只起一个请求，逐个发送切片，后端在 upload 路由回调里最终接收所有切片。
//   而是前端将文件分片，然后同时发起多个请求（并发），后端触发多个 upload 路由回调，回调
//   每次处理一个切片。
// 
// - 合并。
// 
//      后端什么时候开始合并？后端知道他接受到了最后一个切片。怎么知道？
// 
//      1) X 前端给后端发送的切片做标记，最后一个特殊标记，后端识别到这是最后一个。
// 
//          不行，因为请求是并发的，后端收到的切片是无序的，你接受到的最后一个未必是最后一个。
// 
//      2）同样是前端给后端发送的切片做标记，但这一次直接标记的是切片总数，后端每次收到切片
//          时切片总数就 +1，当为切片总数时就是最后一个。
// 
//          可以是可以，但是你还要维护一个全局变量来保存切片总数呢？每次处理切片在不同回调呢。
// 
//      3）前端并发发完切片后，发送一个合并请求。
// 
//          可以。因为前端用的是 Promoise.All，合并请求紧随其后。而之后前面的切片都发送成功了，
//          才能顺序执行程序流，即发起合并请求。如果有一个失败了，直接中断执行流，就不会意外发送
//          合并请求。
// 
//      后端怎么合并？
// 
//      由于切片是并发的，我们收到的切片是无序的，因此我们在发送切片数据前要根据切片数据携带的索引
//      对切片数据排序，然后合并。
//      
// - multiparty 不是用来收集所有切片，而是将前端发送过来的单个切片处理成后端方便使用的格式。
// 
// - receive 处理的不是收集的所有切片，做的也不是将所有切片合并，而是根据拿到的处理过的单个
//   切片信息将切片放到合适的地方，方便之后 merge。

// fields = {
//     name: ['xx'],    // chunk 所属文件名（合并使用）
//     id: ['xx'],      // chunk 所属文件 ID（合并使用）
//     index: ['1']     // chunk 索引（排序使用）
// }
// 
// files = {
//      file: [data]    // NOTE 1) 这个 file 字段名不是固定的，只要 formData 字段对应数据是 Blob 二进制数据，那么这个字段名就会出现在 files 这里
//                      //      2) 我们这里的 multipart 是切片，所以肯定只有一个二进制数据，对应的 files 也只会有一个字段。
//                      //      3) 注意，跟上面的 fileds 一样，所有的数据都被放在数组中。
//                              
// }
export class UploadService {
    public async receive(req: Request) {
        console.log('Function: receive');
        const { fields, files } = req.body;
        const chunk = files?.['file']?.[0];
        const chunkIndex = fields?.['index']?.[0];
        const fileName = fields?.['name']?.[0];

        if (!chunk || !chunkIndex || !fileName) {
            // TODO: 抛出错误，重传
            return;
        }

        try {
            const cdir = path.join(process.cwd(), 'uploads', `${fileName}-chunks`);
            await fs.mkdir(cdir, { recursive: true });

            // NOTE
            // - await fs.rename(chunk.path, desc) 会出现 EXDEV: cross-device link not permitted
            // - 使用 copyFile, unlink 替代
            const desc = path.join(cdir, `${chunkIndex}.chunk`);    // 1.chunk 2.chunk
            await fs.copyFile(chunk.path, desc);
            await fs.unlink(chunk.path);
            
        }
        catch (UPLOAD_MERGE_ERROR) {
            // TODO: 错误分类 ？
            throw UPLOAD_MERGE_ERROR;
        }

    }

    public async merge(name: string): Promise<string> {
        try {
            console.log('Function: merge');
            const cdir = path.join(process.cwd(), 'uploads', `${name}-chunks`);
            const file = path.join(process.cwd(), 'uploads', name);
            const files = await fs.readdir(cdir);
            const chunks = files.sort((a, b) => parseInt(a.split('.')[0]) - parseInt(b.split('.')[0])); // 1.chunk 2.chunk

            const wstream = createWriteStream(file, { flags: 'a' });
            for (const chunk of chunks) {
                await pipeline(
                    createReadStream(path.join(cdir, chunk)),
                    wstream,
                    { end: false }  // pipeline 完后不要关闭写入流，方便下一次 pipeline
                )
            }

            // 等待 finish 事件确认
            // 
            // NOTE
            // - TODO: 
            // - 我们不在 finish 回调中执行清理。尽管我们可以这么做，但是清理过程可能抛出错误，
            //   这需要我们使用 try...catch 包裹, 错误 reject，这让整个流程不是很清晰。所以
            //   我们直接等操作完成，即 resolve 后，我们再执行清理。
            await new Promise<void>((resolve, reject) => {
                wstream.on('error', reject);
                wstream.on('finish', resolve);
                wstream.end();
            })

            // finish 事件确认，执行清理
            await fs.rm(cdir, { recursive: true, force: true });

            // 返回合并文件 path
            return file;
        }
        catch (UPLOAD_MERGE_ERROR) {
            // TODO: 错误分类 ？
            throw UPLOAD_MERGE_ERROR;
        }
    }
}

export const uploadService = new UploadService();