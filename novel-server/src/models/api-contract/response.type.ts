

/**
 * code 表示业务状态码，message 用来解释对应的业务状态码
 */
export type ApiResponse<T> = 
    | { success: true, code: number, message: string, data: T }
    | { success: false, code: number, message: string, error: any };

/**
 * 成功响应
 * - 对于没有返回响应信息的响应，使用 204 Http 状态码, 即 res.status(204).end();
 */
export type SuccessResponse<T extends Record<string, any>> = {
    /** 响应信息 */
    message: string,

    /** 响应数据 */
    data: T,
};

/**
 * 失败响应
 */
export type ErrorResponse = {
    /** 响应信息 */
    message: string,

    /** 业务状态码 */
    code?: number,

    /** 具体错误 */
    error: any,
};