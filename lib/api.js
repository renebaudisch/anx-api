"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnxApi = exports.statusOk = void 0;
const _ = __importStar(require("lodash"));
const query = __importStar(require("qs"));
const url_join_1 = __importDefault(require("url-join"));
const axiosAdapter_1 = require("./axiosAdapter");
const concurrencyAdapter_1 = require("./concurrencyAdapter");
const errors = __importStar(require("./errors"));
const rateLimitAdapter_1 = require("./rateLimitAdapter");
const packageJson = require('../package.json');
const DEFAULT_CHUNK_SIZE = 100;
function _hasValue(value) {
    return !(_.isNull(value) || _.isUndefined(value));
}
function _isInteger(value) {
    return parseInt(value, 10) === +value;
}
function _normalizeOpts(opts, extendOpts) {
    const newOpts = _.isString(opts)
        ? {
            uri: opts,
        }
        : opts || {};
    return _.assign({ method: null }, newOpts, extendOpts);
}
function statusOk(body) {
    return !!body && !!body.response && body.response.status === 'OK';
}
exports.statusOk = statusOk;
function __request(opts) {
    const _self = this;
    return new Promise((resolve, reject) => {
        const startTime = new Date().getTime();
        if (_.isEmpty(_self._config.target)) {
            return reject(new errors.TargetError('Target not set', null));
        }
        // Validate Opts
        _.forEach(_.pick(opts, ['startElement', 'numElements']), (value, opt) => {
            if (_hasValue(value) && !_isInteger(value)) {
                return reject(new errors.ArgumentError(opts, 'Invalid ' + opt));
            }
            return null;
        });
        // Configure Options
        let reqOpts = {
            method: opts.method || 'GET',
            uri: (0, url_join_1.default)(_self._config.target, _.trimStart(opts.uri, '/')),
            timeout: opts.timeout || _self._config.timeout,
            rejectUnauthorized: false,
            headers: Object.assign({}, _self._config.headers),
            params: Object.assign({}, opts.params),
            body: opts.body,
            encodeParams: _.get(opts, 'encodeParams', false),
        };
        if (_self._config.userAgent) {
            reqOpts.headers['User-Agent'] = _self._config.userAgent;
        }
        if (!opts.noAuth && !opts.auth && _self._config.token) {
            reqOpts.headers.Authorization = _self._config.token;
        }
        if (opts.mimeType) {
            reqOpts.headers.Accept = opts.mimeType;
            if (opts.method === 'POST' || opts.method === 'PUT') {
                reqOpts.headers['Content-Type'] = opts.mimeType;
            }
        }
        else {
            // Default Accept to application/json
            reqOpts.headers.Accept = _.get(opts, 'headers.Accept', 'application/json');
            // Default Content-Type to application/json for POSTs and PUTs
            if (reqOpts.method === 'POST' || reqOpts.method === 'PUT') {
                reqOpts.headers['Content-Type'] = _.get(opts, 'headers.Content-Type', 'application/json');
            }
        }
        reqOpts.headers = _.assign({}, reqOpts.headers, opts.headers);
        // Configure Parameters
        if (_hasValue(opts.startElement)) {
            reqOpts.params.start_element = (+opts.startElement).toString();
        }
        if (_hasValue(opts.numElements)) {
            reqOpts.params.num_elements = (+opts.numElements).toString();
            reqOpts.params.start_element = (+opts.startElement || reqOpts.params.start_element || 0).toString(); // startElement is required if numElements is set
        }
        const params = query.stringify(reqOpts.params, { encode: reqOpts.encodeParams });
        if (params !== '') {
            reqOpts.uri += !opts.uri.includes('?') ? '?' : '&';
            reqOpts.uri += params;
        }
        if (_self._config.beforeRequest) {
            const beforeRequestOpts = _self._config.beforeRequest(reqOpts);
            if (beforeRequestOpts) {
                reqOpts = _.assign({}, reqOpts, beforeRequestOpts);
            }
        }
        return _self._config
            .request(reqOpts)
            .then((res) => {
            const totalTime = new Date().getTime() - startTime;
            let newRes = _.assign({
                requestTime: res.requestTime || totalTime,
                totalTime: new Date().getTime() - startTime,
            }, res);
            if (_self._config.afterRequest) {
                const afterRequestRes = _self._config.afterRequest(newRes);
                if (afterRequestRes) {
                    newRes = _.assign({}, newRes, afterRequestRes);
                }
            }
            if (newRes.statusCode >= 400) {
                return reject(errors.buildError(null, reqOpts, newRes));
            }
            // Temporary fix
            let errorId;
            let errorCode;
            if (newRes.body && newRes.body.response && newRes.body.response) {
                errorId = newRes.body.response.error_id;
                errorCode = newRes.body.response.error_code;
            }
            if (errorId === 'SYSTEM' && errorCode === 'SERVICE_UNAVAILABLE') {
                return reject(errors.buildError(null, reqOpts, newRes));
            }
            if (errorId === 'SYSTEM' && errorCode === 'UNKNOWN') {
                return reject(errors.buildError(null, reqOpts, newRes));
            }
            newRes.req = reqOpts;
            return resolve(newRes);
        })
            .catch((err) => {
            let newErr = err;
            if (_self._config.afterRequest) {
                newErr = _self._config.afterRequest(err);
            }
            return reject(errors.buildRequestError(newErr, reqOpts));
        });
    });
}
class AnxApi {
    constructor(config) {
        this._config = _.defaults({}, config, {
            request: (0, axiosAdapter_1.axiosAdapter)({
                forceHttpAdaptor: config.environment === 'node',
            }),
            userAgent: 'anx-api/' + packageJson.version,
            timeout: 60 * 1000,
            headers: {},
            target: null,
            token: null,
            rateLimiting: true,
            chunkSize: DEFAULT_CHUNK_SIZE,
        });
        this.request = __request;
        // Install optional rate limiting adapter
        this.request = this._config.rateLimiting
            ? (0, rateLimitAdapter_1.rateLimitAdapter)(_.assign({}, config, {
                request: __request.bind(this),
            }))
            : __request.bind(this);
        // Install optional concurrency adapter
        this._config.request = this._config.concurrencyLimit
            ? (0, concurrencyAdapter_1.concurrencyAdapter)({
                limit: this._config.concurrencyLimit,
                request: this._config.request,
            })
            : this._config.request;
    }
    _request(method, opts, extendOpts, payload) {
        const newOpts = _normalizeOpts(opts, extendOpts);
        newOpts.method = method || newOpts.method || 'GET';
        if (payload) {
            newOpts.body = payload;
        }
        return this.request(newOpts);
    }
    request(opts, extendOpts) {
        return this._request(null, opts, extendOpts);
    }
    get(opts, extendOpts) {
        return this._request('GET', opts, extendOpts);
    }
    getAll(opts, extendOpts) {
        return new Promise((resolve, reject) => {
            const newOpts = _normalizeOpts(opts, extendOpts);
            let numElements = opts.numElements || 100;
            let firstOutputTerm;
            let elements = [];
            let totalTime = 0;
            const getAll = (startElement) => {
                newOpts.startElement = startElement;
                newOpts.numElements = numElements;
                return this.get(newOpts)
                    .then((res) => {
                    if (!statusOk(res.body)) {
                        return reject(res);
                    }
                    const response = res.body.response;
                    const count = response.count || 0;
                    const outputTerm = response.dbg_info.output_term;
                    if (!firstOutputTerm) {
                        firstOutputTerm = outputTerm;
                    }
                    numElements = response.num_elements;
                    totalTime += response.dbg_info.time || 0;
                    elements = elements.concat(response[outputTerm]);
                    if (count <= startElement + numElements) {
                        const newResponse = _.assign({}, {
                            count: elements.length,
                            start_element: 0,
                            num_elements: elements.length,
                            dbg_info: _.assign({}, response.dbg_info, {
                                output_term: firstOutputTerm,
                                time: totalTime,
                            }),
                        });
                        newResponse[firstOutputTerm] = elements;
                        return resolve({ body: { response: newResponse } });
                    }
                    return getAll(startElement + numElements);
                })
                    .catch(reject);
            };
            return getAll(0);
        });
    }
    post(opts, payload, extendOpts) {
        return this._request('POST', opts, extendOpts, payload);
    }
    put(opts, payload, extendOpts) {
        return this._request('PUT', opts, extendOpts, payload);
    }
    delete(opts, extendOpts) {
        return this._request('DELETE', opts, extendOpts);
    }
    login(username, password) {
        const reqOpts = {
            auth: {
                username,
                password,
            },
        };
        return this.post('/auth', reqOpts).then((res) => {
            if (res.statusCode === 200 && statusOk(res.body)) {
                this._config.token = res.body.response.token;
                return this._config.token;
            }
            throw errors.buildError(null, reqOpts, res);
        });
    }
    switchUser(userId) {
        return this.post('/auth', {
            auth: {
                switch_to_user: userId,
            },
        });
    }
}
exports.AnxApi = AnxApi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUM1QiwwQ0FBNEI7QUFDNUIsd0RBQStCO0FBRS9CLGlEQUE4QztBQUM5Qyw2REFBMEQ7QUFDMUQsaURBQW1DO0FBQ25DLHlEQUFzRDtBQUt0RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUUvQyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztBQW9EL0IsU0FBUyxTQUFTLENBQUMsS0FBVTtJQUM1QixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsS0FBVTtJQUM3QixPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDdkMsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQThCLEVBQUUsVUFBMkI7SUFDbEYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDL0IsQ0FBQyxDQUFDO1lBQ0EsR0FBRyxFQUFFLElBQUk7U0FDUjtRQUNILENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ2QsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLElBQUk7SUFDNUIsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxL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TyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDL0MsSUFBSSxHQUFHLENBQUMsVUFBVSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNqRCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQzdDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7YUFDMUI7WUFDRCxNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFTSxVQUFVLENBQUMsTUFBYztRQUMvQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ3pCLElBQUksRUFBRTtnQkFDTCxjQUFjLEVBQUUsTUFBTTthQUN0QjtTQUNELENBQUMsQ0FBQztJQUNKLENBQUM7Q0FDRDtBQTlJRCx3QkE4SUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBxdWVyeSBmcm9tICdxcyc7XG5pbXBvcnQgdXJsSm9pbiBmcm9tICd1cmwtam9pbic7XG5cbmltcG9ydCB7IGF4aW9zQWRhcHRlciB9IGZyb20gJy4vYXhpb3NBZGFwdGVyJztcbmltcG9ydCB7IGNvbmN1cnJlbmN5QWRhcHRlciB9IGZyb20gJy4vY29uY3VycmVuY3lBZGFwdGVyJztcbmltcG9ydCAqIGFzIGVycm9ycyBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQgeyByYXRlTGltaXRBZGFwdGVyIH0gZnJvbSAnLi9yYXRlTGltaXRBZGFwdGVyJztcbmltcG9ydCB7IElSZXNwb25zZSB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgdHlwZSBNZXRob2QgPSAnZ2V0JyB8ICdHRVQnIHwgJ2RlbGV0ZScgfCAnREVMRVRFJyB8ICdoZWFkJyB8ICdIRUFEJyB8ICdvcHRpb25zJyB8ICdPUFRJT05TJyB8ICdwb3N0JyB8ICdQT1NUJyB8ICdwdXQnIHwgJ1BVVCcgfCAncGF0Y2gnIHwgJ1BBVENIJztcblxuY29uc3QgcGFja2FnZUpzb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKTtcblxuY29uc3QgREVGQVVMVF9DSFVOS19TSVpFID0gMTAwO1xuXG5leHBvcnQgaW50ZXJmYWNlIElDb25maWcge1xuXHRjb25jdXJyZW5jeUxpbWl0PzogbnVtYmVyO1xuXHRlbnZpcm9ubWVudD86IHN0cmluZztcblx0cmF0ZUxpbWl0aW5nOiBib29sZWFuO1xuXHRyZXF1ZXN0PzogKG9wdHM6IElHZW5lcmljT3B0aW9ucykgPT4gUHJvbWlzZTxJUmVzcG9uc2U+O1xuXHRiZWZvcmVSZXF1ZXN0PzogKG9wdHM6IGFueSkgPT4gYW55O1xuXHRhZnRlclJlcXVlc3Q/OiAob3B0czogYW55KSA9PiBhbnk7XG5cdHRhcmdldDogc3RyaW5nO1xuXHR0aW1lb3V0PzogbnVtYmVyO1xuXHR0b2tlbj86IHN0cmluZztcblx0dXNlckFnZW50Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElHZW5lcmljT3B0aW9ucyB7XG5cdGF1dGg/OiBhbnk7XG5cdGVuY29kZVBhcmFtcz86IGJvb2xlYW47XG5cdGhlYWRlcnM/OiB7fTtcblx0bWltZVR5cGU/OiBzdHJpbmc7XG5cdG5vQXV0aD86IGFueTtcblx0bnVtRWxlbWVudHM/OiBudW1iZXI7XG5cdHBhcmFtcz86IHt9O1xuXHRzdGFydEVsZW1lbnQ/OiBudW1iZXI7XG5cdHRpbWVvdXQ/OiBudW1iZXI7XG5cdHVyaTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElPcHRpb25zV2l0aFBheWxvYWQgZXh0ZW5kcyBJR2VuZXJpY09wdGlvbnMge1xuXHRib2R5PzogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElSZXF1ZXN0T3B0aW9ucyBleHRlbmRzIElPcHRpb25zV2l0aFBheWxvYWQge1xuXHRtZXRob2Q6IE1ldGhvZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUmVxdWVzdE9wdGlvbnNJbnRlcm5hbCB7XG5cdGF1dGg/OiBib29sZWFuO1xuXHRib2R5OiBvYmplY3Q7XG5cdGVuY29kZVBhcmFtczogYm9vbGVhbjtcblx0aGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblx0bWV0aG9kOiBNZXRob2Q7XG5cdG1pbWVUeXBlPzogc3RyaW5nO1xuXHRub0F1dGg/OiBib29sZWFuO1xuXHRudW1FbGVtZW50cz86IG51bWJlcjtcblx0cGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXHRyZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG5cdHN0YXJ0RWxlbWVudD86IG51bWJlcjtcblx0dGltZW91dDogbnVtYmVyO1xuXHR1cmk6IHN0cmluZztcbn1cblxuZnVuY3Rpb24gX2hhc1ZhbHVlKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcblx0cmV0dXJuICEoXy5pc051bGwodmFsdWUpIHx8IF8uaXNVbmRlZmluZWQodmFsdWUpKTtcbn1cblxuZnVuY3Rpb24gX2lzSW50ZWdlcih2YWx1ZTogYW55KTogYm9vbGVhbiB7XG5cdHJldHVybiBwYXJzZUludCh2YWx1ZSwgMTApID09PSArdmFsdWU7XG59XG5cbmZ1bmN0aW9uIF9ub3JtYWxpemVPcHRzKG9wdHM6IElHZW5lcmljT3B0aW9ucyB8IHN0cmluZywgZXh0ZW5kT3B0czogSUdlbmVyaWNPcHRpb25zKTogSVJlcXVlc3RPcHRpb25zIHtcblx0Y29uc3QgbmV3T3B0cyA9IF8uaXNTdHJpbmcob3B0cylcblx0XHQ/IHtcblx0XHRcdFx0dXJpOiBvcHRzLFxuXHRcdCAgfVxuXHRcdDogb3B0cyB8fCB7fTtcblx0cmV0dXJuIF8uYXNzaWduKHsgbWV0aG9kOiBudWxsIH0sIG5ld09wdHMsIGV4dGVuZE9wdHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhdHVzT2soYm9keSkge1xuXHRyZXR1cm4gISFib2R5ICYmICEhYm9keS5yZXNwb25zZSAmJiBib2R5LnJlc3BvbnNlLnN0YXR1cyA9PT0gJ09LJztcbn1cblxuZnVuY3Rpb24gX19yZXF1ZXN0KG9wdHM6IElSZXF1ZXN0T3B0aW9uc0ludGVybmFsKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0Y29uc3QgX3NlbGYgPSB0aGlzO1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG5cdFx0aWYgKF8uaXNFbXB0eShfc2VsZi5fY29uZmlnLnRhcmdldCkpIHtcblx0XHRcdHJldHVybiByZWplY3QobmV3IGVycm9ycy5UYXJnZXRFcnJvcignVGFyZ2V0IG5vdCBzZXQnLCBudWxsKSk7XG5cdFx0fVxuXG5cdFx0Ly8gVmFsaWRhdGUgT3B0c1xuXHRcdF8uZm9yRWFjaChfLnBpY2sob3B0cywgWydzdGFydEVsZW1lbnQnLCAnbnVtRWxlbWVudHMnXSksICh2YWx1ZSwgb3B0KSA9PiB7XG5cdFx0XHRpZiAoX2hhc1ZhbHVlKHZhbHVlKSAmJiAhX2lzSW50ZWdlcih2YWx1ZSkpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChuZXcgZXJyb3JzLkFyZ3VtZW50RXJyb3Iob3B0cywgJ0ludmFsaWQgJyArIG9wdCkpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSk7XG5cblx0XHQvLyBDb25maWd1cmUgT3B0aW9uc1xuXHRcdGxldCByZXFPcHRzOiBJUmVxdWVzdE9wdGlvbnNJbnRlcm5hbCA9IHtcblx0XHRcdG1ldGhvZDogb3B0cy5tZXRob2QgfHwgJ0dFVCcsXG5cdFx0XHR1cmk6IHVybEpvaW4oX3NlbGYuX2NvbmZpZy50YXJnZXQsIF8udHJpbVN0YXJ0KG9wdHMudXJpLCAnLycpKSxcblx0XHRcdHRpbWVvdXQ6IG9wdHMudGltZW91dCB8fCBfc2VsZi5fY29uZmlnLnRpbWVvdXQsXG5cdFx0XHRyZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlLFxuXHRcdFx0aGVhZGVyczogeyAuLi5fc2VsZi5fY29uZmlnLmhlYWRlcnMgfSxcblx0XHRcdHBhcmFtczogeyAuLi5vcHRzLnBhcmFtcyB9LFxuXHRcdFx0Ym9keTogb3B0cy5ib2R5LFxuXHRcdFx0ZW5jb2RlUGFyYW1zOiBfLmdldChvcHRzLCAnZW5jb2RlUGFyYW1zJywgZmFsc2UpLFxuXHRcdH07XG5cblx0XHRpZiAoX3NlbGYuX2NvbmZpZy51c2VyQWdlbnQpIHtcblx0XHRcdHJlcU9wdHMuaGVhZGVyc1snVXNlci1BZ2VudCddID0gX3NlbGYuX2NvbmZpZy51c2VyQWdlbnQ7XG5cdFx0fVxuXG5cdFx0aWYgKCFvcHRzLm5vQXV0aCAmJiAhb3B0cy5hdXRoICYmIF9zZWxmLl9jb25maWcudG9rZW4pIHtcblx0XHRcdHJlcU9wdHMuaGVhZGVycy5BdXRob3JpemF0aW9uID0gX3NlbGYuX2NvbmZpZy50b2tlbjtcblx0XHR9XG5cblx0XHRpZiAob3B0cy5taW1lVHlwZSkge1xuXHRcdFx0cmVxT3B0cy5oZWFkZXJzLkFjY2VwdCA9IG9wdHMubWltZVR5cGU7XG5cdFx0XHRpZiAob3B0cy5tZXRob2QgPT09ICdQT1NUJyB8fCBvcHRzLm1ldGhvZCA9PT0gJ1BVVCcpIHtcblx0XHRcdFx0cmVxT3B0cy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9IG9wdHMubWltZVR5cGU7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIERlZmF1bHQgQWNjZXB0IHRvIGFwcGxpY2F0aW9uL2pzb25cblx0XHRcdHJlcU9wdHMuaGVhZGVycy5BY2NlcHQgPSBfLmdldChvcHRzLCAnaGVhZGVycy5BY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG5cdFx0XHQvLyBEZWZhdWx0IENvbnRlbnQtVHlwZSB0byBhcHBsaWNhdGlvbi9qc29uIGZvciBQT1NUcyBhbmQgUFVUc1xuXHRcdFx0aWYgKHJlcU9wdHMubWV0aG9kID09PSAnUE9TVCcgfHwgcmVxT3B0cy5tZXRob2QgPT09ICdQVVQnKSB7XG5cdFx0XHRcdHJlcU9wdHMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSBfLmdldChvcHRzLCAnaGVhZGVycy5Db250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJlcU9wdHMuaGVhZGVycyA9IF8uYXNzaWduKHt9LCByZXFPcHRzLmhlYWRlcnMsIG9wdHMuaGVhZGVycyk7XG5cblx0XHQvLyBDb25maWd1cmUgUGFyYW1ldGVyc1xuXHRcdGlmIChfaGFzVmFsdWUob3B0cy5zdGFydEVsZW1lbnQpKSB7XG5cdFx0XHRyZXFPcHRzLnBhcmFtcy5zdGFydF9lbGVtZW50ID0gKCtvcHRzLnN0YXJ0RWxlbWVudCkudG9TdHJpbmcoKTtcblx0XHR9XG5cdFx0aWYgKF9oYXNWYWx1ZShvcHRzLm51bUVsZW1lbnRzKSkge1xuXHRcdFx0cmVxT3B0cy5wYXJhbXMubnVtX2VsZW1lbnRzID0gKCtvcHRzLm51bUVsZW1lbnRzKS50b1N0cmluZygpO1xuXHRcdFx0cmVxT3B0cy5wYXJhbXMuc3RhcnRfZWxlbWVudCA9ICgrb3B0cy5zdGFydEVsZW1lbnQgfHwgcmVxT3B0cy5wYXJhbXMuc3RhcnRfZWxlbWVudCB8fCAwKS50b1N0cmluZygpOyAvLyBzdGFydEVsZW1lbnQgaXMgcmVxdWlyZWQgaWYgbnVtRWxlbWVudHMgaXMgc2V0XG5cdFx0fVxuXG5cdFx0Y29uc3QgcGFyYW1zID0gcXVlcnkuc3RyaW5naWZ5KHJlcU9wdHMucGFyYW1zLCB7IGVuY29kZTogcmVxT3B0cy5lbmNvZGVQYXJhbXMgfSk7XG5cblx0XHRpZiAocGFyYW1zICE9PSAnJykge1xuXHRcdFx0cmVxT3B0cy51cmkgKz0gIW9wdHMudXJpLmluY2x1ZGVzKCc/JykgPyAnPycgOiAnJic7XG5cdFx0XHRyZXFPcHRzLnVyaSArPSBwYXJhbXM7XG5cdFx0fVxuXG5cdFx0aWYgKF9zZWxmLl9jb25maWcuYmVmb3JlUmVxdWVzdCkge1xuXHRcdFx0Y29uc3QgYmVmb3JlUmVxdWVzdE9wdHMgPSBfc2VsZi5fY29uZmlnLmJlZm9yZVJlcXVlc3QocmVxT3B0cyk7XG5cdFx0XHRpZiAoYmVmb3JlUmVxdWVzdE9wdHMpIHtcblx0XHRcdFx0cmVxT3B0cyA9IF8uYXNzaWduKHt9LCByZXFPcHRzLCBiZWZvcmVSZXF1ZXN0T3B0cyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIF9zZWxmLl9jb25maWdcblx0XHRcdC5yZXF1ZXN0KHJlcU9wdHMpXG5cdFx0XHQudGhlbigocmVzKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHRvdGFsVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lO1xuXG5cdFx0XHRcdGxldCBuZXdSZXM6IElSZXNwb25zZSA9IF8uYXNzaWduKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHJlcXVlc3RUaW1lOiByZXMucmVxdWVzdFRpbWUgfHwgdG90YWxUaW1lLFxuXHRcdFx0XHRcdFx0dG90YWxUaW1lOiBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHJlcyxcblx0XHRcdFx0KTtcblxuXHRcdFx0XHRpZiAoX3NlbGYuX2NvbmZpZy5hZnRlclJlcXVlc3QpIHtcblx0XHRcdFx0XHRjb25zdCBhZnRlclJlcXVlc3RSZXMgPSBfc2VsZi5fY29uZmlnLmFmdGVyUmVxdWVzdChuZXdSZXMpO1xuXHRcdFx0XHRcdGlmIChhZnRlclJlcXVlc3RSZXMpIHtcblx0XHRcdFx0XHRcdG5ld1JlcyA9IF8uYXNzaWduKHt9LCBuZXdSZXMsIGFmdGVyUmVxdWVzdFJlcyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKG5ld1Jlcy5zdGF0dXNDb2RlID49IDQwMCkge1xuXHRcdFx0XHRcdHJldHVybiByZWplY3QoZXJyb3JzLmJ1aWxkRXJyb3IobnVsbCwgcmVxT3B0cywgbmV3UmVzKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBUZW1wb3JhcnkgZml4XG5cdFx0XHRcdGxldCBlcnJvcklkO1xuXHRcdFx0XHRsZXQgZXJyb3JDb2RlO1xuXHRcdFx0XHRpZiAobmV3UmVzLmJvZHkgJiYgbmV3UmVzLmJvZHkucmVzcG9uc2UgJiYgbmV3UmVzLmJvZHkucmVzcG9uc2UpIHtcblx0XHRcdFx0XHRlcnJvcklkID0gbmV3UmVzLmJvZHkucmVzcG9uc2UuZXJyb3JfaWQ7XG5cdFx0XHRcdFx0ZXJyb3JDb2RlID0gbmV3UmVzLmJvZHkucmVzcG9uc2UuZXJyb3JfY29kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZXJyb3JJZCA9PT0gJ1NZU1RFTScgJiYgZXJyb3JDb2RlID09PSAnU0VSVklDRV9VTkFWQUlMQUJMRScpIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGVycm9ycy5idWlsZEVycm9yKG51bGwsIHJlcU9wdHMsIG5ld1JlcykpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChlcnJvcklkID09PSAnU1lTVEVNJyAmJiBlcnJvckNvZGUgPT09ICdVTktOT1dOJykge1xuXHRcdFx0XHRcdHJldHVybiByZWplY3QoZXJyb3JzLmJ1aWxkRXJyb3IobnVsbCwgcmVxT3B0cywgbmV3UmVzKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRuZXdSZXMucmVxID0gcmVxT3B0cztcblxuXHRcdFx0XHRyZXR1cm4gcmVzb2x2ZShuZXdSZXMpO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdGxldCBuZXdFcnIgPSBlcnI7XG5cdFx0XHRcdGlmIChfc2VsZi5fY29uZmlnLmFmdGVyUmVxdWVzdCkge1xuXHRcdFx0XHRcdG5ld0VyciA9IF9zZWxmLl9jb25maWcuYWZ0ZXJSZXF1ZXN0KGVycik7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHJlamVjdChlcnJvcnMuYnVpbGRSZXF1ZXN0RXJyb3IobmV3RXJyLCByZXFPcHRzKSk7XG5cdFx0XHR9KTtcblx0fSk7XG59XG5cbmV4cG9ydCBjbGFzcyBBbnhBcGkge1xuXHRwdWJsaWMgX2NvbmZpZzogSUNvbmZpZztcblxuXHRjb25zdHJ1Y3Rvcihjb25maWc6IElDb25maWcpIHtcblx0XHR0aGlzLl9jb25maWcgPSBfLmRlZmF1bHRzKHt9LCBjb25maWcsIHtcblx0XHRcdHJlcXVlc3Q6IGF4aW9zQWRhcHRlcih7XG5cdFx0XHRcdGZvcmNlSHR0cEFkYXB0b3I6IGNvbmZpZy5lbnZpcm9ubWVudCA9PT0gJ25vZGUnLFxuXHRcdFx0fSksXG5cdFx0XHR1c2VyQWdlbnQ6ICdhbngtYXBpLycgKyBwYWNrYWdlSnNvbi52ZXJzaW9uLFxuXHRcdFx0dGltZW91dDogNjAgKiAxMDAwLFxuXHRcdFx0aGVhZGVyczoge30sXG5cdFx0XHR0YXJnZXQ6IG51bGwsXG5cdFx0XHR0b2tlbjogbnVsbCxcblx0XHRcdHJhdGVMaW1pdGluZzogdHJ1ZSxcblx0XHRcdGNodW5rU2l6ZTogREVGQVVMVF9DSFVOS19TSVpFLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5yZXF1ZXN0ID0gX19yZXF1ZXN0O1xuXG5cdFx0Ly8gSW5zdGFsbCBvcHRpb25hbCByYXRlIGxpbWl0aW5nIGFkYXB0ZXJcblx0XHR0aGlzLnJlcXVlc3QgPSB0aGlzLl9jb25maWcucmF0ZUxpbWl0aW5nXG5cdFx0XHQ/IHJhdGVMaW1pdEFkYXB0ZXIoXG5cdFx0XHRcdFx0Xy5hc3NpZ24oe30sIGNvbmZpZywge1xuXHRcdFx0XHRcdFx0cmVxdWVzdDogX19yZXF1ZXN0LmJpbmQodGhpcyksXG5cdFx0XHRcdFx0fSksXG5cdFx0XHQgIClcblx0XHRcdDogX19yZXF1ZXN0LmJpbmQodGhpcyk7XG5cblx0XHQvLyBJbnN0YWxsIG9wdGlvbmFsIGNvbmN1cnJlbmN5IGFkYXB0ZXJcblx0XHR0aGlzLl9jb25maWcucmVxdWVzdCA9IHRoaXMuX2NvbmZpZy5jb25jdXJyZW5jeUxpbWl0XG5cdFx0XHQ/IGNvbmN1cnJlbmN5QWRhcHRlcih7XG5cdFx0XHRcdFx0bGltaXQ6IHRoaXMuX2NvbmZpZy5jb25jdXJyZW5jeUxpbWl0LFxuXHRcdFx0XHRcdHJlcXVlc3Q6IHRoaXMuX2NvbmZpZy5yZXF1ZXN0LFxuXHRcdFx0ICB9KVxuXHRcdFx0OiB0aGlzLl9jb25maWcucmVxdWVzdDtcblx0fVxuXG5cdHB1YmxpYyBfcmVxdWVzdChtZXRob2Q6IE1ldGhvZCwgb3B0czogSUdlbmVyaWNPcHRpb25zIHwgc3RyaW5nLCBleHRlbmRPcHRzOiBJR2VuZXJpY09wdGlvbnMsIHBheWxvYWQ/KTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRjb25zdCBuZXdPcHRzID0gX25vcm1hbGl6ZU9wdHMob3B0cywgZXh0ZW5kT3B0cyk7XG5cdFx0bmV3T3B0cy5tZXRob2QgPSBtZXRob2QgfHwgbmV3T3B0cy5tZXRob2QgfHwgJ0dFVCc7XG5cdFx0aWYgKHBheWxvYWQpIHtcblx0XHRcdG5ld09wdHMuYm9keSA9IHBheWxvYWQ7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnJlcXVlc3QobmV3T3B0cyk7XG5cdH1cblxuXHRwdWJsaWMgcmVxdWVzdChvcHRzOiBJUmVxdWVzdE9wdGlvbnMsIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLl9yZXF1ZXN0KG51bGwsIG9wdHMsIGV4dGVuZE9wdHMpO1xuXHR9XG5cblx0cHVibGljIGdldChvcHRzOiBJR2VuZXJpY09wdGlvbnMgfCBzdHJpbmcsIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLl9yZXF1ZXN0KCdHRVQnLCBvcHRzLCBleHRlbmRPcHRzKTtcblx0fVxuXG5cdHB1YmxpYyBnZXRBbGwob3B0czogSUdlbmVyaWNPcHRpb25zLCBleHRlbmRPcHRzKTogUHJvbWlzZTxhbnk+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3T3B0cyA9IF9ub3JtYWxpemVPcHRzKG9wdHMsIGV4dGVuZE9wdHMpO1xuXHRcdFx0bGV0IG51bUVsZW1lbnRzID0gb3B0cy5udW1FbGVtZW50cyB8fCAxMDA7XG5cdFx0XHRsZXQgZmlyc3RPdXRwdXRUZXJtO1xuXHRcdFx0bGV0IGVsZW1lbnRzID0gW107XG5cdFx0XHRsZXQgdG90YWxUaW1lID0gMDtcblxuXHRcdFx0Y29uc3QgZ2V0QWxsID0gKHN0YXJ0RWxlbWVudCkgPT4ge1xuXHRcdFx0XHRuZXdPcHRzLnN0YXJ0RWxlbWVudCA9IHN0YXJ0RWxlbWVudDtcblx0XHRcdFx0bmV3T3B0cy5udW1FbGVtZW50cyA9IG51bUVsZW1lbnRzO1xuXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldChuZXdPcHRzKVxuXHRcdFx0XHRcdC50aGVuKChyZXMpID0+IHtcblx0XHRcdFx0XHRcdGlmICghc3RhdHVzT2socmVzLmJvZHkpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZWplY3QocmVzKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnN0IHJlc3BvbnNlID0gcmVzLmJvZHkucmVzcG9uc2U7XG5cdFx0XHRcdFx0XHRjb25zdCBjb3VudCA9IHJlc3BvbnNlLmNvdW50IHx8IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBvdXRwdXRUZXJtID0gcmVzcG9uc2UuZGJnX2luZm8ub3V0cHV0X3Rlcm07XG5cdFx0XHRcdFx0XHRpZiAoIWZpcnN0T3V0cHV0VGVybSkge1xuXHRcdFx0XHRcdFx0XHRmaXJzdE91dHB1dFRlcm0gPSBvdXRwdXRUZXJtO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRudW1FbGVtZW50cyA9IHJlc3BvbnNlLm51bV9lbGVtZW50cztcblxuXHRcdFx0XHRcdFx0dG90YWxUaW1lICs9IHJlc3BvbnNlLmRiZ19pbmZvLnRpbWUgfHwgMDtcblx0XHRcdFx0XHRcdGVsZW1lbnRzID0gZWxlbWVudHMuY29uY2F0KHJlc3BvbnNlW291dHB1dFRlcm1dKTtcblx0XHRcdFx0XHRcdGlmIChjb3VudCA8PSBzdGFydEVsZW1lbnQgKyBudW1FbGVtZW50cykge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBuZXdSZXNwb25zZSA9IF8uYXNzaWduKFxuXHRcdFx0XHRcdFx0XHRcdHt9LFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvdW50OiBlbGVtZW50cy5sZW5ndGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRzdGFydF9lbGVtZW50OiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0bnVtX2VsZW1lbnRzOiBlbGVtZW50cy5sZW5ndGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRkYmdfaW5mbzogXy5hc3NpZ24oe30sIHJlc3BvbnNlLmRiZ19pbmZvLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG91dHB1dF90ZXJtOiBmaXJzdE91dHB1dFRlcm0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRpbWU6IHRvdGFsVGltZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdG5ld1Jlc3BvbnNlW2ZpcnN0T3V0cHV0VGVybV0gPSBlbGVtZW50cztcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJlc29sdmUoeyBib2R5OiB7IHJlc3BvbnNlOiBuZXdSZXNwb25zZSB9IH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIGdldEFsbChzdGFydEVsZW1lbnQgKyBudW1FbGVtZW50cyk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2gocmVqZWN0KTtcblx0XHRcdH07XG5cblx0XHRcdHJldHVybiBnZXRBbGwoMCk7XG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgcG9zdChvcHRzOiBJT3B0aW9uc1dpdGhQYXlsb2FkIHwgc3RyaW5nLCBwYXlsb2FkLCBleHRlbmRPcHRzPzogSUdlbmVyaWNPcHRpb25zKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5fcmVxdWVzdCgnUE9TVCcsIG9wdHMsIGV4dGVuZE9wdHMsIHBheWxvYWQpO1xuXHR9XG5cblx0cHVibGljIHB1dChvcHRzOiBJT3B0aW9uc1dpdGhQYXlsb2FkIHwgc3RyaW5nLCBwYXlsb2FkLCBleHRlbmRPcHRzPzogSUdlbmVyaWNPcHRpb25zKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5fcmVxdWVzdCgnUFVUJywgb3B0cywgZXh0ZW5kT3B0cywgcGF5bG9hZCk7XG5cdH1cblxuXHRwdWJsaWMgZGVsZXRlKG9wdHM6IElHZW5lcmljT3B0aW9ucyB8IHN0cmluZywgZXh0ZW5kT3B0cz86IElHZW5lcmljT3B0aW9ucyk6IFByb21pc2U8SVJlc3BvbnNlPiB7XG5cdFx0cmV0dXJuIHRoaXMuX3JlcXVlc3QoJ0RFTEVURScsIG9wdHMsIGV4dGVuZE9wdHMpO1xuXHR9XG5cblx0cHVibGljIGxvZ2luKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGNvbnN0IHJlcU9wdHMgPSB7XG5cdFx0XHRhdXRoOiB7XG5cdFx0XHRcdHVzZXJuYW1lLFxuXHRcdFx0XHRwYXNzd29yZCxcblx0XHRcdH0sXG5cdFx0fTtcblx0XHRyZXR1cm4gdGhpcy5wb3N0KCcvYXV0aCcsIHJlcU9wdHMpLnRoZW4oKHJlcykgPT4ge1xuXHRcdFx0aWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDAgJiYgc3RhdHVzT2socmVzLmJvZHkpKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZy50b2tlbiA9IHJlcy5ib2R5LnJlc3BvbnNlLnRva2VuO1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLnRva2VuO1xuXHRcdFx0fVxuXHRcdFx0dGhyb3cgZXJyb3JzLmJ1aWxkRXJyb3IobnVsbCwgcmVxT3B0cywgcmVzKTtcblx0XHR9KTtcblx0fVxuXG5cdHB1YmxpYyBzd2l0Y2hVc2VyKHVzZXJJZDogbnVtYmVyKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5wb3N0KCcvYXV0aCcsIHtcblx0XHRcdGF1dGg6IHtcblx0XHRcdFx0c3dpdGNoX3RvX3VzZXI6IHVzZXJJZCxcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH1cbn1cbiJdfQ==