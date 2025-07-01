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
    postAll(opts, payload, extendOpts) {
        return new Promise((resolve, reject) => {
            let numElements = opts.numElements || 100;
            let firstOutputTerm = /creative-search/.test(opts.uri) ? 'creatives' : '';
            let elements = [];
            let totalTime = 0;
            const postAll = (startElement) => {
                opts.startElement = startElement;
                opts.numElements = numElements;
                return this.post(opts, payload, extendOpts)
                    .then((res) => {
                    var _a;
                    if (!statusOk(res.body)) {
                        return reject(res);
                    }
                    const response = res.body.response;
                    const count = (_a = response.count) !== null && _a !== void 0 ? _a : 0;
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
                    return postAll(startElement + numElements);
                })
                    .catch(reject);
            };
            return postAll(0);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUM1QiwwQ0FBNEI7QUFDNUIsd0RBQStCO0FBRS9CLGlEQUE4QztBQUM5Qyw2REFBMEQ7QUFDMUQsaURBQW1DO0FBQ25DLHlEQUFzRDtBQUt0RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUUvQyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztBQW9EL0IsU0FBUyxTQUFTLENBQUMsS0FBVTtJQUM1QixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsS0FBVTtJQUM3QixPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDdkMsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQThCLEVBQUUsVUFBMkI7SUFDbEYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDL0IsQ0FBQyxDQUFDO1lBQ0EsR0FBRyxFQUFFLElBQUk7U0FDUjtRQUNILENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ2QsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLElBQUk7SUFDNUIsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxL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LENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztnQkFDN0MsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQzthQUMxQjtZQUNELE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVNLFVBQVUsQ0FBQyxNQUFjO1FBQy9CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDekIsSUFBSSxFQUFFO2dCQUNMLGNBQWMsRUFBRSxNQUFNO2FBQ3RCO1NBQ0QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztDQUNEO0FBbE1ELHdCQWtNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIHF1ZXJ5IGZyb20gJ3FzJztcbmltcG9ydCB1cmxKb2luIGZyb20gJ3VybC1qb2luJztcblxuaW1wb3J0IHsgYXhpb3NBZGFwdGVyIH0gZnJvbSAnLi9heGlvc0FkYXB0ZXInO1xuaW1wb3J0IHsgY29uY3VycmVuY3lBZGFwdGVyIH0gZnJvbSAnLi9jb25jdXJyZW5jeUFkYXB0ZXInO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7IHJhdGVMaW1pdEFkYXB0ZXIgfSBmcm9tICcuL3JhdGVMaW1pdEFkYXB0ZXInO1xuaW1wb3J0IHsgSVJlc3BvbnNlIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCB0eXBlIE1ldGhvZCA9ICdnZXQnIHwgJ0dFVCcgfCAnZGVsZXRlJyB8ICdERUxFVEUnIHwgJ2hlYWQnIHwgJ0hFQUQnIHwgJ29wdGlvbnMnIHwgJ09QVElPTlMnIHwgJ3Bvc3QnIHwgJ1BPU1QnIHwgJ3B1dCcgfCAnUFVUJyB8ICdwYXRjaCcgfCAnUEFUQ0gnO1xuXG5jb25zdCBwYWNrYWdlSnNvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xuXG5jb25zdCBERUZBVUxUX0NIVU5LX1NJWkUgPSAxMDA7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbmZpZyB7XG5cdGNvbmN1cnJlbmN5TGltaXQ/OiBudW1iZXI7XG5cdGVudmlyb25tZW50Pzogc3RyaW5nO1xuXHRyYXRlTGltaXRpbmc6IGJvb2xlYW47XG5cdHJlcXVlc3Q/OiAob3B0czogSUdlbmVyaWNPcHRpb25zKSA9PiBQcm9taXNlPElSZXNwb25zZT47XG5cdGJlZm9yZVJlcXVlc3Q/OiAob3B0czogYW55KSA9PiBhbnk7XG5cdGFmdGVyUmVxdWVzdD86IChvcHRzOiBhbnkpID0+IGFueTtcblx0dGFyZ2V0OiBzdHJpbmc7XG5cdHRpbWVvdXQ/OiBudW1iZXI7XG5cdHRva2VuPzogc3RyaW5nO1xuXHR1c2VyQWdlbnQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdlbmVyaWNPcHRpb25zIHtcblx0YXV0aD86IGFueTtcblx0ZW5jb2RlUGFyYW1zPzogYm9vbGVhbjtcblx0aGVhZGVycz86IHt9O1xuXHRtaW1lVHlwZT86IHN0cmluZztcblx0bm9BdXRoPzogYW55O1xuXHRudW1FbGVtZW50cz86IG51bWJlcjtcblx0cGFyYW1zPzoge307XG5cdHN0YXJ0RWxlbWVudD86IG51bWJlcjtcblx0dGltZW91dD86IG51bWJlcjtcblx0dXJpOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbnNXaXRoUGF5bG9hZCBleHRlbmRzIElHZW5lcmljT3B0aW9ucyB7XG5cdGJvZHk/OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlcXVlc3RPcHRpb25zIGV4dGVuZHMgSU9wdGlvbnNXaXRoUGF5bG9hZCB7XG5cdG1ldGhvZDogTWV0aG9kO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElSZXF1ZXN0T3B0aW9uc0ludGVybmFsIHtcblx0YXV0aD86IGJvb2xlYW47XG5cdGJvZHk6IG9iamVjdDtcblx0ZW5jb2RlUGFyYW1zOiBib29sZWFuO1xuXHRoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXHRtZXRob2Q6IE1ldGhvZDtcblx0bWltZVR5cGU/OiBzdHJpbmc7XG5cdG5vQXV0aD86IGJvb2xlYW47XG5cdG51bUVsZW1lbnRzPzogbnVtYmVyO1xuXHRwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cdHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbjtcblx0c3RhcnRFbGVtZW50PzogbnVtYmVyO1xuXHR0aW1lb3V0OiBudW1iZXI7XG5cdHVyaTogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBfaGFzVmFsdWUodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gIShfLmlzTnVsbCh2YWx1ZSkgfHwgXy5pc1VuZGVmaW5lZCh2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBfaXNJbnRlZ2VyKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcblx0cmV0dXJuIHBhcnNlSW50KHZhbHVlLCAxMCkgPT09ICt2YWx1ZTtcbn1cblxuZnVuY3Rpb24gX25vcm1hbGl6ZU9wdHMob3B0czogSUdlbmVyaWNPcHRpb25zIHwgc3RyaW5nLCBleHRlbmRPcHRzOiBJR2VuZXJpY09wdGlvbnMpOiBJUmVxdWVzdE9wdGlvbnMge1xuXHRjb25zdCBuZXdPcHRzID0gXy5pc1N0cmluZyhvcHRzKVxuXHRcdD8ge1xuXHRcdFx0XHR1cmk6IG9wdHMsXG5cdFx0ICB9XG5cdFx0OiBvcHRzIHx8IHt9O1xuXHRyZXR1cm4gXy5hc3NpZ24oeyBtZXRob2Q6IG51bGwgfSwgbmV3T3B0cywgZXh0ZW5kT3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGF0dXNPayhib2R5KSB7XG5cdHJldHVybiAhIWJvZHkgJiYgISFib2R5LnJlc3BvbnNlICYmIGJvZHkucmVzcG9uc2Uuc3RhdHVzID09PSAnT0snO1xufVxuXG5mdW5jdGlvbiBfX3JlcXVlc3Qob3B0czogSVJlcXVlc3RPcHRpb25zSW50ZXJuYWwpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRjb25zdCBfc2VsZiA9IHRoaXM7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cblx0XHRpZiAoXy5pc0VtcHR5KF9zZWxmLl9jb25maWcudGFyZ2V0KSkge1xuXHRcdFx0cmV0dXJuIHJlamVjdChuZXcgZXJyb3JzLlRhcmdldEVycm9yKCdUYXJnZXQgbm90IHNldCcsIG51bGwpKTtcblx0XHR9XG5cblx0XHQvLyBWYWxpZGF0ZSBPcHRzXG5cdFx0Xy5mb3JFYWNoKF8ucGljayhvcHRzLCBbJ3N0YXJ0RWxlbWVudCcsICdudW1FbGVtZW50cyddKSwgKHZhbHVlLCBvcHQpID0+IHtcblx0XHRcdGlmIChfaGFzVmFsdWUodmFsdWUpICYmICFfaXNJbnRlZ2VyKHZhbHVlKSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KG5ldyBlcnJvcnMuQXJndW1lbnRFcnJvcihvcHRzLCAnSW52YWxpZCAnICsgb3B0KSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9KTtcblxuXHRcdC8vIENvbmZpZ3VyZSBPcHRpb25zXG5cdFx0bGV0IHJlcU9wdHM6IElSZXF1ZXN0T3B0aW9uc0ludGVybmFsID0ge1xuXHRcdFx0bWV0aG9kOiBvcHRzLm1ldGhvZCB8fCAnR0VUJyxcblx0XHRcdHVyaTogdXJsSm9pbihfc2VsZi5fY29uZmlnLnRhcmdldCwgXy50cmltU3RhcnQob3B0cy51cmksICcvJykpLFxuXHRcdFx0dGltZW91dDogb3B0cy50aW1lb3V0IHx8IF9zZWxmLl9jb25maWcudGltZW91dCxcblx0XHRcdHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UsXG5cdFx0XHRoZWFkZXJzOiB7IC4uLl9zZWxmLl9jb25maWcuaGVhZGVycyB9LFxuXHRcdFx0cGFyYW1zOiB7IC4uLm9wdHMucGFyYW1zIH0sXG5cdFx0XHRib2R5OiBvcHRzLmJvZHksXG5cdFx0XHRlbmNvZGVQYXJhbXM6IF8uZ2V0KG9wdHMsICdlbmNvZGVQYXJhbXMnLCBmYWxzZSksXG5cdFx0fTtcblxuXHRcdGlmIChfc2VsZi5fY29uZmlnLnVzZXJBZ2VudCkge1xuXHRcdFx0cmVxT3B0cy5oZWFkZXJzWydVc2VyLUFnZW50J10gPSBfc2VsZi5fY29uZmlnLnVzZXJBZ2VudDtcblx0XHR9XG5cblx0XHRpZiAoIW9wdHMubm9BdXRoICYmICFvcHRzLmF1dGggJiYgX3NlbGYuX2NvbmZpZy50b2tlbikge1xuXHRcdFx0cmVxT3B0cy5oZWFkZXJzLkF1dGhvcml6YXRpb24gPSBfc2VsZi5fY29uZmlnLnRva2VuO1xuXHRcdH1cblxuXHRcdGlmIChvcHRzLm1pbWVUeXBlKSB7XG5cdFx0XHRyZXFPcHRzLmhlYWRlcnMuQWNjZXB0ID0gb3B0cy5taW1lVHlwZTtcblx0XHRcdGlmIChvcHRzLm1ldGhvZCA9PT0gJ1BPU1QnIHx8IG9wdHMubWV0aG9kID09PSAnUFVUJykge1xuXHRcdFx0XHRyZXFPcHRzLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gb3B0cy5taW1lVHlwZTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gRGVmYXVsdCBBY2NlcHQgdG8gYXBwbGljYXRpb24vanNvblxuXHRcdFx0cmVxT3B0cy5oZWFkZXJzLkFjY2VwdCA9IF8uZ2V0KG9wdHMsICdoZWFkZXJzLkFjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cblx0XHRcdC8vIERlZmF1bHQgQ29udGVudC1UeXBlIHRvIGFwcGxpY2F0aW9uL2pzb24gZm9yIFBPU1RzIGFuZCBQVVRzXG5cdFx0XHRpZiAocmVxT3B0cy5tZXRob2QgPT09ICdQT1NUJyB8fCByZXFPcHRzLm1ldGhvZCA9PT0gJ1BVVCcpIHtcblx0XHRcdFx0cmVxT3B0cy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9IF8uZ2V0KG9wdHMsICdoZWFkZXJzLkNvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmVxT3B0cy5oZWFkZXJzID0gXy5hc3NpZ24oe30sIHJlcU9wdHMuaGVhZGVycywgb3B0cy5oZWFkZXJzKTtcblxuXHRcdC8vIENvbmZpZ3VyZSBQYXJhbWV0ZXJzXG5cdFx0aWYgKF9oYXNWYWx1ZShvcHRzLnN0YXJ0RWxlbWVudCkpIHtcblx0XHRcdHJlcU9wdHMucGFyYW1zLnN0YXJ0X2VsZW1lbnQgPSAoK29wdHMuc3RhcnRFbGVtZW50KS50b1N0cmluZygpO1xuXHRcdH1cblx0XHRpZiAoX2hhc1ZhbHVlKG9wdHMubnVtRWxlbWVudHMpKSB7XG5cdFx0XHRyZXFPcHRzLnBhcmFtcy5udW1fZWxlbWVudHMgPSAoK29wdHMubnVtRWxlbWVudHMpLnRvU3RyaW5nKCk7XG5cdFx0XHRyZXFPcHRzLnBhcmFtcy5zdGFydF9lbGVtZW50ID0gKCtvcHRzLnN0YXJ0RWxlbWVudCB8fCByZXFPcHRzLnBhcmFtcy5zdGFydF9lbGVtZW50IHx8IDApLnRvU3RyaW5nKCk7IC8vIHN0YXJ0RWxlbWVudCBpcyByZXF1aXJlZCBpZiBudW1FbGVtZW50cyBpcyBzZXRcblx0XHR9XG5cblx0XHRjb25zdCBwYXJhbXMgPSBxdWVyeS5zdHJpbmdpZnkocmVxT3B0cy5wYXJhbXMsIHsgZW5jb2RlOiByZXFPcHRzLmVuY29kZVBhcmFtcyB9KTtcblxuXHRcdGlmIChwYXJhbXMgIT09ICcnKSB7XG5cdFx0XHRyZXFPcHRzLnVyaSArPSAhb3B0cy51cmkuaW5jbHVkZXMoJz8nKSA/ICc/JyA6ICcmJztcblx0XHRcdHJlcU9wdHMudXJpICs9IHBhcmFtcztcblx0XHR9XG5cblx0XHRpZiAoX3NlbGYuX2NvbmZpZy5iZWZvcmVSZXF1ZXN0KSB7XG5cdFx0XHRjb25zdCBiZWZvcmVSZXF1ZXN0T3B0cyA9IF9zZWxmLl9jb25maWcuYmVmb3JlUmVxdWVzdChyZXFPcHRzKTtcblx0XHRcdGlmIChiZWZvcmVSZXF1ZXN0T3B0cykge1xuXHRcdFx0XHRyZXFPcHRzID0gXy5hc3NpZ24oe30sIHJlcU9wdHMsIGJlZm9yZVJlcXVlc3RPcHRzKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gX3NlbGYuX2NvbmZpZ1xuXHRcdFx0LnJlcXVlc3QocmVxT3B0cylcblx0XHRcdC50aGVuKChyZXMpID0+IHtcblx0XHRcdFx0Y29uc3QgdG90YWxUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWU7XG5cblx0XHRcdFx0bGV0IG5ld1JlczogSVJlc3BvbnNlID0gXy5hc3NpZ24oXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0cmVxdWVzdFRpbWU6IHJlcy5yZXF1ZXN0VGltZSB8fCB0b3RhbFRpbWUsXG5cdFx0XHRcdFx0XHR0b3RhbFRpbWU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cmVzLFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGlmIChfc2VsZi5fY29uZmlnLmFmdGVyUmVxdWVzdCkge1xuXHRcdFx0XHRcdGNvbnN0IGFmdGVyUmVxdWVzdFJlcyA9IF9zZWxmLl9jb25maWcuYWZ0ZXJSZXF1ZXN0KG5ld1Jlcyk7XG5cdFx0XHRcdFx0aWYgKGFmdGVyUmVxdWVzdFJlcykge1xuXHRcdFx0XHRcdFx0bmV3UmVzID0gXy5hc3NpZ24oe30sIG5ld1JlcywgYWZ0ZXJSZXF1ZXN0UmVzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobmV3UmVzLnN0YXR1c0NvZGUgPj0gNDAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlamVjdChlcnJvcnMuYnVpbGRFcnJvcihudWxsLCByZXFPcHRzLCBuZXdSZXMpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFRlbXBvcmFyeSBmaXhcblx0XHRcdFx0bGV0IGVycm9ySWQ7XG5cdFx0XHRcdGxldCBlcnJvckNvZGU7XG5cdFx0XHRcdGlmIChuZXdSZXMuYm9keSAmJiBuZXdSZXMuYm9keS5yZXNwb25zZSAmJiBuZXdSZXMuYm9keS5yZXNwb25zZSkge1xuXHRcdFx0XHRcdGVycm9ySWQgPSBuZXdSZXMuYm9keS5yZXNwb25zZS5lcnJvcl9pZDtcblx0XHRcdFx0XHRlcnJvckNvZGUgPSBuZXdSZXMuYm9keS5yZXNwb25zZS5lcnJvcl9jb2RlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChlcnJvcklkID09PSAnU1lTVEVNJyAmJiBlcnJvckNvZGUgPT09ICdTRVJWSUNFX1VOQVZBSUxBQkxFJykge1xuXHRcdFx0XHRcdHJldHVybiByZWplY3QoZXJyb3JzLmJ1aWxkRXJyb3IobnVsbCwgcmVxT3B0cywgbmV3UmVzKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGVycm9ySWQgPT09ICdTWVNURU0nICYmIGVycm9yQ29kZSA9PT0gJ1VOS05PV04nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlamVjdChlcnJvcnMuYnVpbGRFcnJvcihudWxsLCByZXFPcHRzLCBuZXdSZXMpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG5ld1Jlcy5yZXEgPSByZXFPcHRzO1xuXG5cdFx0XHRcdHJldHVybiByZXNvbHZlKG5ld1Jlcyk7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0bGV0IG5ld0VyciA9IGVycjtcblx0XHRcdFx0aWYgKF9zZWxmLl9jb25maWcuYWZ0ZXJSZXF1ZXN0KSB7XG5cdFx0XHRcdFx0bmV3RXJyID0gX3NlbGYuX2NvbmZpZy5hZnRlclJlcXVlc3QoZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGVycm9ycy5idWlsZFJlcXVlc3RFcnJvcihuZXdFcnIsIHJlcU9wdHMpKTtcblx0XHRcdH0pO1xuXHR9KTtcbn1cblxuZXhwb3J0IGNsYXNzIEFueEFwaSB7XG5cdHB1YmxpYyBfY29uZmlnOiBJQ29uZmlnO1xuXG5cdGNvbnN0cnVjdG9yKGNvbmZpZzogSUNvbmZpZykge1xuXHRcdHRoaXMuX2NvbmZpZyA9IF8uZGVmYXVsdHMoe30sIGNvbmZpZywge1xuXHRcdFx0cmVxdWVzdDogYXhpb3NBZGFwdGVyKHtcblx0XHRcdFx0Zm9yY2VIdHRwQWRhcHRvcjogY29uZmlnLmVudmlyb25tZW50ID09PSAnbm9kZScsXG5cdFx0XHR9KSxcblx0XHRcdHVzZXJBZ2VudDogJ2FueC1hcGkvJyArIHBhY2thZ2VKc29uLnZlcnNpb24sXG5cdFx0XHR0aW1lb3V0OiA2MCAqIDEwMDAsXG5cdFx0XHRoZWFkZXJzOiB7fSxcblx0XHRcdHRhcmdldDogbnVsbCxcblx0XHRcdHRva2VuOiBudWxsLFxuXHRcdFx0cmF0ZUxpbWl0aW5nOiB0cnVlLFxuXHRcdFx0Y2h1bmtTaXplOiBERUZBVUxUX0NIVU5LX1NJWkUsXG5cdFx0fSk7XG5cblx0XHR0aGlzLnJlcXVlc3QgPSBfX3JlcXVlc3Q7XG5cblx0XHQvLyBJbnN0YWxsIG9wdGlvbmFsIHJhdGUgbGltaXRpbmcgYWRhcHRlclxuXHRcdHRoaXMucmVxdWVzdCA9IHRoaXMuX2NvbmZpZy5yYXRlTGltaXRpbmdcblx0XHRcdD8gcmF0ZUxpbWl0QWRhcHRlcihcblx0XHRcdFx0XHRfLmFzc2lnbih7fSwgY29uZmlnLCB7XG5cdFx0XHRcdFx0XHRyZXF1ZXN0OiBfX3JlcXVlc3QuYmluZCh0aGlzKSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdCAgKVxuXHRcdFx0OiBfX3JlcXVlc3QuYmluZCh0aGlzKTtcblxuXHRcdC8vIEluc3RhbGwgb3B0aW9uYWwgY29uY3VycmVuY3kgYWRhcHRlclxuXHRcdHRoaXMuX2NvbmZpZy5yZXF1ZXN0ID0gdGhpcy5fY29uZmlnLmNvbmN1cnJlbmN5TGltaXRcblx0XHRcdD8gY29uY3VycmVuY3lBZGFwdGVyKHtcblx0XHRcdFx0XHRsaW1pdDogdGhpcy5fY29uZmlnLmNvbmN1cnJlbmN5TGltaXQsXG5cdFx0XHRcdFx0cmVxdWVzdDogdGhpcy5fY29uZmlnLnJlcXVlc3QsXG5cdFx0XHQgIH0pXG5cdFx0XHQ6IHRoaXMuX2NvbmZpZy5yZXF1ZXN0O1xuXHR9XG5cblx0cHVibGljIF9yZXF1ZXN0KG1ldGhvZDogTWV0aG9kLCBvcHRzOiBJR2VuZXJpY09wdGlvbnMgfCBzdHJpbmcsIGV4dGVuZE9wdHM6IElHZW5lcmljT3B0aW9ucywgcGF5bG9hZD8pOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdGNvbnN0IG5ld09wdHMgPSBfbm9ybWFsaXplT3B0cyhvcHRzLCBleHRlbmRPcHRzKTtcblx0XHRuZXdPcHRzLm1ldGhvZCA9IG1ldGhvZCB8fCBuZXdPcHRzLm1ldGhvZCB8fCAnR0VUJztcblx0XHRpZiAocGF5bG9hZCkge1xuXHRcdFx0bmV3T3B0cy5ib2R5ID0gcGF5bG9hZDtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMucmVxdWVzdChuZXdPcHRzKTtcblx0fVxuXG5cdHB1YmxpYyByZXF1ZXN0KG9wdHM6IElSZXF1ZXN0T3B0aW9ucywgZXh0ZW5kT3B0cz86IElHZW5lcmljT3B0aW9ucyk6IFByb21pc2U8SVJlc3BvbnNlPiB7XG5cdFx0cmV0dXJuIHRoaXMuX3JlcXVlc3QobnVsbCwgb3B0cywgZXh0ZW5kT3B0cyk7XG5cdH1cblxuXHRwdWJsaWMgZ2V0KG9wdHM6IElHZW5lcmljT3B0aW9ucyB8IHN0cmluZywgZXh0ZW5kT3B0cz86IElHZW5lcmljT3B0aW9ucyk6IFByb21pc2U8SVJlc3BvbnNlPiB7XG5cdFx0cmV0dXJuIHRoaXMuX3JlcXVlc3QoJ0dFVCcsIG9wdHMsIGV4dGVuZE9wdHMpO1xuXHR9XG5cblx0cHVibGljIGdldEFsbChvcHRzOiBJR2VuZXJpY09wdGlvbnMsIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPGFueT4ge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRjb25zdCBuZXdPcHRzID0gX25vcm1hbGl6ZU9wdHMob3B0cywgZXh0ZW5kT3B0cyk7XG5cdFx0XHRsZXQgbnVtRWxlbWVudHMgPSBvcHRzLm51bUVsZW1lbnRzIHx8IDEwMDtcblx0XHRcdGxldCBmaXJzdE91dHB1dFRlcm07XG5cdFx0XHRsZXQgZWxlbWVudHMgPSBbXTtcblx0XHRcdGxldCB0b3RhbFRpbWUgPSAwO1xuXG5cdFx0XHRjb25zdCBnZXRBbGwgPSAoc3RhcnRFbGVtZW50KSA9PiB7XG5cdFx0XHRcdG5ld09wdHMuc3RhcnRFbGVtZW50ID0gc3RhcnRFbGVtZW50O1xuXHRcdFx0XHRuZXdPcHRzLm51bUVsZW1lbnRzID0gbnVtRWxlbWVudHM7XG5cblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0KG5ld09wdHMpXG5cdFx0XHRcdFx0LnRoZW4oKHJlcykgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKCFzdGF0dXNPayhyZXMuYm9keSkpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJlamVjdChyZXMpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzcG9uc2UgPSByZXMuYm9keS5yZXNwb25zZTtcblx0XHRcdFx0XHRcdGNvbnN0IGNvdW50ID0gcmVzcG9uc2UuY291bnQgfHwgMDtcblx0XHRcdFx0XHRcdGNvbnN0IG91dHB1dFRlcm0gPSByZXNwb25zZS5kYmdfaW5mby5vdXRwdXRfdGVybTtcblx0XHRcdFx0XHRcdGlmICghZmlyc3RPdXRwdXRUZXJtKSB7XG5cdFx0XHRcdFx0XHRcdGZpcnN0T3V0cHV0VGVybSA9IG91dHB1dFRlcm07XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdG51bUVsZW1lbnRzID0gcmVzcG9uc2UubnVtX2VsZW1lbnRzO1xuXG5cdFx0XHRcdFx0XHR0b3RhbFRpbWUgKz0gcmVzcG9uc2UuZGJnX2luZm8udGltZSB8fCAwO1xuXHRcdFx0XHRcdFx0ZWxlbWVudHMgPSBlbGVtZW50cy5jb25jYXQocmVzcG9uc2Vbb3V0cHV0VGVybV0pO1xuXHRcdFx0XHRcdFx0aWYgKGNvdW50IDw9IHN0YXJ0RWxlbWVudCArIG51bUVsZW1lbnRzKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG5ld1Jlc3BvbnNlID0gXy5hc3NpZ24oXG5cdFx0XHRcdFx0XHRcdFx0e30sXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0Y291bnQ6IGVsZW1lbnRzLmxlbmd0aCxcblx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0X2VsZW1lbnQ6IDAsXG5cdFx0XHRcdFx0XHRcdFx0XHRudW1fZWxlbWVudHM6IGVsZW1lbnRzLmxlbmd0aCxcblx0XHRcdFx0XHRcdFx0XHRcdGRiZ19pbmZvOiBfLmFzc2lnbih7fSwgcmVzcG9uc2UuZGJnX2luZm8sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0b3V0cHV0X3Rlcm06IGZpcnN0T3V0cHV0VGVybSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGltZTogdG90YWxUaW1lLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0bmV3UmVzcG9uc2VbZmlyc3RPdXRwdXRUZXJtXSA9IGVsZW1lbnRzO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmVzb2x2ZSh7IGJvZHk6IHsgcmVzcG9uc2U6IG5ld1Jlc3BvbnNlIH0gfSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gZ2V0QWxsKHN0YXJ0RWxlbWVudCArIG51bUVsZW1lbnRzKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jYXRjaChyZWplY3QpO1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIGdldEFsbCgwKTtcblx0XHR9KTtcblx0fVxuXG5cdHB1YmxpYyBwb3N0KG9wdHM6IElPcHRpb25zV2l0aFBheWxvYWQgfCBzdHJpbmcsIHBheWxvYWQ/LCBleHRlbmRPcHRzPzogSUdlbmVyaWNPcHRpb25zKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5fcmVxdWVzdCgnUE9TVCcsIG9wdHMsIGV4dGVuZE9wdHMsIHBheWxvYWQpO1xuXHR9XG5cblx0cHVibGljIHBvc3RBbGwob3B0czogSU9wdGlvbnNXaXRoUGF5bG9hZCwgcGF5bG9hZD8sIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPGFueT4ge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRsZXQgbnVtRWxlbWVudHMgPSBvcHRzLm51bUVsZW1lbnRzIHx8IDEwMDtcblx0XHRcdGxldCBmaXJzdE91dHB1dFRlcm0gPSAvY3JlYXRpdmUtc2VhcmNoLy50ZXN0KG9wdHMudXJpKSA/ICdjcmVhdGl2ZXMnIDogJyc7XG5cdFx0XHRsZXQgZWxlbWVudHMgPSBbXTtcblx0XHRcdGxldCB0b3RhbFRpbWUgPSAwO1xuXG5cdFx0XHRjb25zdCBwb3N0QWxsID0gKHN0YXJ0RWxlbWVudCkgPT4ge1xuXHRcdFx0XHRvcHRzLnN0YXJ0RWxlbWVudCA9IHN0YXJ0RWxlbWVudDtcblx0XHRcdFx0b3B0cy5udW1FbGVtZW50cyA9IG51bUVsZW1lbnRzO1xuXG5cdFx0XHRcdHJldHVybiB0aGlzLnBvc3Qob3B0cywgcGF5bG9hZCwgZXh0ZW5kT3B0cylcblx0XHRcdFx0XHQudGhlbigocmVzKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoIXN0YXR1c09rKHJlcy5ib2R5KSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KHJlcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb25zdCByZXNwb25zZSA9IHJlcy5ib2R5LnJlc3BvbnNlO1xuXHRcdFx0XHRcdFx0Y29uc3QgY291bnQgPSByZXNwb25zZS5jb3VudCA/PyAwO1xuXHRcdFx0XHRcdFx0Y29uc3Qgb3V0cHV0VGVybSA9IHJlc3BvbnNlLmRiZ19pbmZvLm91dHB1dF90ZXJtO1xuXHRcdFx0XHRcdFx0aWYgKCFmaXJzdE91dHB1dFRlcm0pIHtcblx0XHRcdFx0XHRcdFx0Zmlyc3RPdXRwdXRUZXJtID0gb3V0cHV0VGVybTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bnVtRWxlbWVudHMgPSByZXNwb25zZS5udW1fZWxlbWVudHM7XG5cblx0XHRcdFx0XHRcdHRvdGFsVGltZSArPSByZXNwb25zZS5kYmdfaW5mby50aW1lIHx8IDA7XG5cdFx0XHRcdFx0XHRlbGVtZW50cyA9IGVsZW1lbnRzLmNvbmNhdChyZXNwb25zZVtvdXRwdXRUZXJtXSk7XG5cdFx0XHRcdFx0XHRpZiAoY291bnQgPD0gc3RhcnRFbGVtZW50ICsgbnVtRWxlbWVudHMpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbmV3UmVzcG9uc2UgPSBfLmFzc2lnbihcblx0XHRcdFx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb3VudDogZWxlbWVudHMubGVuZ3RoLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRfZWxlbWVudDogMCxcblx0XHRcdFx0XHRcdFx0XHRcdG51bV9lbGVtZW50czogZWxlbWVudHMubGVuZ3RoLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZGJnX2luZm86IF8uYXNzaWduKHt9LCByZXNwb25zZS5kYmdfaW5mbywge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRvdXRwdXRfdGVybTogZmlyc3RPdXRwdXRUZXJtLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aW1lOiB0b3RhbFRpbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHRuZXdSZXNwb25zZVtmaXJzdE91dHB1dFRlcm1dID0gZWxlbWVudHM7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXNvbHZlKHsgYm9keTogeyByZXNwb25zZTogbmV3UmVzcG9uc2UgfSB9KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBwb3N0QWxsKHN0YXJ0RWxlbWVudCArIG51bUVsZW1lbnRzKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jYXRjaChyZWplY3QpO1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIHBvc3RBbGwoMCk7XG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgcHV0KG9wdHM6IElPcHRpb25zV2l0aFBheWxvYWQgfCBzdHJpbmcsIHBheWxvYWQ/LCBleHRlbmRPcHRzPzogSUdlbmVyaWNPcHRpb25zKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5fcmVxdWVzdCgnUFVUJywgb3B0cywgZXh0ZW5kT3B0cywgcGF5bG9hZCk7XG5cdH1cblxuXHRwdWJsaWMgZGVsZXRlKG9wdHM6IElHZW5lcmljT3B0aW9ucyB8IHN0cmluZywgZXh0ZW5kT3B0cz86IElHZW5lcmljT3B0aW9ucyk6IFByb21pc2U8SVJlc3BvbnNlPiB7XG5cdFx0cmV0dXJuIHRoaXMuX3JlcXVlc3QoJ0RFTEVURScsIG9wdHMsIGV4dGVuZE9wdHMpO1xuXHR9XG5cblx0cHVibGljIGxvZ2luKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGNvbnN0IHJlcU9wdHMgPSB7XG5cdFx0XHRhdXRoOiB7XG5cdFx0XHRcdHVzZXJuYW1lLFxuXHRcdFx0XHRwYXNzd29yZCxcblx0XHRcdH0sXG5cdFx0fTtcblx0XHRyZXR1cm4gdGhpcy5wb3N0KCcvYXV0aCcsIHJlcU9wdHMpLnRoZW4oKHJlcykgPT4ge1xuXHRcdFx0aWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDAgJiYgc3RhdHVzT2socmVzLmJvZHkpKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZy50b2tlbiA9IHJlcy5ib2R5LnJlc3BvbnNlLnRva2VuO1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLnRva2VuO1xuXHRcdFx0fVxuXHRcdFx0dGhyb3cgZXJyb3JzLmJ1aWxkRXJyb3IobnVsbCwgcmVxT3B0cywgcmVzKTtcblx0XHR9KTtcblx0fVxuXG5cdHB1YmxpYyBzd2l0Y2hVc2VyKHVzZXJJZDogbnVtYmVyKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5wb3N0KCcvYXV0aCcsIHtcblx0XHRcdGF1dGg6IHtcblx0XHRcdFx0c3dpdGNoX3RvX3VzZXI6IHVzZXJJZCxcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH1cbn1cbiJdfQ==