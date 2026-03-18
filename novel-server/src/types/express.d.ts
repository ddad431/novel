import { ErrorResponse, SuccessResponse } from "../models/api-contract/response.type";

/**
 * 覆盖 express Response 的 json 方法类型，提供类型安全的响应体
 */
declare module 'express' {
    interface Response {
        json<T extends Record<string, any>>(body: SuccessResponse<T>): Response;
        json(body: ErrorResponse): Response;
    }
}