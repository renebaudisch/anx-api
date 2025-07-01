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
            var _a, _b;
            const totalTime = new Date().getTime() - startTime;
            let newRes = _.assign({
                requestTime: (_a = res.requestTime) !== null && _a !== void 0 ? _a : totalTime,
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
            if ((_b = newRes.body) === null || _b === void 0 ? void 0 : _b.response) {
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
                    var _a, _b;
                    if (!statusOk(res.body)) {
                        return reject(res);
                    }
                    const response = res.body.response;
                    const count = (_a = response.count) !== null && _a !== void 0 ? _a : 0;
                    const outputTerm = response.dbg_info.output_term;
                    firstOutputTerm !== null && firstOutputTerm !== void 0 ? firstOutputTerm : (firstOutputTerm = outputTerm);
                    numElements = response.num_elements;
                    totalTime += (_b = response.dbg_info.time) !== null && _b !== void 0 ? _b : 0;
                    elements = elements.concat(response[firstOutputTerm]);
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
                    var _a, _b;
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
                    totalTime += (_b = response.dbg_info.time) !== null && _b !== void 0 ? _b : 0;
                    elements = elements.concat(response[firstOutputTerm]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUM1QiwwQ0FBNEI7QUFDNUIsd0RBQStCO0FBRS9CLGlEQUE4QztBQUM5Qyw2REFBMEQ7QUFDMUQsaURBQW1DO0FBQ25DLHlEQUFzRDtBQUt0RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUUvQyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztBQW9EL0IsU0FBUyxTQUFTLENBQUMsS0FBVTtJQUM1QixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsS0FBVTtJQUM3QixPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDdkMsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQThCLEVBQUUsVUFBMkI7SUFDbEYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDL0IsQ0FBQyxDQUFDO1lBQ0EsR0FBRyxFQUFFLElBQUk7U0FDUjtRQUNILENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ2QsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLElBQUk7SUFDNUIsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxL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Q0FBQztnQkFDN0MsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQzthQUMxQjtZQUNELE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVNLFVBQVUsQ0FBQyxNQUFjO1FBQy9CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDekIsSUFBSSxFQUFFO2dCQUNMLGNBQWMsRUFBRSxNQUFNO2FBQ3RCO1NBQ0QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztDQUNEO0FBaE1ELHdCQWdNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIHF1ZXJ5IGZyb20gJ3FzJztcbmltcG9ydCB1cmxKb2luIGZyb20gJ3VybC1qb2luJztcblxuaW1wb3J0IHsgYXhpb3NBZGFwdGVyIH0gZnJvbSAnLi9heGlvc0FkYXB0ZXInO1xuaW1wb3J0IHsgY29uY3VycmVuY3lBZGFwdGVyIH0gZnJvbSAnLi9jb25jdXJyZW5jeUFkYXB0ZXInO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7IHJhdGVMaW1pdEFkYXB0ZXIgfSBmcm9tICcuL3JhdGVMaW1pdEFkYXB0ZXInO1xuaW1wb3J0IHsgSVJlc3BvbnNlIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCB0eXBlIE1ldGhvZCA9ICdnZXQnIHwgJ0dFVCcgfCAnZGVsZXRlJyB8ICdERUxFVEUnIHwgJ2hlYWQnIHwgJ0hFQUQnIHwgJ29wdGlvbnMnIHwgJ09QVElPTlMnIHwgJ3Bvc3QnIHwgJ1BPU1QnIHwgJ3B1dCcgfCAnUFVUJyB8ICdwYXRjaCcgfCAnUEFUQ0gnO1xuXG5jb25zdCBwYWNrYWdlSnNvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xuXG5jb25zdCBERUZBVUxUX0NIVU5LX1NJWkUgPSAxMDA7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbmZpZyB7XG5cdGNvbmN1cnJlbmN5TGltaXQ/OiBudW1iZXI7XG5cdGVudmlyb25tZW50Pzogc3RyaW5nO1xuXHRyYXRlTGltaXRpbmc6IGJvb2xlYW47XG5cdHJlcXVlc3Q/OiAob3B0czogSUdlbmVyaWNPcHRpb25zKSA9PiBQcm9taXNlPElSZXNwb25zZT47XG5cdGJlZm9yZVJlcXVlc3Q/OiAob3B0czogYW55KSA9PiBhbnk7XG5cdGFmdGVyUmVxdWVzdD86IChvcHRzOiBhbnkpID0+IGFueTtcblx0dGFyZ2V0OiBzdHJpbmc7XG5cdHRpbWVvdXQ/OiBudW1iZXI7XG5cdHRva2VuPzogc3RyaW5nO1xuXHR1c2VyQWdlbnQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdlbmVyaWNPcHRpb25zIHtcblx0YXV0aD86IGFueTtcblx0ZW5jb2RlUGFyYW1zPzogYm9vbGVhbjtcblx0aGVhZGVycz86IHt9O1xuXHRtaW1lVHlwZT86IHN0cmluZztcblx0bm9BdXRoPzogYW55O1xuXHRudW1FbGVtZW50cz86IG51bWJlcjtcblx0cGFyYW1zPzoge307XG5cdHN0YXJ0RWxlbWVudD86IG51bWJlcjtcblx0dGltZW91dD86IG51bWJlcjtcblx0dXJpOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbnNXaXRoUGF5bG9hZCBleHRlbmRzIElHZW5lcmljT3B0aW9ucyB7XG5cdGJvZHk/OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlcXVlc3RPcHRpb25zIGV4dGVuZHMgSU9wdGlvbnNXaXRoUGF5bG9hZCB7XG5cdG1ldGhvZDogTWV0aG9kO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElSZXF1ZXN0T3B0aW9uc0ludGVybmFsIHtcblx0YXV0aD86IGJvb2xlYW47XG5cdGJvZHk6IG9iamVjdDtcblx0ZW5jb2RlUGFyYW1zOiBib29sZWFuO1xuXHRoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXHRtZXRob2Q6IE1ldGhvZDtcblx0bWltZVR5cGU/OiBzdHJpbmc7XG5cdG5vQXV0aD86IGJvb2xlYW47XG5cdG51bUVsZW1lbnRzPzogbnVtYmVyO1xuXHRwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cdHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbjtcblx0c3RhcnRFbGVtZW50PzogbnVtYmVyO1xuXHR0aW1lb3V0OiBudW1iZXI7XG5cdHVyaTogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBfaGFzVmFsdWUodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gIShfLmlzTnVsbCh2YWx1ZSkgfHwgXy5pc1VuZGVmaW5lZCh2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBfaXNJbnRlZ2VyKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcblx0cmV0dXJuIHBhcnNlSW50KHZhbHVlLCAxMCkgPT09ICt2YWx1ZTtcbn1cblxuZnVuY3Rpb24gX25vcm1hbGl6ZU9wdHMob3B0czogSUdlbmVyaWNPcHRpb25zIHwgc3RyaW5nLCBleHRlbmRPcHRzOiBJR2VuZXJpY09wdGlvbnMpOiBJUmVxdWVzdE9wdGlvbnMge1xuXHRjb25zdCBuZXdPcHRzID0gXy5pc1N0cmluZyhvcHRzKVxuXHRcdD8ge1xuXHRcdFx0XHR1cmk6IG9wdHMsXG5cdFx0ICB9XG5cdFx0OiBvcHRzIHx8IHt9O1xuXHRyZXR1cm4gXy5hc3NpZ24oeyBtZXRob2Q6IG51bGwgfSwgbmV3T3B0cywgZXh0ZW5kT3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGF0dXNPayhib2R5KSB7XG5cdHJldHVybiAhIWJvZHkgJiYgISFib2R5LnJlc3BvbnNlICYmIGJvZHkucmVzcG9uc2Uuc3RhdHVzID09PSAnT0snO1xufVxuXG5mdW5jdGlvbiBfX3JlcXVlc3Qob3B0czogSVJlcXVlc3RPcHRpb25zSW50ZXJuYWwpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRjb25zdCBfc2VsZiA9IHRoaXM7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cblx0XHRpZiAoXy5pc0VtcHR5KF9zZWxmLl9jb25maWcudGFyZ2V0KSkge1xuXHRcdFx0cmV0dXJuIHJlamVjdChuZXcgZXJyb3JzLlRhcmdldEVycm9yKCdUYXJnZXQgbm90IHNldCcsIG51bGwpKTtcblx0XHR9XG5cblx0XHQvLyBWYWxpZGF0ZSBPcHRzXG5cdFx0Xy5mb3JFYWNoKF8ucGljayhvcHRzLCBbJ3N0YXJ0RWxlbWVudCcsICdudW1FbGVtZW50cyddKSwgKHZhbHVlLCBvcHQpID0+IHtcblx0XHRcdGlmIChfaGFzVmFsdWUodmFsdWUpICYmICFfaXNJbnRlZ2VyKHZhbHVlKSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KG5ldyBlcnJvcnMuQXJndW1lbnRFcnJvcihvcHRzLCAnSW52YWxpZCAnICsgb3B0KSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9KTtcblxuXHRcdC8vIENvbmZpZ3VyZSBPcHRpb25zXG5cdFx0bGV0IHJlcU9wdHM6IElSZXF1ZXN0T3B0aW9uc0ludGVybmFsID0ge1xuXHRcdFx0bWV0aG9kOiBvcHRzLm1ldGhvZCB8fCAnR0VUJyxcblx0XHRcdHVyaTogdXJsSm9pbihfc2VsZi5fY29uZmlnLnRhcmdldCwgXy50cmltU3RhcnQob3B0cy51cmksICcvJykpLFxuXHRcdFx0dGltZW91dDogb3B0cy50aW1lb3V0IHx8IF9zZWxmLl9jb25maWcudGltZW91dCxcblx0XHRcdHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UsXG5cdFx0XHRoZWFkZXJzOiB7IC4uLl9zZWxmLl9jb25maWcuaGVhZGVycyB9LFxuXHRcdFx0cGFyYW1zOiB7IC4uLm9wdHMucGFyYW1zIH0sXG5cdFx0XHRib2R5OiBvcHRzLmJvZHksXG5cdFx0XHRlbmNvZGVQYXJhbXM6IF8uZ2V0KG9wdHMsICdlbmNvZGVQYXJhbXMnLCBmYWxzZSksXG5cdFx0fTtcblxuXHRcdGlmIChfc2VsZi5fY29uZmlnLnVzZXJBZ2VudCkge1xuXHRcdFx0cmVxT3B0cy5oZWFkZXJzWydVc2VyLUFnZW50J10gPSBfc2VsZi5fY29uZmlnLnVzZXJBZ2VudDtcblx0XHR9XG5cblx0XHRpZiAoIW9wdHMubm9BdXRoICYmICFvcHRzLmF1dGggJiYgX3NlbGYuX2NvbmZpZy50b2tlbikge1xuXHRcdFx0cmVxT3B0cy5oZWFkZXJzLkF1dGhvcml6YXRpb24gPSBfc2VsZi5fY29uZmlnLnRva2VuO1xuXHRcdH1cblxuXHRcdGlmIChvcHRzLm1pbWVUeXBlKSB7XG5cdFx0XHRyZXFPcHRzLmhlYWRlcnMuQWNjZXB0ID0gb3B0cy5taW1lVHlwZTtcblx0XHRcdGlmIChvcHRzLm1ldGhvZCA9PT0gJ1BPU1QnIHx8IG9wdHMubWV0aG9kID09PSAnUFVUJykge1xuXHRcdFx0XHRyZXFPcHRzLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gb3B0cy5taW1lVHlwZTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gRGVmYXVsdCBBY2NlcHQgdG8gYXBwbGljYXRpb24vanNvblxuXHRcdFx0cmVxT3B0cy5oZWFkZXJzLkFjY2VwdCA9IF8uZ2V0KG9wdHMsICdoZWFkZXJzLkFjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cblx0XHRcdC8vIERlZmF1bHQgQ29udGVudC1UeXBlIHRvIGFwcGxpY2F0aW9uL2pzb24gZm9yIFBPU1RzIGFuZCBQVVRzXG5cdFx0XHRpZiAocmVxT3B0cy5tZXRob2QgPT09ICdQT1NUJyB8fCByZXFPcHRzLm1ldGhvZCA9PT0gJ1BVVCcpIHtcblx0XHRcdFx0cmVxT3B0cy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9IF8uZ2V0KG9wdHMsICdoZWFkZXJzLkNvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmVxT3B0cy5oZWFkZXJzID0gXy5hc3NpZ24oe30sIHJlcU9wdHMuaGVhZGVycywgb3B0cy5oZWFkZXJzKTtcblxuXHRcdC8vIENvbmZpZ3VyZSBQYXJhbWV0ZXJzXG5cdFx0aWYgKF9oYXNWYWx1ZShvcHRzLnN0YXJ0RWxlbWVudCkpIHtcblx0XHRcdHJlcU9wdHMucGFyYW1zLnN0YXJ0X2VsZW1lbnQgPSAoK29wdHMuc3RhcnRFbGVtZW50KS50b1N0cmluZygpO1xuXHRcdH1cblx0XHRpZiAoX2hhc1ZhbHVlKG9wdHMubnVtRWxlbWVudHMpKSB7XG5cdFx0XHRyZXFPcHRzLnBhcmFtcy5udW1fZWxlbWVudHMgPSAoK29wdHMubnVtRWxlbWVudHMpLnRvU3RyaW5nKCk7XG5cdFx0XHRyZXFPcHRzLnBhcmFtcy5zdGFydF9lbGVtZW50ID0gKCtvcHRzLnN0YXJ0RWxlbWVudCB8fCByZXFPcHRzLnBhcmFtcy5zdGFydF9lbGVtZW50IHx8IDApLnRvU3RyaW5nKCk7IC8vIHN0YXJ0RWxlbWVudCBpcyByZXF1aXJlZCBpZiBudW1FbGVtZW50cyBpcyBzZXRcblx0XHR9XG5cblx0XHRjb25zdCBwYXJhbXMgPSBxdWVyeS5zdHJpbmdpZnkocmVxT3B0cy5wYXJhbXMsIHsgZW5jb2RlOiByZXFPcHRzLmVuY29kZVBhcmFtcyB9KTtcblxuXHRcdGlmIChwYXJhbXMgIT09ICcnKSB7XG5cdFx0XHRyZXFPcHRzLnVyaSArPSAhb3B0cy51cmkuaW5jbHVkZXMoJz8nKSA/ICc/JyA6ICcmJztcblx0XHRcdHJlcU9wdHMudXJpICs9IHBhcmFtcztcblx0XHR9XG5cblx0XHRpZiAoX3NlbGYuX2NvbmZpZy5iZWZvcmVSZXF1ZXN0KSB7XG5cdFx0XHRjb25zdCBiZWZvcmVSZXF1ZXN0T3B0cyA9IF9zZWxmLl9jb25maWcuYmVmb3JlUmVxdWVzdChyZXFPcHRzKTtcblx0XHRcdGlmIChiZWZvcmVSZXF1ZXN0T3B0cykge1xuXHRcdFx0XHRyZXFPcHRzID0gXy5hc3NpZ24oe30sIHJlcU9wdHMsIGJlZm9yZVJlcXVlc3RPcHRzKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gX3NlbGYuX2NvbmZpZ1xuXHRcdFx0LnJlcXVlc3QocmVxT3B0cylcblx0XHRcdC50aGVuKChyZXMpID0+IHtcblx0XHRcdFx0Y29uc3QgdG90YWxUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWU7XG5cblx0XHRcdFx0bGV0IG5ld1JlczogSVJlc3BvbnNlID0gXy5hc3NpZ24oXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0cmVxdWVzdFRpbWU6IHJlcy5yZXF1ZXN0VGltZSA/PyB0b3RhbFRpbWUsXG5cdFx0XHRcdFx0XHR0b3RhbFRpbWU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cmVzLFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGlmIChfc2VsZi5fY29uZmlnLmFmdGVyUmVxdWVzdCkge1xuXHRcdFx0XHRcdGNvbnN0IGFmdGVyUmVxdWVzdFJlcyA9IF9zZWxmLl9jb25maWcuYWZ0ZXJSZXF1ZXN0KG5ld1Jlcyk7XG5cdFx0XHRcdFx0aWYgKGFmdGVyUmVxdWVzdFJlcykge1xuXHRcdFx0XHRcdFx0bmV3UmVzID0gXy5hc3NpZ24oe30sIG5ld1JlcywgYWZ0ZXJSZXF1ZXN0UmVzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobmV3UmVzLnN0YXR1c0NvZGUgPj0gNDAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlamVjdChlcnJvcnMuYnVpbGRFcnJvcihudWxsLCByZXFPcHRzLCBuZXdSZXMpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFRlbXBvcmFyeSBmaXhcblx0XHRcdFx0bGV0IGVycm9ySWQ7XG5cdFx0XHRcdGxldCBlcnJvckNvZGU7XG5cdFx0XHRcdGlmIChuZXdSZXMuYm9keT8ucmVzcG9uc2UpIHtcblx0XHRcdFx0XHRlcnJvcklkID0gbmV3UmVzLmJvZHkucmVzcG9uc2UuZXJyb3JfaWQ7XG5cdFx0XHRcdFx0ZXJyb3JDb2RlID0gbmV3UmVzLmJvZHkucmVzcG9uc2UuZXJyb3JfY29kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZXJyb3JJZCA9PT0gJ1NZU1RFTScgJiYgZXJyb3JDb2RlID09PSAnU0VSVklDRV9VTkFWQUlMQUJMRScpIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGVycm9ycy5idWlsZEVycm9yKG51bGwsIHJlcU9wdHMsIG5ld1JlcykpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChlcnJvcklkID09PSAnU1lTVEVNJyAmJiBlcnJvckNvZGUgPT09ICdVTktOT1dOJykge1xuXHRcdFx0XHRcdHJldHVybiByZWplY3QoZXJyb3JzLmJ1aWxkRXJyb3IobnVsbCwgcmVxT3B0cywgbmV3UmVzKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRuZXdSZXMucmVxID0gcmVxT3B0cztcblxuXHRcdFx0XHRyZXR1cm4gcmVzb2x2ZShuZXdSZXMpO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdGxldCBuZXdFcnIgPSBlcnI7XG5cdFx0XHRcdGlmIChfc2VsZi5fY29uZmlnLmFmdGVyUmVxdWVzdCkge1xuXHRcdFx0XHRcdG5ld0VyciA9IF9zZWxmLl9jb25maWcuYWZ0ZXJSZXF1ZXN0KGVycik7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHJlamVjdChlcnJvcnMuYnVpbGRSZXF1ZXN0RXJyb3IobmV3RXJyLCByZXFPcHRzKSk7XG5cdFx0XHR9KTtcblx0fSk7XG59XG5cbmV4cG9ydCBjbGFzcyBBbnhBcGkge1xuXHRwdWJsaWMgX2NvbmZpZzogSUNvbmZpZztcblxuXHRjb25zdHJ1Y3Rvcihjb25maWc6IElDb25maWcpIHtcblx0XHR0aGlzLl9jb25maWcgPSBfLmRlZmF1bHRzKHt9LCBjb25maWcsIHtcblx0XHRcdHJlcXVlc3Q6IGF4aW9zQWRhcHRlcih7XG5cdFx0XHRcdGZvcmNlSHR0cEFkYXB0b3I6IGNvbmZpZy5lbnZpcm9ubWVudCA9PT0gJ25vZGUnLFxuXHRcdFx0fSksXG5cdFx0XHR1c2VyQWdlbnQ6ICdhbngtYXBpLycgKyBwYWNrYWdlSnNvbi52ZXJzaW9uLFxuXHRcdFx0dGltZW91dDogNjAgKiAxMDAwLFxuXHRcdFx0aGVhZGVyczoge30sXG5cdFx0XHR0YXJnZXQ6IG51bGwsXG5cdFx0XHR0b2tlbjogbnVsbCxcblx0XHRcdHJhdGVMaW1pdGluZzogdHJ1ZSxcblx0XHRcdGNodW5rU2l6ZTogREVGQVVMVF9DSFVOS19TSVpFLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5yZXF1ZXN0ID0gX19yZXF1ZXN0O1xuXG5cdFx0Ly8gSW5zdGFsbCBvcHRpb25hbCByYXRlIGxpbWl0aW5nIGFkYXB0ZXJcblx0XHR0aGlzLnJlcXVlc3QgPSB0aGlzLl9jb25maWcucmF0ZUxpbWl0aW5nXG5cdFx0XHQ/IHJhdGVMaW1pdEFkYXB0ZXIoXG5cdFx0XHRcdFx0Xy5hc3NpZ24oe30sIGNvbmZpZywge1xuXHRcdFx0XHRcdFx0cmVxdWVzdDogX19yZXF1ZXN0LmJpbmQodGhpcyksXG5cdFx0XHRcdFx0fSksXG5cdFx0XHQgIClcblx0XHRcdDogX19yZXF1ZXN0LmJpbmQodGhpcyk7XG5cblx0XHQvLyBJbnN0YWxsIG9wdGlvbmFsIGNvbmN1cnJlbmN5IGFkYXB0ZXJcblx0XHR0aGlzLl9jb25maWcucmVxdWVzdCA9IHRoaXMuX2NvbmZpZy5jb25jdXJyZW5jeUxpbWl0XG5cdFx0XHQ/IGNvbmN1cnJlbmN5QWRhcHRlcih7XG5cdFx0XHRcdFx0bGltaXQ6IHRoaXMuX2NvbmZpZy5jb25jdXJyZW5jeUxpbWl0LFxuXHRcdFx0XHRcdHJlcXVlc3Q6IHRoaXMuX2NvbmZpZy5yZXF1ZXN0LFxuXHRcdFx0ICB9KVxuXHRcdFx0OiB0aGlzLl9jb25maWcucmVxdWVzdDtcblx0fVxuXG5cdHB1YmxpYyBfcmVxdWVzdChtZXRob2Q6IE1ldGhvZCwgb3B0czogSUdlbmVyaWNPcHRpb25zIHwgc3RyaW5nLCBleHRlbmRPcHRzOiBJR2VuZXJpY09wdGlvbnMsIHBheWxvYWQ/KTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRjb25zdCBuZXdPcHRzID0gX25vcm1hbGl6ZU9wdHMob3B0cywgZXh0ZW5kT3B0cyk7XG5cdFx0bmV3T3B0cy5tZXRob2QgPSBtZXRob2QgfHwgbmV3T3B0cy5tZXRob2QgfHwgJ0dFVCc7XG5cdFx0aWYgKHBheWxvYWQpIHtcblx0XHRcdG5ld09wdHMuYm9keSA9IHBheWxvYWQ7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnJlcXVlc3QobmV3T3B0cyk7XG5cdH1cblxuXHRwdWJsaWMgcmVxdWVzdChvcHRzOiBJUmVxdWVzdE9wdGlvbnMsIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLl9yZXF1ZXN0KG51bGwsIG9wdHMsIGV4dGVuZE9wdHMpO1xuXHR9XG5cblx0cHVibGljIGdldChvcHRzOiBJR2VuZXJpY09wdGlvbnMgfCBzdHJpbmcsIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLl9yZXF1ZXN0KCdHRVQnLCBvcHRzLCBleHRlbmRPcHRzKTtcblx0fVxuXG5cdHB1YmxpYyBnZXRBbGwob3B0czogSUdlbmVyaWNPcHRpb25zLCBleHRlbmRPcHRzPzogSUdlbmVyaWNPcHRpb25zKTogUHJvbWlzZTxhbnk+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3T3B0cyA9IF9ub3JtYWxpemVPcHRzKG9wdHMsIGV4dGVuZE9wdHMpO1xuXHRcdFx0bGV0IG51bUVsZW1lbnRzID0gb3B0cy5udW1FbGVtZW50cyB8fCAxMDA7XG5cdFx0XHRsZXQgZmlyc3RPdXRwdXRUZXJtO1xuXHRcdFx0bGV0IGVsZW1lbnRzID0gW107XG5cdFx0XHRsZXQgdG90YWxUaW1lID0gMDtcblxuXHRcdFx0Y29uc3QgZ2V0QWxsID0gKHN0YXJ0RWxlbWVudCkgPT4ge1xuXHRcdFx0XHRuZXdPcHRzLnN0YXJ0RWxlbWVudCA9IHN0YXJ0RWxlbWVudDtcblx0XHRcdFx0bmV3T3B0cy5udW1FbGVtZW50cyA9IG51bUVsZW1lbnRzO1xuXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldChuZXdPcHRzKVxuXHRcdFx0XHRcdC50aGVuKChyZXMpID0+IHtcblx0XHRcdFx0XHRcdGlmICghc3RhdHVzT2socmVzLmJvZHkpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZWplY3QocmVzKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnN0IHJlc3BvbnNlID0gcmVzLmJvZHkucmVzcG9uc2U7XG5cdFx0XHRcdFx0XHRjb25zdCBjb3VudCA9IHJlc3BvbnNlLmNvdW50ID8/IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBvdXRwdXRUZXJtID0gcmVzcG9uc2UuZGJnX2luZm8ub3V0cHV0X3Rlcm07XG5cdFx0XHRcdFx0XHRmaXJzdE91dHB1dFRlcm0gPz89IG91dHB1dFRlcm07XG5cblx0XHRcdFx0XHRcdG51bUVsZW1lbnRzID0gcmVzcG9uc2UubnVtX2VsZW1lbnRzO1xuXG5cdFx0XHRcdFx0XHR0b3RhbFRpbWUgKz0gcmVzcG9uc2UuZGJnX2luZm8udGltZSA/PyAwO1xuXHRcdFx0XHRcdFx0ZWxlbWVudHMgPSBlbGVtZW50cy5jb25jYXQocmVzcG9uc2VbZmlyc3RPdXRwdXRUZXJtXSk7XG5cdFx0XHRcdFx0XHRpZiAoY291bnQgPD0gc3RhcnRFbGVtZW50ICsgbnVtRWxlbWVudHMpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbmV3UmVzcG9uc2UgPSBfLmFzc2lnbihcblx0XHRcdFx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb3VudDogZWxlbWVudHMubGVuZ3RoLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRfZWxlbWVudDogMCxcblx0XHRcdFx0XHRcdFx0XHRcdG51bV9lbGVtZW50czogZWxlbWVudHMubGVuZ3RoLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZGJnX2luZm86IF8uYXNzaWduKHt9LCByZXNwb25zZS5kYmdfaW5mbywge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRvdXRwdXRfdGVybTogZmlyc3RPdXRwdXRUZXJtLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aW1lOiB0b3RhbFRpbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHRuZXdSZXNwb25zZVtmaXJzdE91dHB1dFRlcm1dID0gZWxlbWVudHM7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXNvbHZlKHsgYm9keTogeyByZXNwb25zZTogbmV3UmVzcG9uc2UgfSB9KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBnZXRBbGwoc3RhcnRFbGVtZW50ICsgbnVtRWxlbWVudHMpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKHJlamVjdCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRyZXR1cm4gZ2V0QWxsKDApO1xuXHRcdH0pO1xuXHR9XG5cblx0cHVibGljIHBvc3Qob3B0czogSU9wdGlvbnNXaXRoUGF5bG9hZCB8IHN0cmluZywgcGF5bG9hZD8sIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLl9yZXF1ZXN0KCdQT1NUJywgb3B0cywgZXh0ZW5kT3B0cywgcGF5bG9hZCk7XG5cdH1cblxuXHRwdWJsaWMgcG9zdEFsbChvcHRzOiBJT3B0aW9uc1dpdGhQYXlsb2FkLCBwYXlsb2FkPywgZXh0ZW5kT3B0cz86IElHZW5lcmljT3B0aW9ucyk6IFByb21pc2U8YW55PiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGxldCBudW1FbGVtZW50cyA9IG9wdHMubnVtRWxlbWVudHMgfHwgMTAwO1xuXHRcdFx0bGV0IGZpcnN0T3V0cHV0VGVybSA9IC9jcmVhdGl2ZS1zZWFyY2gvLnRlc3Qob3B0cy51cmkpID8gJ2NyZWF0aXZlcycgOiAnJztcblx0XHRcdGxldCBlbGVtZW50cyA9IFtdO1xuXHRcdFx0bGV0IHRvdGFsVGltZSA9IDA7XG5cblx0XHRcdGNvbnN0IHBvc3RBbGwgPSAoc3RhcnRFbGVtZW50KSA9PiB7XG5cdFx0XHRcdG9wdHMuc3RhcnRFbGVtZW50ID0gc3RhcnRFbGVtZW50O1xuXHRcdFx0XHRvcHRzLm51bUVsZW1lbnRzID0gbnVtRWxlbWVudHM7XG5cblx0XHRcdFx0cmV0dXJuIHRoaXMucG9zdChvcHRzLCBwYXlsb2FkLCBleHRlbmRPcHRzKVxuXHRcdFx0XHRcdC50aGVuKChyZXMpID0+IHtcblx0XHRcdFx0XHRcdGlmICghc3RhdHVzT2socmVzLmJvZHkpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZWplY3QocmVzKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnN0IHJlc3BvbnNlID0gcmVzLmJvZHkucmVzcG9uc2U7XG5cdFx0XHRcdFx0XHRjb25zdCBjb3VudCA9IHJlc3BvbnNlLmNvdW50ID8/IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBvdXRwdXRUZXJtID0gcmVzcG9uc2UuZGJnX2luZm8ub3V0cHV0X3Rlcm07XG5cdFx0XHRcdFx0XHRpZiAoIWZpcnN0T3V0cHV0VGVybSkge1xuXHRcdFx0XHRcdFx0XHRmaXJzdE91dHB1dFRlcm0gPSBvdXRwdXRUZXJtO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRudW1FbGVtZW50cyA9IHJlc3BvbnNlLm51bV9lbGVtZW50cztcblxuXHRcdFx0XHRcdFx0dG90YWxUaW1lICs9IHJlc3BvbnNlLmRiZ19pbmZvLnRpbWUgPz8gMDtcblx0XHRcdFx0XHRcdGVsZW1lbnRzID0gZWxlbWVudHMuY29uY2F0KHJlc3BvbnNlW2ZpcnN0T3V0cHV0VGVybV0pO1xuXHRcdFx0XHRcdFx0aWYgKGNvdW50IDw9IHN0YXJ0RWxlbWVudCArIG51bUVsZW1lbnRzKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG5ld1Jlc3BvbnNlID0gXy5hc3NpZ24oXG5cdFx0XHRcdFx0XHRcdFx0e30sXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0Y291bnQ6IGVsZW1lbnRzLmxlbmd0aCxcblx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0X2VsZW1lbnQ6IDAsXG5cdFx0XHRcdFx0XHRcdFx0XHRudW1fZWxlbWVudHM6IGVsZW1lbnRzLmxlbmd0aCxcblx0XHRcdFx0XHRcdFx0XHRcdGRiZ19pbmZvOiBfLmFzc2lnbih7fSwgcmVzcG9uc2UuZGJnX2luZm8sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0b3V0cHV0X3Rlcm06IGZpcnN0T3V0cHV0VGVybSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGltZTogdG90YWxUaW1lLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0bmV3UmVzcG9uc2VbZmlyc3RPdXRwdXRUZXJtXSA9IGVsZW1lbnRzO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmVzb2x2ZSh7IGJvZHk6IHsgcmVzcG9uc2U6IG5ld1Jlc3BvbnNlIH0gfSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gcG9zdEFsbChzdGFydEVsZW1lbnQgKyBudW1FbGVtZW50cyk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2gocmVqZWN0KTtcblx0XHRcdH07XG5cblx0XHRcdHJldHVybiBwb3N0QWxsKDApO1xuXHRcdH0pO1xuXHR9XG5cblx0cHVibGljIHB1dChvcHRzOiBJT3B0aW9uc1dpdGhQYXlsb2FkIHwgc3RyaW5nLCBwYXlsb2FkPywgZXh0ZW5kT3B0cz86IElHZW5lcmljT3B0aW9ucyk6IFByb21pc2U8SVJlc3BvbnNlPiB7XG5cdFx0cmV0dXJuIHRoaXMuX3JlcXVlc3QoJ1BVVCcsIG9wdHMsIGV4dGVuZE9wdHMsIHBheWxvYWQpO1xuXHR9XG5cblx0cHVibGljIGRlbGV0ZShvcHRzOiBJR2VuZXJpY09wdGlvbnMgfCBzdHJpbmcsIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLl9yZXF1ZXN0KCdERUxFVEUnLCBvcHRzLCBleHRlbmRPcHRzKTtcblx0fVxuXG5cdHB1YmxpYyBsb2dpbih1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCByZXFPcHRzID0ge1xuXHRcdFx0YXV0aDoge1xuXHRcdFx0XHR1c2VybmFtZSxcblx0XHRcdFx0cGFzc3dvcmQsXG5cdFx0XHR9LFxuXHRcdH07XG5cdFx0cmV0dXJuIHRoaXMucG9zdCgnL2F1dGgnLCByZXFPcHRzKS50aGVuKChyZXMpID0+IHtcblx0XHRcdGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIHN0YXR1c09rKHJlcy5ib2R5KSkge1xuXHRcdFx0XHR0aGlzLl9jb25maWcudG9rZW4gPSByZXMuYm9keS5yZXNwb25zZS50b2tlbjtcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy50b2tlbjtcblx0XHRcdH1cblx0XHRcdHRocm93IGVycm9ycy5idWlsZEVycm9yKG51bGwsIHJlcU9wdHMsIHJlcyk7XG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgc3dpdGNoVXNlcih1c2VySWQ6IG51bWJlcik6IFByb21pc2U8SVJlc3BvbnNlPiB7XG5cdFx0cmV0dXJuIHRoaXMucG9zdCgnL2F1dGgnLCB7XG5cdFx0XHRhdXRoOiB7XG5cdFx0XHRcdHN3aXRjaF90b191c2VyOiB1c2VySWQsXG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9XG59XG4iXX0=