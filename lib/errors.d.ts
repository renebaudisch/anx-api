import { IResponse } from './types';
export declare class ApiError extends Error {
    name: string;
    isAnxApi: boolean;
    isApiError: boolean;
    id: any;
    statusCode: number;
    code: any;
    description: any;
    response: any;
    req: any;
    res: any;
    constructor(req: any, res: IResponse, customMessage?: string);
}
export declare class NotAuthorizedError extends ApiError {
    name: string;
    constructor(req: any, res: any);
}
export declare class NotAuthenticatedError extends ApiError {
    name: string;
    constructor(req: any, res: any);
}
export declare class RateLimitExceededError extends ApiError {
    name: string;
    retryAfter: any;
    constructor(req: any, res: any);
}
export declare class SystemServiceUnavailableError extends ApiError {
    name: string;
    constructor(req: any, res: any);
}
export declare class SystemUnknownError extends ApiError {
    name: string;
    constructor(req: any, res: any);
}
export declare class TargetError extends ApiError {
}
export declare class NetworkError extends Error {
    name: string;
    isAnxApi: boolean;
    isNetworkError: boolean;
    code: any;
    err: any;
    req: any;
    constructor(err: any, req: any);
}
export declare class DNSLookupError extends NetworkError {
    name: string;
    constructor(err: any, req: any);
}
export declare class ConnectionAbortedError extends NetworkError {
    name: string;
    message: string;
}
export declare class SocketTimeoutError extends NetworkError {
    name: string;
    message: string;
}
export declare class ConnectionTimeoutError extends NetworkError {
    name: string;
    message: string;
}
export declare class ConnectionResetError extends NetworkError {
    name: string;
    message: string;
}
export declare class ConnectionRefusedError extends NetworkError {
    name: string;
    message: string;
}
export declare class ArgumentError extends Error {
    name: string;
    isAnxApi: boolean;
    isArgumentError: boolean;
    req: any;
    constructor(req: any, message: any);
}
export declare function buildRequestError(err: Error, req: any): Error;
export declare const buildError: (err: Error, req: any, res: any) => ApiError | NetworkError;
