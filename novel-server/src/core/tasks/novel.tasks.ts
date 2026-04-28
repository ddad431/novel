import type { Novel, NovelCatalog, NovelChapter } from '../../models/core';
import { runTask } from './engine/task';
import { source } from './config/source';


// TODO: 感觉 runTask 这里第二个参数推导可能出错
// - 对于 (http://xx.com/{{keyword}) params 形式没问题，我们 requried 的 keyword 字段只是为了对应 params 的字段
// - 但对 (http://xx.com?searchKey={{searchKey}}) query 形式，
// - 以及 post body x-www-encloder 形式，他们的 key 都是有意义的。
// 
// 所以，我们这里的 searchkey 字段不能为同一个，当然值都是 keyword
// 我们可能需要一个不同 source 的 keyword 对应的映射表。(无论这个 keyword 在 params/query/body 那里，我们需要知道他的字段名)
// 
// 例如：m.shuhaige 用的是 POST 请求 searchkey body 字段
//      biquge.xin 用的是 searchkey query 字段
//      xx 用的是 keyword params 字段
// 
// 现实情况是：我们当前的 required 都需要的是一个字段。因为目前遇到的网站他们在 search 时只需要一个字段。
// 如果考虑的多一点的话，有些网站可能需要一些额外的字段，例如动态生成的字段（话说这不是放在 generate 的吗？）
// 如果把事情想的简单一点，我们只要保证所有的 search 操作的 requried 的第一个字段就代表我们的 keyword 就好了，
// 至于未来这个 search 的 required 这里可能需要其他参数？话说放到 requried 的话，那我们这里的入参还不一样要修改？
// 所以说我们想了半天，这是杞人忧天？
// 
// 感觉自己想的有点多，其实这个 novel 爬虫，三种模式的所需要字段不就是固定的吗？我们可以将提供一个统一的固定字段，然后
// 在配置层面映射关联不就行了？例如统一的 keyword，在配置内部有一个字段与这个 keyword 关联就好了，让他接收这个外部的 keyword 不就完了？

// NOTE 这个方案仅针对的是当前的 reuslt 数据结构，不是通用数据解决方案。   
// 不对，要是返回的数据本身就是数组，也就是这个数据本身要求的是二维数组呢？
// 不对，我们对数据进行进行解构会不会破坏数据原本的解构呢？例如他的数组的元素要求也是数组，而我们进行了深层解构，这导致我们返回了
// 一个非数组，这样一来我们在这个最外层这里还要还原数据结构。如果再进一步有没有可能会破坏数据语意，在输出端无法还原的情况？

export async function fetchNovelSearchList(keyword: string): Promise<Novel[]> {
    const info = source.map(v => ({ origin: v.origin, source: v.name }));
    const tasks = source.map(v => v.task['search']);
    const fields = source.map(v => Object.keys(v.task['search'].required!)[0]);  // 所有 search task 的 required 的第一个字段是 keyword 相关的字段
    let result: Novel[] = [];

    if (tasks.length === 0) {
        return result;
    }

    const promises = tasks.map((task, index) => {
        // @ts-ignore
        return runTask(task, {[fields[index]]: keyword}).then((res: any) => {
            res = Array.isArray(res) ? res : [res]; // // 处理返回数据长度是 1 的情况。（task 默认会对长度为 1 的数据进行解构）
            
            return res.map((v: any) => ({...v, ...info[index]}));
        })
    });
    try {
        result = (await Promise.allSettled(promises))
            .filter(v => v.status === 'fulfilled')
            .flatMap(v => v.value)
            .filter(v => v.id);

    }
    catch (err) {
        console.error(err)
    }
    
    return result;
}

export async function fetchNovelCatalog(origin: string, id: string): Promise<NovelCatalog> {
    const site = source.find(v => v.origin === origin);
    const task = site?.task['catalog'];
    let result: NovelCatalog = [];

    if (!site || !task) {
        return result;
    }
    
    try {
        const res = await runTask(task, {id, page: '1'});
        if (!Array.isArray(res)) {  // 处理返回数据长度是 1 的情况。（task 默认会对长度为 1 的数据进行解构）
            result.push(res);
        }
        else {
            result = res;
        }
    }
    catch (err) {
        result = [];
        console.error(err);
    }

    return result;
}

// 疑问
// - 为什么我们返回的小说章节内容的格式是 [{line: ''}, ...] 而不是预期的 ['', ...]
//   先不考虑多页合并，我们抓取的内容是什么？是一个数组，数组里面的东西是单独属性，即行 { line: '' }。
//   所以最终我们拿到的是：{ chapter: [{line: ''}, ...]} 对吧，我们再提取出来的就是 [{line: ''}, ...]。
//   这说明我们的序列化（二次处理），没有考虑到 { chapter: [{line: ''}, ...]} 即里面只有一个属性，属性是数组，
//   数组的元素只有一个属性的情况。
export async function fetchNovelChapter(origin: string, id: string, cid: string): Promise<NovelChapter> {
    const site = source.find(v => v.origin === origin);
    const task = site?.task['content'];
    let result: NovelChapter = [];
    
    if (!site || !task) {
        return result;
    }

    try {
        const res = await runTask(task, {id, cid, page: '1'});
        if (!Array.isArray(res)) {  // 处理返回数据长度是 1 的情况。（task 默认会对长度为 1 的数据进行解构）
            result.push(res);
        }
        else {
            result = res;
        }
    }
    catch (err) {
        result = [];
        console.error(err);
    }
    
    result = result.filter(v => v !== '').map(v => v.trim());

    return result;
}