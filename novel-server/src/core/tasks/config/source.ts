import type { BookSource, BookSourceList } from './type';

const source1: BookSource = {
    // 这章没有结束，请点击下一页继续阅读！
    // 本小章还未完，请点击下一页继续阅读后面精彩内容！
    // 小主，这个章节后面还有哦，请点击下一页继续阅读，后面更精彩！
    // 喜欢人族镇守使请大家收藏：(m.shuhaige.net)人族镇守使书海阁小说网更新速度全网最快。
    // 关键词：'请点击下一页继续阅读', '请大家收藏'
    name: '书海阁小说网',
    origin: 'https://m.shuhaige.net',
    task: {
        search_browser: {
            desc: 'search',
            mode: 'BROWSER',
            required: {
                keyword: '',
            },
            steps: [
                {
                    desc: 'step1: 模拟用户填写搜索输入框、点击搜索按钮、等待页面跳转完成',
                    url: 'https://m.shuhaige.net/',
                    actions: [
                        { type: 'fill', selector: '.main form span input', input: { text: { from: 'required', key: 'keyword', value: '' } } },
                        { type: 'click', selector: 'button.layui-btn' }
                    ],
                    wait: {
                        strategy: "wait_for_navigation"
                    }
                },
                {
                    desc: 'step2: 解析当前 HTML, 提取书籍列表数据 -> { booklist: Array<{...}> }',
                    actions: [
                        {
                            type: 'extract',
                            mode: 'HTML',
                            extractors: [
                                {
                                    field: 'booklist',
                                    type: 'composite',
                                    value: 'list',
                                    scope: 'ul.list li',
                                    subextractors: [
                                        {
                                            field: 'id',
                                            type: 'atomic',
                                            value: 'attr',
                                            selector: '.bookname a',
                                            attr: 'href',
                                            postprocess: {
                                                type: 'regex',
                                                pattern: '\/(\\d+)\/', //  href="/137356/"
                                            }
                                        },
                                        {
                                            field: 'cover',
                                            type: 'atomic',
                                            value: 'attr',
                                            selector: 'a img',
                                            attr: 'src',
                                        },
                                        {
                                            field: 'name',
                                            type: 'atomic',
                                            value: 'text',
                                            selector: '.bookname a',
                                        },
                                        {
                                            field: 'author',
                                            type: 'atomic',
                                            value: 'text',
                                            selector: 'p:nth-of-type(2) a',
                                        },
                                        {
                                            field: 'desc',
                                            type: 'atomic',
                                            value: 'text',
                                            selector: '.intro',
                                        },
                                        {
                                            field: 'status',
                                            type: 'atomic',
                                            value: 'text',
                                            selector: '.data span:nth-of-type(2)',
                                        },
                                        {
                                            field: 'tag',
                                            type: 'atomic',
                                            value: 'text',
                                            selector: 'p.data span:first-of-type'
                                        }
                                    ],
                                },
                            ]
                        }
                    ]
                }
            ]
        },
        search: {
            desc: 'search',
            mode: 'HTTP',
            required: {
                searchkey: '',
            },
            request: {
                method: 'POST',
                url: 'https://m.shuhaige.net/search.html',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: {
                    searchkey: '',
                }
            },
            extractors: [
                {
                    field: 'booklist',
                    type: 'composite',
                    value: 'list',
                    scope: 'ul.list li',
                    subextractors: [
                        {
                            field: 'id',
                            type: 'atomic',
                            value: 'attr',
                            selector: '.bookname a',
                            attr: 'href',
                            postprocess: {
                                type: 'regex',
                                pattern: '\/(\\d+)\/', //  href="/137356/"
                            }
                        },
                        {
                            field: 'cover',
                            type: 'atomic',
                            value: 'attr',
                            selector: 'a img',
                            attr: 'src',
                        },
                        {
                            field: 'name',
                            type: 'atomic',
                            value: 'text',
                            selector: '.bookname a',
                        },
                        {
                            field: 'author',
                            type: 'atomic',
                            value: 'text',
                            selector: 'p:nth-of-type(2) a',
                        },
                        {
                            field: 'desc',
                            type: 'atomic',
                            value: 'text',
                            selector: '.intro',
                        },
                        {
                            field: 'status',
                            type: 'atomic',
                            value: 'text',
                            selector: '.data span:nth-of-type(2)',
                        },
                        {
                            field: 'tag',
                            type: 'atomic',
                            value: 'text',
                            selector: 'p.data span:first-of-type'
                        }
                    ],
                },
            ]
        },
        catalog: {
            desc: 'catalog',
            mode: 'HTTP',
            required: {
                id: '',
                page: '1',
            },
            request: {
                method: 'GET',
                url: 'https://m.shuhaige.net/{{id}}_{{page}}/',
            },
            extractors: [
                {
                    field: 'catalog',
                    type: 'composite',
                    scope: '.main .read li',
                    value: 'list',
                    subextractors: [
                        // href="/78041/65759689.html"
                        { field: 'cid', type: 'atomic', value: 'attr', selector: 'a', attr: 'href', postprocess: { type: 'regex', pattern: '.*\/(\\d+)\.html' } },
                        { field: 'title', type: 'atomic', value: 'text', selector: 'a' },
                    ]
                }
            ],
            // pagination: {
            //     type: 'serial',
            //     field: 'page',
            //     merge: 'mono',
            //     extractors: [{
            //         field: 'next',
            //         type: 'atomic',
            //         value: 'attr',
            //         selector: '.pagelist a:last-child',  // NOTE a 标签还涉及上一页
            //         attr: 'href',   // href="/78041_2/"
            //         postprocess: { type: 'regex', pattern: '\/\\d+_(\\d+)\/' }, // NOTE 可能有几十页，\\d+ 而不是 \d
            //     }],
            // },
            pagination: {
                type: 'parallel',
                field: 'page',
                merge: 'mono',
                extractors: [
                    {
                        type: 'composite',
                        field: 'pages',
                        value: 'list',
                        scope: '.pagelist .pagenum select option',
                        subextractors: [{
                            field: 'page',
                            type: 'atomic',
                            value: 'attr',
                            attr: 'value',
                            selector: 'option',
                            postprocess: {
                                type: 'regex',  // value="/78041_2/"
                                pattern: '\/\\d+_(\\d+)\/',
                            }
                        }]
                    }
                ]
            }
        },
        content: {
            desc: 'content',
            mode: 'HTTP',
            request: {
                method: 'GET',
                url: 'https://m.shuhaige.net/{{id}}/{{cid}}_{{page}}.html',
            },
            required: {
                id: '',
                cid: '',
                page: '1',
            },
            extractors: [
                {
                    field: 'content',
                    type: 'composite',
                    scope: '#chapter .content p',
                    value: 'list',
                    subextractors: [
                        // NOTE 特殊情况，我们不是从 scope 里的子元素提取内容，而是从 scope 本身直接提取内容，这时候使用 p 选中自身
                        { field: 'line', type: 'atomic', value: 'text', selector: 'p', postprocess: { type: 'filter', keywords: ['m.shuhaige.net', '请点击下一页继续阅读', '(本章完)']} },
                    ]
                }
            ],
            pagination: {
                type: 'serial',
                field: 'page',
                extractors: [{
                    field: 'next',
                    type: 'atomic',
                    value: 'attr',
                    selector: '#chapter .pager a:nth-of-type(3)',
                    attr: 'href',   // href="/78041/65759689_2.html"
                    postprocess: { type: 'regex', pattern: '.*_(\\d+)\.html' },
                }],
                merge: 'mono',
            },
        }
    },
}

const source2: BookSource = {
    name: '新笔趣阁',
    origin: 'https://www.biquge.xin',
    task: {
        'search': {
            mode: 'HTTP',
            required: {
                searchkey: '',
            },
            request: {
                url: 'https://www.biquge.xin/search/result.html?searchkey={{searchkey}}',
                method: 'GET',
            },
            extractors: [
                {
                    type: 'composite',
                    value: 'list',
                    field: 'booklist',
                    scope: '.librarylist li',
                    subextractors: [
                        {
                            field: 'id',
                            type: 'atomic',
                            value: 'attr',
                            selector: '.pt-ll-l a',
                            attr: 'href',
                            postprocess: {
                                type: 'regex',
                                pattern: '\/book\/(\\d+)/', // href="/book/123033/"
                            }
                        },
                        {
                            field: 'cover',
                            type: 'atomic',
                            value: 'attr',
                            selector: '.pt-ll-l img', // cover 这个需要拼接 (src="/cover/e1/53/70/e153704f6f5cb6386e8c961cf2fb284c.jpg")
                            attr: 'src',
                            postprocess: {
                                type: 'replace',
                                template: 'https://www.biquge.xin{{value}}'
                            }
                        },
                        {
                            field: 'name',
                            type: 'atomic',
                            value: 'text',
                            selector: '.pt-ll-r .novelname',
                        },
                        {
                            field: 'author',
                            type: 'atomic',
                            value: 'text',
                            selector: '.pt-ll-r .info span:nth-child(2) a',
                        },
                        {
                            field: 'desc',
                            type: 'atomic',
                            value: 'text',
                            selector: '.pt-ll-r .intro',
                        },
                        {
                            field: 'status',
                            type: 'atomic',
                            value: 'text',
                            selector: '', // 
                        },
                        {
                            field: 'tag',
                            type: 'atomic',
                            value: 'text',
                            selector: '', //
                        }
                    ],
                },
            ],
        },
        'catalog': {
            mode: 'HTTP',
            required: {
                id: '',
            },
            request: {
                method: 'GET',
                url: 'https://www.biquge.xin/book/{{id}}/'
            },
            extractors: [
                {
                    type: 'composite',
                    value: 'list',
                    field: 'catalog',
                    scope: '.dirlist li',
                    subextractors: [
                        {
                            field: 'title',
                            type: 'atomic',
                            value: 'text',
                            selector: 'a'
                        },
                        {
                            field: 'cid',
                            type: 'atomic',
                            value: 'attr',
                            selector: 'a',
                            attr: 'href',
                            postprocess: {
                                type: 'regex',
                                pattern: '\/book\/.*\/(\\d+).html' // href="/book/123033/1.html"
                            }
                        }
                    ]
                }
            ]
        },
        'content': {
            mode: 'HTTP',
            required: {
                id: '',
                cid: '',
            },
            request: {
                method: 'GET',
                url: 'https://www.biquge.xin/book/{{id}}/{{cid}}.html',
            },
            extractors: [
                {
                    field: 'content',
                    type: 'composite',
                    value: 'list',
                    scope: '#chaptercontent p',
                    subextractors: [
                        {
                            field: 'line',
                            type: 'atomic',
                            value: 'text',
                            selector: 'p',
                        }
                    ]
                }
            ]
        }
    }
} 

export const source = [
    source1,
    source2,
] as const satisfies BookSourceList;