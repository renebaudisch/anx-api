import { IRequestOptionsInternal } from './api';
import { IResponse } from './types';
export interface IRateLimitAdapterOptions {
    request: (opts: IRequestOptionsInternal) => Promise<IResponse>;
    rateLimitRead?: number;
    rateLimitReadSeconds?: number;
    rateLimitWrite?: number;
    rateLimitWriteSeconds?: number;
    onRateLimitExceeded?: (err: any) => any;
    onRateLimitPause?: () => any;
    onRateLimitResume?: () => any;
}
export declare const rateLimitAdapter: (options: IRateLimitAdapterOptions) => (opts: IRequestOptionsInternal) => Promise<void>;
