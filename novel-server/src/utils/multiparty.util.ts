import type { Request } from 'express';
import * as multiparty from 'multiparty';
import http from 'http';

type ParsedFormData = {
    fields: Record<string, string[] | undefined>, 
    files: Record<string, multiparty.File[] | undefined>,
};

/**
 * async-await 风格的 mutiparty 处理
 */
export function parseForm(req: http.IncomingMessage | Request): Promise<ParsedFormData> {
    return new Promise((resolve, reject) => {
        new multiparty.Form().parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
            }
            resolve({fields, files});
        })
    })
}