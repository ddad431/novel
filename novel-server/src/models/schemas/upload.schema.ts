import { z } from 'zod';

/**
 * 检测输入数据类型是否符合 multiparty File 接口 (用于 zod.custom)
 */
function isFile(o: unknown): Boolean {  // zod.custom<File>((value) => is(value), 'xx') 里的 value 类型是 unkown；当然我们也可以 (value: any) ，不过 unkown 是类型安全的
    if (!o || typeof o !== 'object') {
        return false;
    }

    if (Object.getPrototypeOf(o) !== Object.prototype) {
        return false;
    }

    const _o = o as Record<string, unknown>;    // 收窄 o 类型

    return 'fieldName' in _o    // 仅检测属性是否存在，不检测属性的类型（属性值有可能为 undefined）
        && 'originalFilename' in _o
        && 'path' in _o
        && 'size' in _o
        && 'headers' in _o;
}


// Request
export const UploadRequestSchema = z.object({
    // NOTE
    // - req.body 不能在 validate 中间件直接读，即，我们不能直接校验。所以我们在这之前使用 upload 中间件，借助 multiparty 把整理的数据传过来。
    // - 下面是 req.body 的字段，即 mulitparty 处理后拿到的。
    // - 这里的 fields, files 对象是 mulitparty 处理得到的固定对象，这两个对象的内部的字段名就是 upload 接口契约。
    fields: z.object({ // NOTE 这里的字段也需要 z.object 包起来
        name: z.array(z.coerce.string()).length(1, {error: 'name 字段重复或缺失，必须且只能有一个值'}),
        index: z.array(z.coerce.string()).length(1, {error: 'index 字段重复或缺失，必须且只能有一个值'}),
    }),
    files: z.object({
        file: z.array(z.custom<File>((value) => isFile(value))).length(1, {error: '文件分片缺失或重复，必须且只能上传一个分片'}),
    }),
})

export const UploadMergeRequestSchema = z.object({
    name: z.coerce.string().min(1, { error: '小说名不能为空' }),
})