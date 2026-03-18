export type Chunk = {
    /** 切片数据 */
    file: Blob,

    /** 切片索引 */
    index: string, // NOTE: FromData 字段的类型是 string | Blob. （Type 'number' is not assignable to type 'string | Blob'）

    /** 文件名 */
    name: string,

    /** TODO: 检验相关 */
};

export const FileUploader = {
    createChunks,
    uploadChunks,
    mergeChunks,
};

function createChunks(file: File, size = 5 * 1024 * 1024): Chunk[] {
    const chunks: Chunk[] = [];

    let cur = 0, index = 0;
    while (cur < file.size) {
        chunks.push({
            name: file.name,
            index: String(index),
            file: file.slice(cur, cur + size),
        });

        cur += size;
        index++;
    }

    return chunks;
}

async function uploadChunks(chunks: Chunk[], url: string) {
    // #ifdef H5
    const promises = chunks.map(chunk => {
        const formData = new FormData();
        Object.entries(chunk).forEach(([key, value]) => formData.append(key, value));

        return fetch(url, { method: 'POST', body: formData }).then(res => {
            if (!res.ok) {
                throw new Error(`Upload failed for chunk ${chunk.index}.`);
            }
        });
    });

    try {
        await Promise.all(promises);

        console.log('所有文件切片上传成功');
    }
    catch (err) {
        console.error('文件切片上传失败:', err);
        throw err;
    }
    // #endif
}

async function mergeChunks(fileName: string, url: string) {
    // #ifdef H5
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: fileName })    // 靠，merge body 这里没更新...
        });

        if (!res.ok) {
            throw new Error(`Merge chunks fail: ${res.status} ${res.statusText}.`);
        }
        return res.json();
    }
    catch (err) {
        console.error('合并文件切片失败', err);
        throw err;
    }
    // #endif
}
