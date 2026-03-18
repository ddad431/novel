import  * as cheerio from 'cheerio'
import { HTMLExtractor } from '../config/type';

export function parseHTML(html: string, extractors: readonly HTMLExtractor[]): Record<string, any> {
    const $ = cheerio.load(html);
    const result: Record<string, any> = {};

    for (const extractor of extractors) {
        const { field, type } = extractor;

        if (type === 'atomic') {
            const { value, selector, postprocess } = extractor;
            let data = '';

            if (value === 'attr') {
                data = $(selector).attr(extractor.attr) ?? '';
            }
            else if (value === 'text') {
                data = $(selector).text() ?? '';
            }
            else {  // value === 'html'
                data = $(selector).html() ?? '';
            }

            if (postprocess) {
                if (postprocess.type === 'regex') {
                    data = data.match(new RegExp(postprocess.pattern))?.[1] ?? '';
                }
                else if (postprocess.type === 'replace') {
                    // template: http://xx.com/cover/{{value}}
                    data = postprocess.template.replace(/\{\{value\}\}/, data);
                }
                else if (postprocess.type === 'filter') {
                    data = postprocess.keywords.find(v => data.includes(v)) ? '' : data;
                }
                else {  // postprocess.type === 'script'
                    // TODO:
                }
            }

            result[field] = data;
        }
        else { // type === 'composite'
            const { scope, value, subextractors } = extractor;

            if (value === 'list') {
                let data: any[] = [];
                $(scope).each((_, element) => {
                    const subHtml = cheerio.load(element).html();
                    const subResult = subHtml ? parseHTML(subHtml, subextractors) : {};

                    data.push(subResult);
                })

                result[field] = data;
            }
            else {  // value === 'object'
                const subHtml = $(scope).html();
                result[field] = subHtml ? parseHTML(subHtml, subextractors) : {};
            }
        }
    }

    return result;
}