import { IRequestOptionsInternal } from './api';
import { RateLimitExceededError } from './errors';
import { IResponse } from './types';
export interface IRequestQueueOptions {
    request: (opts: IRequestOptionsInternal) => Promise<IResponse>;
    limit: number;
    limitSeconds: number;
    limitHeader: string;
    onRateLimitExceeded: (err: RateLimitExceededError) => void;
    onRateLimitPause: () => void;
    onRateLimitResume: () => void;
}
export interface IRequestQueueItem {
    opts: IRequestOptionsInternal;
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}
export declare class RequestQueue {
    private options;
    private queue;
    private limitCount;
    private expires;
    private timeoutId;
    constructor(options: IRequestQueueOptions);
    enqueue(opts: IRequestOptionsInternal): Promise<void>;
    dequeue(): IRequestQueueItem;
    paused(): boolean;
    private _processQueue;
    private _schedule;
    private _resetTimeout;
    private _execute;
    private _checkHeaders;
}
