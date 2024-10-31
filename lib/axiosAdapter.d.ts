import { IRequestOptionsInternal } from './api';
import { IResponse } from './types';
export declare const axiosAdapter: (config: any) => (opts: IRequestOptionsInternal) => Promise<IResponse>;
