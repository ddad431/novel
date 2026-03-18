export type BookSourceList = BookSource[];

export type BookSource = {
    name: string,
    origin: string,
    task: Record<string, Task>,
};

export type Task =
    | HttpTask
    | BrowserTask;

export type HttpTask = {
    mode: 'HTTP',
    desc?: string,

    request: {
        method: 'GET' | 'POST',
        url: string,
        headers?: Record<string, string>,
        body?: Record<string, any>,
    },

    // TODO: 是否需要合并？即 url?: { path, required?, generated? }

    /** 动态 URL 中需要外部传入的字段 */
    required?: Record<string, any>,

    /** 动态 URL 中需要动态生成的字段 */
    generated?: Record<string, any>,

    /**
     * 请求是否涉及分页多次请求
     * - 分页结束的条件：没有提取到新的 next 值
     */
    pagination?: HttpPagination,

    extractors: readonly HTMLExtractor[],
};

// TODO: 扩展 required，用来表明他的用途
// 
// 承载 url 信息字段
//  - (get/post) url query 字段
//  - (get/post) url id 字段
// 
// 对于 get/post 的 url/query 我们都可以用占位符 {{value}} 来解决
//  query: http://xx.com?keyword=${keyword}
//  id: http://xx.com/book/{{id}}/{{cid}}
// 
// 承载 post 请求的 body 信息字段
// - application/json
// - appliaction/x-www-
// 
// 对于承载 post body 这种。我们也完全可以照封不动的 key: value 表示，只是在具体初始化 body 的时候，
// 对 body 包含的字段用 requried 对应字段赋值。虽然说有重复，但是 required 在 post 请求下也有可能承载 
// url 的字段。
// 
// 这里细化 required 有必要吗？
type HttpRequired = Record<string, {

    value: any,
}>

// TODO: HttpRequried 应该对 HttpPagination 的 field 字段进行约束

type HttpRequest = 
    | GetRequest
    | PostRequest;

type GetRequest = {
    method: 'GET',
    url: string,
    headers?: Record<string, string>,
}

type PostRequest = {
    method: 'POST',
    url: string,
    headers?: Record<string, string>,
    body?: Record<string, any>,
}

/**
 * 分页
 * - 继发请求。用于无法知晓总分页数的场景。
 * - 并发请求。
 *  - 可以获取分页页码数组，直接拼接 url。
 *  - 只能获取总页数。需要自行生成对应的页码数组。
 *      - 请求页码从 1 开始逐步递增。（常见）
 *      - 请求页码符合某种规律...（可能有人这样反爬虫...）
 * 
 * TODO
 * - 继发请求。要不要给一个 stop 显式停止字段？
 * - 并发请求。处理只能获取总页数的情况。
 */
type HttpPagination = 
    | SerialPagination
    | ParallelPagination;

type SerialPagination = {
    type: 'serial',
    field: string,
    extractors: readonly AtomicExtractor[],
    merge: 'collection' | 'mono',
}

type ParallelPagination = {
    type: 'parallel',
    field: string,
    extractors: readonly CompositeExtractor[],
    merge: 'collection' | 'mono',
}

export type BrowserTask = {
    mode: 'BROWSER',
    desc?: string,
    required?: Record<string, any>,
    steps: readonly {
        desc?: string,
        url?: string,
        actions: readonly PageAction[],
        wait?: Record<string, string>,
    }[],
};

type PageAction =
    | PageClickAction
    | PageFillAction
    | PageScrollAction
    | PageExtractAction
    | PageRequestAction;

type PageActionInputValue = {
    from: 'required' | 'shared',
    key: string,
    value: any,
};

type PageActionOutputValue = { // TODO ?
    to: 'shared',
    key: string,
};

type PageClickAction = {
    type: 'click',
    selector: string,
};

type PageFillAction = {
    type: 'fill',
    selector: string,
    input: Record<'text', PageActionInputValue>,
};

type PageScrollAction = {
    type: 'scroll',
    // TODO
};

type PageRequestAction = {
    type: 'request',
    // TODO
};

type PageExtractAction =
    | HTMLContentExtract
    | BrowserContextExtract;

type HTMLContentExtract = {
    type: 'extract',
    mode: 'HTML',
    extractors: readonly HTMLExtractor[],
};

type BrowserContextExtract = {
    type: 'extract',
    mode: 'CONTEXT',
    // TODO
};

export type HTMLExtractor =
    | AtomicExtractor
    | CompositeExtractor;

type AtomicExtractor =
    | TextOrHtmlExtractor
    | AttributeExtractor;

type CompositeExtractor = {
    type: 'composite',
    field: string,
    scope: string,
    value: 'list' | 'object',
    subextractors: readonly HTMLExtractor[],
};

type TextOrHtmlExtractor = {
    type: 'atomic',
    field: string,
    value: 'text' | 'html',
    selector: string,
    postprocess?: PostProcessor,
};

type AttributeExtractor = {
    type: 'atomic',
    field: string,
    value: 'attr',
    selector: string,
    attr: string,
    postprocess?: PostProcessor,
};

type PostProcessor =
    | RegexPostProcessor
    | ReplacePostProcessor
    | FilterPostProcessor
    | ScriptPostProcessor;

/**
 * 用来处理提取的数据需要再次提取的场景。例如：提取 id，cid
 * - pattern: '\/book\/\\d+/(\d+).html$'
 */
type RegexPostProcessor = {
    type: 'regex',
    pattern: string,
};

/**
 * 用来处理需要拼接数据的场景。例如：提取的封面需要拼接域名
 * - template: 'https://xxx.com{{value}}'
 */
type ReplacePostProcessor = {
    type: 'replace',
    template: string,
}

/**
 * 用来过滤垃圾结果。例如：清理章节行中的垃圾行，让其为 '', 方便最终的过滤
 * - keywords: ['请点击下一页继续阅读', 'm.shuhaige.com']
 */
type FilterPostProcessor = {
    type: 'filter',
    keywords: string[],
}

type ScriptPostProcessor = {
    type: 'script',
    script: string,
};