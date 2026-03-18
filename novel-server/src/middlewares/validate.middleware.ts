import { ZodType, ZodError } from 'zod'
import { Request, Response, NextFunction } from 'express';

/**
 * 请求参数校验
 */
export function validateMiddleware(schema: ZodType) {
    // 校验
    // - 正常 -> next() 
    // - 异常 -> 是否是 zod 本身出错 -> 是 -> 提取错误信息，返回错误响应
    //                                不是 -> next(err) 转发给错误处理中间件 -> 返回错误响应
    return function (req: Request, res: Response, next: NextFunction) {
        try {
            const validateData = schema.parse(req.body);
            
            req.body = validateData;
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    message: 'Request validate error',
                    error: err.issues,
                })
            }

            next(err);
        }
    }
}