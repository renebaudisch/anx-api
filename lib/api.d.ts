import { IResponse } from './types';
export type Method = 'get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH';
export interface IConfig {
    concurrencyLimit?: number;
    environment?: string;
    rateLimiting: boolean;
    request?: (opts: IGenericOptions) => Promise<IResponse>;
    beforeRequest?: (opts: any) => any;
    afterRequest?: (opts: any) => any;
    target: string;
    timeout?: number;
    token?: string;
    userAgent?: string;
}
export interface IGenericOptions {
    auth?: any;
    encodeParams?: boolean;
    headers?: {};
    mimeType?: string;
    noAuth?: any;
    numElements?: number;
    params?: {};
    startElement?: number;
    timeout?: number;
    uri: string;
}
export interface IOptionsWithPayload extends IGenericOptions {
    body?: any;
}
export interface IRequestOptions extends IOptionsWithPayload {
    method: Method;
}
export interface IRequestOptionsInternal {
    auth?: boolean;
    body: object;
    encodeParams: boolean;
    headers: Record<string, string>;
    method: Method;
    mimeType?: string;
    noAuth?: boolean;
    numElements?: number;
    params: Record<string, string>;
    rejectUnauthorized: boolean;
    startElement?: number;
    timeout: number;
    uri: string;
}
export declare function statusOk(body: any): boolean;
export declare class AnxApi {
    _config: IConfig;
    constructor(config: IConfig);
    _request(method: Method, opts: IGenericOptions | string, extendOpts: IGenericOptions, payload?: any): Promise<IResponse>;
    request(opts: IRequestOptions, extendOpts?: IGenericOptions): Promise<IResponse>;
    get(opts: IGenericOptions | string, extendOpts?: IGenericOptions): Promise<IResponse>;
    getAll(opts: IGenericOptions, extendOpts: any): Promise<any>;
    post(opts: IOptionsWithPayload | string, payload: any, extendOpts?: IGenericOptions): Promise<IResponse>;
    put(opts: IOptionsWithPayload | string, payload: any, extendOpts?: IGenericOptions): Promise<IResponse>;
    delete(opts: IGenericOptions | string, extendOpts?: IGenericOptions): Promise<IResponse>;
    login(username: string, password: string): Promise<string>;
    switchUser(userId: number): Promise<IResponse>;
}
