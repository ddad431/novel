import got from "got";
import { CookieJar } from "tough-cookie";

export function setRequestHeaders(headers: Record<string, string>) {
    const _default = {
        // TODO
        'User-Agent': 'Mozilla/5.0 (Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 NT 10.0; Win64; x64) AppleWebKit/537.36...',
    };

    return { ..._default, ...headers };
}


export function setRequestBody(type: string, body: Record<string, any>) {
    switch (type) {
        case 'application/x-www-form-urlencoded':
            return Object.entries(body).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');

        case 'application/json':
            return JSON.stringify(body);

        default:
            return String(body);
    }
}


/**
 * 构建请求 URL
 * - http://xx.com/book/{{id}}/{{cid}}
 * - http://xx.com/book?aa={{id}}&bb={{cid}}
 * - http://xx.com/book/{{id}}?bb={{cid}}
 */
export function buildRequestURL(url: string, required?: Record<string, any>, generated?: Record<string, any>) {
    let result = url;

    if (required) {
        Object.entries(required).forEach(([key, value]) => {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`), encodeURIComponent(value));
        });
    }

    if (generated) {
        // TODO
    }

    return result;
}


const globalCookieJar = new CookieJar();
export async function sendRequest(url: string, options: { method: 'GET' | 'POST', headers?: Record<string, string>, body?: any }) {
    const { method, body, headers } = options;

    if (method === 'POST') {
        const domain = new URL(url).origin;
        const cookies = await globalCookieJar.getCookies(domain);
        if (cookies.length === 0) {
            // 发现罐子是空的，偷偷先去首页拿个 Cookie
            await got(domain, { cookieJar: globalCookieJar });
        }
    }

    try {
        const response = await got(url, {
            method,
            headers,
            cookieJar: globalCookieJar,
            responseType: 'text',
            followRedirect: true,
            retry: { limit: 0 },
            throwHttpErrors: false,
            ...(method === 'POST' && body ? { body } : {} )
        });

        return response.body;
    }
    catch (err) {
        console.error('Request Error:', err);
        return '';
    }
}


// export async function sendRequest(url: string, options: { method: 'GET' | 'POST', headers?: Record<string, string>, body?: any }) {
//     const { method, body, headers } = options;
//     let result = '';

//     try {
//         const _response = await fetch(url, { method, headers, body });
//         result = await _response.text();
//     }
//     catch (err) {
//         console.error(err);
//     }

//     return result;
// }