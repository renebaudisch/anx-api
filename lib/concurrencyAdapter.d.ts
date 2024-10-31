import { IRequestOptionsInternal } from './api';
export interface IConcurrencyQueueOptions {
    limit: number;
    request: (opts: any) => any;
}
export declare class ConcurrencyQueue {
    private options;
    private queue;
    private running;
    constructor(options: IConcurrencyQueueOptions);
    push(opts: IRequestOptionsInternal): Promise<any>;
    private finished;
    private makeRequest;
}
export declare const concurrencyAdapter: (options: IConcurrencyQueueOptions) => (opts: IRequestOptionsInternal) => Promise<any>;
