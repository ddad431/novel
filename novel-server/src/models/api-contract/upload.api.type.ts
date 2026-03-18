// 后端接收到的（multiparty 处理的。处理在 upload 中间件进行，校验在 validate 中间件进行。）
// 
// fields = {
//     name: ['xx'],
//     id: ['xx'],
//     index: ['1']
// }
// 
// files = {
//      file: [data]  
// }
export type Chunk = {
    /** 切片数据 */
    file: Blob,

    /** 切片索引 */
    index: number,

    /** 文件名 */
    name: string,

    /** TODO: 检验相关 */
};