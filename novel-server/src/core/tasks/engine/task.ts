import { chromium } from 'playwright';
import type { Task, HttpTask, BrowserTask } from '../config/type';
import { parseHTML } from './parse';
import { setRequestHeaders, setRequestBody, sendRequest, buildRequestURL } from './http';

// TODO
// - BroswerTask config 字段，节省资源加快请求速度，即不要请求页面的其他资源（例如图片等）
// - task 任务返回的数据类型（在 task 中添加一个字段，然后根据该字段推断出对应的类型？是否可行？）
// - BrowserTask 扩展

export async function runTask<T extends Task>(task: T, required: TaskRequiredOptions<T['required']>) {
    console.log('required:', JSON.stringify(required));
    console.log('Function: runTask');
    return task.mode === 'HTTP' ? runHttpTask(task as HttpTask, required) : runBrowserTask(task as BrowserTask, required);
}


type TaskRequiredOptions<T> = {
    [K in keyof T]: T[K] extends string ? string : T[K]
};


function normalize(data: Record<string, any>): any {
    // data 特点
    // - data 是一个普通对象
    // - data 键的值可以是原始类型，对象，数组
    // - 数组的元素是对象

    // 测试
    // const test = [
    //     { p: 'v' },                               // -> 'v'
    //     { p: {p1: 'v'}},                          // -> 'v'
    //     { p: {p1: [{p11: 'v'}]}},                 // -> 'v'
    //     { p: {p1: [{p11: 'v1'}, {p11: 'v2'}]}},   // -> ['v1', 'v2']
    //     { p: [{p1: 'v'}]},                        // -> 'v'
    //     { p: [{p1: 'v1'}, {p1: 'v2'}]},           // -> ['v1', 'v2']
    //     { p: [{p1: {p11: 'v'}}]},                 // -> 'v'
    //     { p: [{p1: [{p11: 'v'}]}]},               // -> 'v'
    //     { p: [{p1: [{p11: 'v1'}, {p11: 'v2'}]}]}, // -> ['v1', 'v2']
    // ];
    // 
    // test.map(v => normalize(v));

    const isArray = (data: any) => Array.isArray(data);
    const isPureObject = (data: any) => data && Object.getPrototypeOf(data) === Object.prototype;

    if (Object.keys(data).length > 1) {
        return data;
    }

    const e1 = data[Object.keys(data)[0]];
    if (!e1 || typeof e1 !== 'object') {
        return e1;
    }

    if (isPureObject(e1)) {
        return normalize(e1);
    }

    if (isArray(e1)) {
        return e1.length === 1 ? normalize(e1[0]) : e1.map(v => normalize(v));
    }
}


async function runHttpTask(task: HttpTask, required: Record<string, any>) {
    console.log('Run HTTP Task Start:')
    const { request, generated, extractors, pagination } = task;
    const { url, method, body, headers } = request;

    let _headers = {},
        _body = null,
        _url = '',
        _html = '';
    let result = null;

    // TODO: generated 处理

    // (1) 设置请求头
    if (headers) {
        _headers = setRequestHeaders(headers);
    }

    // (2) 设置请求体
    if (method === 'POST' && body && headers?.['Content-Type']) {
        // NOTE 尽管 required 与 body 可能重复。但是 required 携带不仅是 body 字段，例如可能的 query 等。
        Object.entries(required).forEach(([key, value]) => {
            body[key] = value;
        });
        _body = setRequestBody(headers['Content-Type'], body);
    }

    // (3) 构建请求 URL
    _url = buildRequestURL(url, required, generated)
    console.log('_url', _url);

    // (4) 发送请求，获取 HTML
    _html = await sendRequest(_url, { method, headers: _headers, body: _body });
    if (!_html) {
        return result;
    }

    // (5) 解析 HTML 提取数据
    result = normalize(parseHTML(_html, extractors));
    if (!pagination || !required) {
        return result;
    }

    // (6) 分页多次请求
    const { field, extractors: rules, merge, type } = pagination;
    result = merge === 'collection' ? [result] : result;

    let curHtml = _html;
    if (type === 'serial') {
        while (true) {
            const next = normalize(parseHTML(curHtml, rules));
            console.log('next:', next);
            if (!next) {
                break;
            }

            required[field] = next;
            const newURL = buildRequestURL(url, required, generated);
            const newHtml = await sendRequest(newURL, { method, headers: _headers, body: _body });
            if (!newHtml) {
                break;
            }

            const piece = normalize(parseHTML(newHtml, extractors));
            if (merge === 'collection') {
                result.push(piece);
            }
            else {  // merge === 'mono'
                switch (Object.getPrototypeOf(piece)) {
                    case String.prototype:
                        result += piece; break;

                    case Array.prototype:
                        result = [...result, ...piece]; break;

                    case Object.prototype:
                        result = { ...result, ...piece }; break;
                }
            }

            curHtml = newHtml;
        }
    }
    else if (type === 'parallel') {
        let nexts: string[] = normalize(parseHTML(curHtml, rules));
        console.log('nexts', nexts);

        if (!nexts || nexts.length === 0) {
            return result;
        }

        nexts = nexts.slice();  // 移除 page: 1
        const promises = nexts.map(v => {
             const newRequired = { ...required, [field]: v };
             const newURL = buildRequestURL(url, newRequired, generated);

             return sendRequest(newURL, { method, headers: _headers, body: _body })
                .then(res => normalize(parseHTML(res, extractors)));    // 这里用的数据提取规则，不是 rules nexts 提取...
        });

        const newResults = await Promise.all(promises);

        if (merge === 'collection') {
            result.push(...newResults);
        }
        else {
            result = [...result, ...newResults.flat()];
        }
    }

    if (merge === 'collection' && result.length === 1) {
        result = result[0];
    }
    
    return result;
}


async function runBrowserTask(task: BrowserTask, required: Record<string, any>) {
    console.log('Function: runBrowserTask');
    const { steps } = task;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    for (const step of steps) {
        const { url, actions, wait } = step;

        if (url) {
            // TODO: 会涉及 URL 构建吗？
            await page.goto(url, {
                 waitUntil: 'domcontentloaded' 
            });

            await page.waitForTimeout(1000);
        }

        for (const action of actions) {
            switch (action.type) {
                case 'click': {
                    const { selector } = action;
                    // await page.click(selector);
                    
                    await Promise.all([
                            page.waitForNavigation({ 
                                waitUntil: 'domcontentloaded' 
                            }),
                            page.click(selector)
                        ]);

                    break;
                }

                case 'fill': {
                    const { selector, input } = action;
                    const { text } = input;

                    text.value = text.from === 'required'
                        ? required?.[text.key]
                        : ''; // TODO：来自 action 间 share 的数据

                    await page.fill(selector, text.value);

                    break;
                }

                case 'extract': {
                    if (action.mode === 'HTML') {
                        const { extractors } = action;
                        const html = await page.content();
                        const result = normalize(parseHTML(html, extractors));

                        return result;
                    }
                    else { // action.mode === 'CONTEXT'
                        // TODO
                    }

                    break;
                }

                case 'scroll': {
                    // TODO
                    break;
                }

                case 'request': {
                    // TODO
                    break;
                }
            }
        }

        if (wait) {
            // if (wait.strategy === 'wait_for_navigation') {
            //     await page.waitForNavigation();
            // }
        }
    }

    await browser.close();
}