interface NovelCatalogPayload {
    origin: string,
    id: string,
}

interface NovelChapterPayload {
    origin: string,
    id: string,
    cid: string,
}

/**
 * code 表示业务状态码，message 用来解释对应的业务状态码
 */
type ApiResponse<T> = 
    | { success: true, code: number, message: string, data: T }
    | { success: false, code: number, message: string, error: any };


/** TODO 封装 fetch */
async function FFetch(
    url: string,
    { method, headers, body, timeout, retry } : { method: 'GET' | 'POST', headers?: Record<string, string>, body?: any, timeout?: number, retry?: number},
) {
    try {
        const response = await fetch(url, {
            method,
            ...(headers ? { headers } : {}),
            ...(method === 'POST' ? { body } : {}),
            ...(timeout ? { signal: AbortSignal.timeout(timeout) } : {}),
        })

        if (!response.ok) {
            if (response.status >= 500) {

            }
        }
    }
    catch (err: any) {
        if (err.name === 'TimeoutError') {
            console.error('请求超时');
        }
        else if (err.name === 'AbortError') {
            console.error('请求取消');      
        } else if (err instanceof TypeError) {

        }
        throw err;
    }

}

export async function fetchNovelList(keyword: string) {
    try {
        const response = await fetch('/api/novel/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword }),
            signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {

        }
        
        return response.json();
    }
    catch (err: any) {
        if (err.name === 'TimeoutError') {
            console.error('请求超时')
        }
        else if (err.name === 'AbortError') {
            console.error('请求取消');
        }
        else {

        }
    }
}

export async function fetchNovelCatalog(payload: NovelCatalogPayload) {
    try {
        const response = await fetch('/api/novel/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
            if (response.status >= 400 && response.status < 500) {
                console.log(`客户端端出错：${response.status}, response: ${response}`);
                throw new Error(`客户端出错`)
            } else if (response.status >= 500) {
                console.log(`服务端出错：${response.status}, response: ${response}`);
                throw new Error(`服务端出错`)
            }
        }

        return response.json();
    }
    catch (err: any) {
        if (err.name === 'TimeoutError') {
            console.error('请求超时')
        }
        else if (err.name === 'AbortError') {
            console.error('请求取消');
        }
        else {
            
        }
        throw err;
    }
}

export async function fetchNovelChapter(payload: NovelChapterPayload) {
    try {
        const response = await fetch('/api/novel/chapter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20000),
        })

        if (!response.ok) {    
        }

        return response.json();
    }
    catch (err: any) {
        if (err.name === 'TimeoutError') {
            console.error('请求超时')
        }
        else if (err.name === 'AbortError') {
            console.error('请求取消');
        }
        else {
            
        }
    }
}