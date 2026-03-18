import { parseForm } from '../utils/multiparty.util';
import type { Request, Response, NextFunction } from 'express';

/**
 * 提前 multiparty 处理切片，方便 zod 校验中间件校验
 */
export async function uploadMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const { fields, files } = await parseForm(req);
        req.body = { fields, files };
        next();
    }
    catch (err) {
        return res.status(400).json({
            message: 'Request parse error',
            error: err,
        })
    }
}