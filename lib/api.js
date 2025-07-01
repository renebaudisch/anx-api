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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUM1QiwwQ0FBNEI7QUFDNUIsd0RBQStCO0FBRS9CLGlEQUE4QztBQUM5Qyw2REFBMEQ7QUFDMUQsaURBQW1DO0FBQ25DLHlEQUFzRDtBQUt0RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUUvQyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztBQW9EL0IsU0FBUyxTQUFTLENBQUMsS0FBVTtJQUM1QixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsS0FBVTtJQUM3QixPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDdkMsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQThCLEVBQUUsVUFBMkI7SUFDbEYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDL0IsQ0FBQyxDQUFDO1lBQ0EsR0FBRyxFQUFFLElBQUk7U0FDUjtRQUNILENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ2QsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLElBQUk7SUFDNUIsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxL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QUFRLENBQUMsS0FBSyxDQUFDO2dCQUM3QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO2FBQzFCO1lBQ0QsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRU0sVUFBVSxDQUFDLE1BQWM7UUFDL0IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUN6QixJQUFJLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLE1BQU07YUFDdEI7U0FDRCxDQUFDLENBQUM7SUFDSixDQUFDO0NBQ0Q7QUFsTUQsd0JBa01DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgcXVlcnkgZnJvbSAncXMnO1xuaW1wb3J0IHVybEpvaW4gZnJvbSAndXJsLWpvaW4nO1xuXG5pbXBvcnQgeyBheGlvc0FkYXB0ZXIgfSBmcm9tICcuL2F4aW9zQWRhcHRlcic7XG5pbXBvcnQgeyBjb25jdXJyZW5jeUFkYXB0ZXIgfSBmcm9tICcuL2NvbmN1cnJlbmN5QWRhcHRlcic7XG5pbXBvcnQgKiBhcyBlcnJvcnMgZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHsgcmF0ZUxpbWl0QWRhcHRlciB9IGZyb20gJy4vcmF0ZUxpbWl0QWRhcHRlcic7XG5pbXBvcnQgeyBJUmVzcG9uc2UgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IHR5cGUgTWV0aG9kID0gJ2dldCcgfCAnR0VUJyB8ICdkZWxldGUnIHwgJ0RFTEVURScgfCAnaGVhZCcgfCAnSEVBRCcgfCAnb3B0aW9ucycgfCAnT1BUSU9OUycgfCAncG9zdCcgfCAnUE9TVCcgfCAncHV0JyB8ICdQVVQnIHwgJ3BhdGNoJyB8ICdQQVRDSCc7XG5cbmNvbnN0IHBhY2thZ2VKc29uID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJyk7XG5cbmNvbnN0IERFRkFVTFRfQ0hVTktfU0laRSA9IDEwMDtcblxuZXhwb3J0IGludGVyZmFjZSBJQ29uZmlnIHtcblx0Y29uY3VycmVuY3lMaW1pdD86IG51bWJlcjtcblx0ZW52aXJvbm1lbnQ/OiBzdHJpbmc7XG5cdHJhdGVMaW1pdGluZzogYm9vbGVhbjtcblx0cmVxdWVzdD86IChvcHRzOiBJR2VuZXJpY09wdGlvbnMpID0+IFByb21pc2U8SVJlc3BvbnNlPjtcblx0YmVmb3JlUmVxdWVzdD86IChvcHRzOiBhbnkpID0+IGFueTtcblx0YWZ0ZXJSZXF1ZXN0PzogKG9wdHM6IGFueSkgPT4gYW55O1xuXHR0YXJnZXQ6IHN0cmluZztcblx0dGltZW91dD86IG51bWJlcjtcblx0dG9rZW4/OiBzdHJpbmc7XG5cdHVzZXJBZ2VudD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJR2VuZXJpY09wdGlvbnMge1xuXHRhdXRoPzogYW55O1xuXHRlbmNvZGVQYXJhbXM/OiBib29sZWFuO1xuXHRoZWFkZXJzPzoge307XG5cdG1pbWVUeXBlPzogc3RyaW5nO1xuXHRub0F1dGg/OiBhbnk7XG5cdG51bUVsZW1lbnRzPzogbnVtYmVyO1xuXHRwYXJhbXM/OiB7fTtcblx0c3RhcnRFbGVtZW50PzogbnVtYmVyO1xuXHR0aW1lb3V0PzogbnVtYmVyO1xuXHR1cmk6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9uc1dpdGhQYXlsb2FkIGV4dGVuZHMgSUdlbmVyaWNPcHRpb25zIHtcblx0Ym9keT86IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUmVxdWVzdE9wdGlvbnMgZXh0ZW5kcyBJT3B0aW9uc1dpdGhQYXlsb2FkIHtcblx0bWV0aG9kOiBNZXRob2Q7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlcXVlc3RPcHRpb25zSW50ZXJuYWwge1xuXHRhdXRoPzogYm9vbGVhbjtcblx0Ym9keTogb2JqZWN0O1xuXHRlbmNvZGVQYXJhbXM6IGJvb2xlYW47XG5cdGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cdG1ldGhvZDogTWV0aG9kO1xuXHRtaW1lVHlwZT86IHN0cmluZztcblx0bm9BdXRoPzogYm9vbGVhbjtcblx0bnVtRWxlbWVudHM/OiBudW1iZXI7XG5cdHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblx0cmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuO1xuXHRzdGFydEVsZW1lbnQ/OiBudW1iZXI7XG5cdHRpbWVvdXQ6IG51bWJlcjtcblx0dXJpOiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIF9oYXNWYWx1ZSh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG5cdHJldHVybiAhKF8uaXNOdWxsKHZhbHVlKSB8fCBfLmlzVW5kZWZpbmVkKHZhbHVlKSk7XG59XG5cbmZ1bmN0aW9uIF9pc0ludGVnZXIodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gcGFyc2VJbnQodmFsdWUsIDEwKSA9PT0gK3ZhbHVlO1xufVxuXG5mdW5jdGlvbiBfbm9ybWFsaXplT3B0cyhvcHRzOiBJR2VuZXJpY09wdGlvbnMgfCBzdHJpbmcsIGV4dGVuZE9wdHM6IElHZW5lcmljT3B0aW9ucyk6IElSZXF1ZXN0T3B0aW9ucyB7XG5cdGNvbnN0IG5ld09wdHMgPSBfLmlzU3RyaW5nKG9wdHMpXG5cdFx0PyB7XG5cdFx0XHRcdHVyaTogb3B0cyxcblx0XHQgIH1cblx0XHQ6IG9wdHMgfHwge307XG5cdHJldHVybiBfLmFzc2lnbih7IG1ldGhvZDogbnVsbCB9LCBuZXdPcHRzLCBleHRlbmRPcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXR1c09rKGJvZHkpIHtcblx0cmV0dXJuICEhYm9keSAmJiAhIWJvZHkucmVzcG9uc2UgJiYgYm9keS5yZXNwb25zZS5zdGF0dXMgPT09ICdPSyc7XG59XG5cbmZ1bmN0aW9uIF9fcmVxdWVzdChvcHRzOiBJUmVxdWVzdE9wdGlvbnNJbnRlcm5hbCk6IFByb21pc2U8SVJlc3BvbnNlPiB7XG5cdGNvbnN0IF9zZWxmID0gdGhpcztcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuXHRcdGlmIChfLmlzRW1wdHkoX3NlbGYuX2NvbmZpZy50YXJnZXQpKSB7XG5cdFx0XHRyZXR1cm4gcmVqZWN0KG5ldyBlcnJvcnMuVGFyZ2V0RXJyb3IoJ1RhcmdldCBub3Qgc2V0JywgbnVsbCkpO1xuXHRcdH1cblxuXHRcdC8vIFZhbGlkYXRlIE9wdHNcblx0XHRfLmZvckVhY2goXy5waWNrKG9wdHMsIFsnc3RhcnRFbGVtZW50JywgJ251bUVsZW1lbnRzJ10pLCAodmFsdWUsIG9wdCkgPT4ge1xuXHRcdFx0aWYgKF9oYXNWYWx1ZSh2YWx1ZSkgJiYgIV9pc0ludGVnZXIodmFsdWUpKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QobmV3IGVycm9ycy5Bcmd1bWVudEVycm9yKG9wdHMsICdJbnZhbGlkICcgKyBvcHQpKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0pO1xuXG5cdFx0Ly8gQ29uZmlndXJlIE9wdGlvbnNcblx0XHRsZXQgcmVxT3B0czogSVJlcXVlc3RPcHRpb25zSW50ZXJuYWwgPSB7XG5cdFx0XHRtZXRob2Q6IG9wdHMubWV0aG9kIHx8ICdHRVQnLFxuXHRcdFx0dXJpOiB1cmxKb2luKF9zZWxmLl9jb25maWcudGFyZ2V0LCBfLnRyaW1TdGFydChvcHRzLnVyaSwgJy8nKSksXG5cdFx0XHR0aW1lb3V0OiBvcHRzLnRpbWVvdXQgfHwgX3NlbGYuX2NvbmZpZy50aW1lb3V0LFxuXHRcdFx0cmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSxcblx0XHRcdGhlYWRlcnM6IHsgLi4uX3NlbGYuX2NvbmZpZy5oZWFkZXJzIH0sXG5cdFx0XHRwYXJhbXM6IHsgLi4ub3B0cy5wYXJhbXMgfSxcblx0XHRcdGJvZHk6IG9wdHMuYm9keSxcblx0XHRcdGVuY29kZVBhcmFtczogXy5nZXQob3B0cywgJ2VuY29kZVBhcmFtcycsIGZhbHNlKSxcblx0XHR9O1xuXG5cdFx0aWYgKF9zZWxmLl9jb25maWcudXNlckFnZW50KSB7XG5cdFx0XHRyZXFPcHRzLmhlYWRlcnNbJ1VzZXItQWdlbnQnXSA9IF9zZWxmLl9jb25maWcudXNlckFnZW50O1xuXHRcdH1cblxuXHRcdGlmICghb3B0cy5ub0F1dGggJiYgIW9wdHMuYXV0aCAmJiBfc2VsZi5fY29uZmlnLnRva2VuKSB7XG5cdFx0XHRyZXFPcHRzLmhlYWRlcnMuQXV0aG9yaXphdGlvbiA9IF9zZWxmLl9jb25maWcudG9rZW47XG5cdFx0fVxuXG5cdFx0aWYgKG9wdHMubWltZVR5cGUpIHtcblx0XHRcdHJlcU9wdHMuaGVhZGVycy5BY2NlcHQgPSBvcHRzLm1pbWVUeXBlO1xuXHRcdFx0aWYgKG9wdHMubWV0aG9kID09PSAnUE9TVCcgfHwgb3B0cy5tZXRob2QgPT09ICdQVVQnKSB7XG5cdFx0XHRcdHJlcU9wdHMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSBvcHRzLm1pbWVUeXBlO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBEZWZhdWx0IEFjY2VwdCB0byBhcHBsaWNhdGlvbi9qc29uXG5cdFx0XHRyZXFPcHRzLmhlYWRlcnMuQWNjZXB0ID0gXy5nZXQob3B0cywgJ2hlYWRlcnMuQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuXHRcdFx0Ly8gRGVmYXVsdCBDb250ZW50LVR5cGUgdG8gYXBwbGljYXRpb24vanNvbiBmb3IgUE9TVHMgYW5kIFBVVHNcblx0XHRcdGlmIChyZXFPcHRzLm1ldGhvZCA9PT0gJ1BPU1QnIHx8IHJlcU9wdHMubWV0aG9kID09PSAnUFVUJykge1xuXHRcdFx0XHRyZXFPcHRzLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gXy5nZXQob3B0cywgJ2hlYWRlcnMuQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXFPcHRzLmhlYWRlcnMgPSBfLmFzc2lnbih7fSwgcmVxT3B0cy5oZWFkZXJzLCBvcHRzLmhlYWRlcnMpO1xuXG5cdFx0Ly8gQ29uZmlndXJlIFBhcmFtZXRlcnNcblx0XHRpZiAoX2hhc1ZhbHVlKG9wdHMuc3RhcnRFbGVtZW50KSkge1xuXHRcdFx0cmVxT3B0cy5wYXJhbXMuc3RhcnRfZWxlbWVudCA9ICgrb3B0cy5zdGFydEVsZW1lbnQpLnRvU3RyaW5nKCk7XG5cdFx0fVxuXHRcdGlmIChfaGFzVmFsdWUob3B0cy5udW1FbGVtZW50cykpIHtcblx0XHRcdHJlcU9wdHMucGFyYW1zLm51bV9lbGVtZW50cyA9ICgrb3B0cy5udW1FbGVtZW50cykudG9TdHJpbmcoKTtcblx0XHRcdHJlcU9wdHMucGFyYW1zLnN0YXJ0X2VsZW1lbnQgPSAoK29wdHMuc3RhcnRFbGVtZW50IHx8IHJlcU9wdHMucGFyYW1zLnN0YXJ0X2VsZW1lbnQgfHwgMCkudG9TdHJpbmcoKTsgLy8gc3RhcnRFbGVtZW50IGlzIHJlcXVpcmVkIGlmIG51bUVsZW1lbnRzIGlzIHNldFxuXHRcdH1cblxuXHRcdGNvbnN0IHBhcmFtcyA9IHF1ZXJ5LnN0cmluZ2lmeShyZXFPcHRzLnBhcmFtcywgeyBlbmNvZGU6IHJlcU9wdHMuZW5jb2RlUGFyYW1zIH0pO1xuXG5cdFx0aWYgKHBhcmFtcyAhPT0gJycpIHtcblx0XHRcdHJlcU9wdHMudXJpICs9ICFvcHRzLnVyaS5pbmNsdWRlcygnPycpID8gJz8nIDogJyYnO1xuXHRcdFx0cmVxT3B0cy51cmkgKz0gcGFyYW1zO1xuXHRcdH1cblxuXHRcdGlmIChfc2VsZi5fY29uZmlnLmJlZm9yZVJlcXVlc3QpIHtcblx0XHRcdGNvbnN0IGJlZm9yZVJlcXVlc3RPcHRzID0gX3NlbGYuX2NvbmZpZy5iZWZvcmVSZXF1ZXN0KHJlcU9wdHMpO1xuXHRcdFx0aWYgKGJlZm9yZVJlcXVlc3RPcHRzKSB7XG5cdFx0XHRcdHJlcU9wdHMgPSBfLmFzc2lnbih7fSwgcmVxT3B0cywgYmVmb3JlUmVxdWVzdE9wdHMpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBfc2VsZi5fY29uZmlnXG5cdFx0XHQucmVxdWVzdChyZXFPcHRzKVxuXHRcdFx0LnRoZW4oKHJlcykgPT4ge1xuXHRcdFx0XHRjb25zdCB0b3RhbFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcblxuXHRcdFx0XHRsZXQgbmV3UmVzOiBJUmVzcG9uc2UgPSBfLmFzc2lnbihcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRyZXF1ZXN0VGltZTogcmVzLnJlcXVlc3RUaW1lIHx8IHRvdGFsVGltZSxcblx0XHRcdFx0XHRcdHRvdGFsVGltZTogbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRyZXMsXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0aWYgKF9zZWxmLl9jb25maWcuYWZ0ZXJSZXF1ZXN0KSB7XG5cdFx0XHRcdFx0Y29uc3QgYWZ0ZXJSZXF1ZXN0UmVzID0gX3NlbGYuX2NvbmZpZy5hZnRlclJlcXVlc3QobmV3UmVzKTtcblx0XHRcdFx0XHRpZiAoYWZ0ZXJSZXF1ZXN0UmVzKSB7XG5cdFx0XHRcdFx0XHRuZXdSZXMgPSBfLmFzc2lnbih7fSwgbmV3UmVzLCBhZnRlclJlcXVlc3RSZXMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChuZXdSZXMuc3RhdHVzQ29kZSA+PSA0MDApIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGVycm9ycy5idWlsZEVycm9yKG51bGwsIHJlcU9wdHMsIG5ld1JlcykpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gVGVtcG9yYXJ5IGZpeFxuXHRcdFx0XHRsZXQgZXJyb3JJZDtcblx0XHRcdFx0bGV0IGVycm9yQ29kZTtcblx0XHRcdFx0aWYgKG5ld1Jlcy5ib2R5ICYmIG5ld1Jlcy5ib2R5LnJlc3BvbnNlICYmIG5ld1Jlcy5ib2R5LnJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0ZXJyb3JJZCA9IG5ld1Jlcy5ib2R5LnJlc3BvbnNlLmVycm9yX2lkO1xuXHRcdFx0XHRcdGVycm9yQ29kZSA9IG5ld1Jlcy5ib2R5LnJlc3BvbnNlLmVycm9yX2NvZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGVycm9ySWQgPT09ICdTWVNURU0nICYmIGVycm9yQ29kZSA9PT0gJ1NFUlZJQ0VfVU5BVkFJTEFCTEUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlamVjdChlcnJvcnMuYnVpbGRFcnJvcihudWxsLCByZXFPcHRzLCBuZXdSZXMpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZXJyb3JJZCA9PT0gJ1NZU1RFTScgJiYgZXJyb3JDb2RlID09PSAnVU5LTk9XTicpIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KGVycm9ycy5idWlsZEVycm9yKG51bGwsIHJlcU9wdHMsIG5ld1JlcykpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bmV3UmVzLnJlcSA9IHJlcU9wdHM7XG5cblx0XHRcdFx0cmV0dXJuIHJlc29sdmUobmV3UmVzKTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRsZXQgbmV3RXJyID0gZXJyO1xuXHRcdFx0XHRpZiAoX3NlbGYuX2NvbmZpZy5hZnRlclJlcXVlc3QpIHtcblx0XHRcdFx0XHRuZXdFcnIgPSBfc2VsZi5fY29uZmlnLmFmdGVyUmVxdWVzdChlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiByZWplY3QoZXJyb3JzLmJ1aWxkUmVxdWVzdEVycm9yKG5ld0VyciwgcmVxT3B0cykpO1xuXHRcdFx0fSk7XG5cdH0pO1xufVxuXG5leHBvcnQgY2xhc3MgQW54QXBpIHtcblx0cHVibGljIF9jb25maWc6IElDb25maWc7XG5cblx0Y29uc3RydWN0b3IoY29uZmlnOiBJQ29uZmlnKSB7XG5cdFx0dGhpcy5fY29uZmlnID0gXy5kZWZhdWx0cyh7fSwgY29uZmlnLCB7XG5cdFx0XHRyZXF1ZXN0OiBheGlvc0FkYXB0ZXIoe1xuXHRcdFx0XHRmb3JjZUh0dHBBZGFwdG9yOiBjb25maWcuZW52aXJvbm1lbnQgPT09ICdub2RlJyxcblx0XHRcdH0pLFxuXHRcdFx0dXNlckFnZW50OiAnYW54LWFwaS8nICsgcGFja2FnZUpzb24udmVyc2lvbixcblx0XHRcdHRpbWVvdXQ6IDYwICogMTAwMCxcblx0XHRcdGhlYWRlcnM6IHt9LFxuXHRcdFx0dGFyZ2V0OiBudWxsLFxuXHRcdFx0dG9rZW46IG51bGwsXG5cdFx0XHRyYXRlTGltaXRpbmc6IHRydWUsXG5cdFx0XHRjaHVua1NpemU6IERFRkFVTFRfQ0hVTktfU0laRSxcblx0XHR9KTtcblxuXHRcdHRoaXMucmVxdWVzdCA9IF9fcmVxdWVzdDtcblxuXHRcdC8vIEluc3RhbGwgb3B0aW9uYWwgcmF0ZSBsaW1pdGluZyBhZGFwdGVyXG5cdFx0dGhpcy5yZXF1ZXN0ID0gdGhpcy5fY29uZmlnLnJhdGVMaW1pdGluZ1xuXHRcdFx0PyByYXRlTGltaXRBZGFwdGVyKFxuXHRcdFx0XHRcdF8uYXNzaWduKHt9LCBjb25maWcsIHtcblx0XHRcdFx0XHRcdHJlcXVlc3Q6IF9fcmVxdWVzdC5iaW5kKHRoaXMpLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0ICApXG5cdFx0XHQ6IF9fcmVxdWVzdC5iaW5kKHRoaXMpO1xuXG5cdFx0Ly8gSW5zdGFsbCBvcHRpb25hbCBjb25jdXJyZW5jeSBhZGFwdGVyXG5cdFx0dGhpcy5fY29uZmlnLnJlcXVlc3QgPSB0aGlzLl9jb25maWcuY29uY3VycmVuY3lMaW1pdFxuXHRcdFx0PyBjb25jdXJyZW5jeUFkYXB0ZXIoe1xuXHRcdFx0XHRcdGxpbWl0OiB0aGlzLl9jb25maWcuY29uY3VycmVuY3lMaW1pdCxcblx0XHRcdFx0XHRyZXF1ZXN0OiB0aGlzLl9jb25maWcucmVxdWVzdCxcblx0XHRcdCAgfSlcblx0XHRcdDogdGhpcy5fY29uZmlnLnJlcXVlc3Q7XG5cdH1cblxuXHRwdWJsaWMgX3JlcXVlc3QobWV0aG9kOiBNZXRob2QsIG9wdHM6IElHZW5lcmljT3B0aW9ucyB8IHN0cmluZywgZXh0ZW5kT3B0czogSUdlbmVyaWNPcHRpb25zLCBwYXlsb2FkPyk6IFByb21pc2U8SVJlc3BvbnNlPiB7XG5cdFx0Y29uc3QgbmV3T3B0cyA9IF9ub3JtYWxpemVPcHRzKG9wdHMsIGV4dGVuZE9wdHMpO1xuXHRcdG5ld09wdHMubWV0aG9kID0gbWV0aG9kIHx8IG5ld09wdHMubWV0aG9kIHx8ICdHRVQnO1xuXHRcdGlmIChwYXlsb2FkKSB7XG5cdFx0XHRuZXdPcHRzLmJvZHkgPSBwYXlsb2FkO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5yZXF1ZXN0KG5ld09wdHMpO1xuXHR9XG5cblx0cHVibGljIHJlcXVlc3Qob3B0czogSVJlcXVlc3RPcHRpb25zLCBleHRlbmRPcHRzPzogSUdlbmVyaWNPcHRpb25zKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5fcmVxdWVzdChudWxsLCBvcHRzLCBleHRlbmRPcHRzKTtcblx0fVxuXG5cdHB1YmxpYyBnZXQob3B0czogSUdlbmVyaWNPcHRpb25zIHwgc3RyaW5nLCBleHRlbmRPcHRzPzogSUdlbmVyaWNPcHRpb25zKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5fcmVxdWVzdCgnR0VUJywgb3B0cywgZXh0ZW5kT3B0cyk7XG5cdH1cblxuXHRwdWJsaWMgZ2V0QWxsKG9wdHM6IElHZW5lcmljT3B0aW9ucywgZXh0ZW5kT3B0cz86IElHZW5lcmljT3B0aW9ucyk6IFByb21pc2U8YW55PiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGNvbnN0IG5ld09wdHMgPSBfbm9ybWFsaXplT3B0cyhvcHRzLCBleHRlbmRPcHRzKTtcblx0XHRcdGxldCBudW1FbGVtZW50cyA9IG9wdHMubnVtRWxlbWVudHMgfHwgMTAwO1xuXHRcdFx0bGV0IGZpcnN0T3V0cHV0VGVybTtcblx0XHRcdGxldCBlbGVtZW50cyA9IFtdO1xuXHRcdFx0bGV0IHRvdGFsVGltZSA9IDA7XG5cblx0XHRcdGNvbnN0IGdldEFsbCA9IChzdGFydEVsZW1lbnQpID0+IHtcblx0XHRcdFx0bmV3T3B0cy5zdGFydEVsZW1lbnQgPSBzdGFydEVsZW1lbnQ7XG5cdFx0XHRcdG5ld09wdHMubnVtRWxlbWVudHMgPSBudW1FbGVtZW50cztcblxuXHRcdFx0XHRyZXR1cm4gdGhpcy5nZXQobmV3T3B0cylcblx0XHRcdFx0XHQudGhlbigocmVzKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoIXN0YXR1c09rKHJlcy5ib2R5KSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmVqZWN0KHJlcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb25zdCByZXNwb25zZSA9IHJlcy5ib2R5LnJlc3BvbnNlO1xuXHRcdFx0XHRcdFx0Y29uc3QgY291bnQgPSByZXNwb25zZS5jb3VudCB8fCAwO1xuXHRcdFx0XHRcdFx0Y29uc3Qgb3V0cHV0VGVybSA9IHJlc3BvbnNlLmRiZ19pbmZvLm91dHB1dF90ZXJtO1xuXHRcdFx0XHRcdFx0aWYgKCFmaXJzdE91dHB1dFRlcm0pIHtcblx0XHRcdFx0XHRcdFx0Zmlyc3RPdXRwdXRUZXJtID0gb3V0cHV0VGVybTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bnVtRWxlbWVudHMgPSByZXNwb25zZS5udW1fZWxlbWVudHM7XG5cblx0XHRcdFx0XHRcdHRvdGFsVGltZSArPSByZXNwb25zZS5kYmdfaW5mby50aW1lIHx8IDA7XG5cdFx0XHRcdFx0XHRlbGVtZW50cyA9IGVsZW1lbnRzLmNvbmNhdChyZXNwb25zZVtvdXRwdXRUZXJtXSk7XG5cdFx0XHRcdFx0XHRpZiAoY291bnQgPD0gc3RhcnRFbGVtZW50ICsgbnVtRWxlbWVudHMpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbmV3UmVzcG9uc2UgPSBfLmFzc2lnbihcblx0XHRcdFx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb3VudDogZWxlbWVudHMubGVuZ3RoLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRfZWxlbWVudDogMCxcblx0XHRcdFx0XHRcdFx0XHRcdG51bV9lbGVtZW50czogZWxlbWVudHMubGVuZ3RoLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZGJnX2luZm86IF8uYXNzaWduKHt9LCByZXNwb25zZS5kYmdfaW5mbywge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRvdXRwdXRfdGVybTogZmlyc3RPdXRwdXRUZXJtLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aW1lOiB0b3RhbFRpbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHRuZXdSZXNwb25zZVtmaXJzdE91dHB1dFRlcm1dID0gZWxlbWVudHM7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXNvbHZlKHsgYm9keTogeyByZXNwb25zZTogbmV3UmVzcG9uc2UgfSB9KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBnZXRBbGwoc3RhcnRFbGVtZW50ICsgbnVtRWxlbWVudHMpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKHJlamVjdCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRyZXR1cm4gZ2V0QWxsKDApO1xuXHRcdH0pO1xuXHR9XG5cblx0cHVibGljIHBvc3Qob3B0czogSU9wdGlvbnNXaXRoUGF5bG9hZCB8IHN0cmluZywgcGF5bG9hZD8sIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLl9yZXF1ZXN0KCdQT1NUJywgb3B0cywgZXh0ZW5kT3B0cywgcGF5bG9hZCk7XG5cdH1cblxuXHRwdWJsaWMgcG9zdEFsbChvcHRzOiBJT3B0aW9uc1dpdGhQYXlsb2FkLCBwYXlsb2FkPywgZXh0ZW5kT3B0cz86IElHZW5lcmljT3B0aW9ucyk6IFByb21pc2U8YW55PiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGxldCBudW1FbGVtZW50cyA9IG9wdHMubnVtRWxlbWVudHMgfHwgMTAwO1xuXHRcdFx0bGV0IGZpcnN0T3V0cHV0VGVybSA9IC9jcmVhdGl2ZS1zZWFyY2gvLnRlc3Qob3B0cy51cmkpID8gJ2NyZWF0aXZlcycgOiAnJztcblx0XHRcdGxldCBlbGVtZW50cyA9IFtdO1xuXHRcdFx0bGV0IHRvdGFsVGltZSA9IDA7XG5cblx0XHRcdGNvbnN0IHBvc3RBbGwgPSAoc3RhcnRFbGVtZW50KSA9PiB7XG5cdFx0XHRcdG9wdHMuc3RhcnRFbGVtZW50ID0gc3RhcnRFbGVtZW50O1xuXHRcdFx0XHRvcHRzLm51bUVsZW1lbnRzID0gbnVtRWxlbWVudHM7XG5cblx0XHRcdFx0cmV0dXJuIHRoaXMucG9zdChvcHRzLCBwYXlsb2FkLCBleHRlbmRPcHRzKVxuXHRcdFx0XHRcdC50aGVuKChyZXMpID0+IHtcblx0XHRcdFx0XHRcdGlmICghc3RhdHVzT2socmVzLmJvZHkpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZWplY3QocmVzKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnN0IHJlc3BvbnNlID0gcmVzLmJvZHkucmVzcG9uc2U7XG5cdFx0XHRcdFx0XHRjb25zdCBjb3VudCA9IHJlc3BvbnNlLmNvdW50IHx8IDA7XG5cdFx0XHRcdFx0XHRjb25zdCBvdXRwdXRUZXJtID0gcmVzcG9uc2UuZGJnX2luZm8ub3V0cHV0X3Rlcm07XG5cdFx0XHRcdFx0XHRpZiAoIWZpcnN0T3V0cHV0VGVybSkge1xuXHRcdFx0XHRcdFx0XHRmaXJzdE91dHB1dFRlcm0gPSBvdXRwdXRUZXJtO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRudW1FbGVtZW50cyA9IHJlc3BvbnNlLm51bV9lbGVtZW50cztcblxuXHRcdFx0XHRcdFx0dG90YWxUaW1lICs9IHJlc3BvbnNlLmRiZ19pbmZvLnRpbWUgfHwgMDtcblx0XHRcdFx0XHRcdGVsZW1lbnRzID0gZWxlbWVudHMuY29uY2F0KHJlc3BvbnNlW291dHB1dFRlcm1dKTtcblx0XHRcdFx0XHRcdGlmIChjb3VudCA8PSBzdGFydEVsZW1lbnQgKyBudW1FbGVtZW50cykge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBuZXdSZXNwb25zZSA9IF8uYXNzaWduKFxuXHRcdFx0XHRcdFx0XHRcdHt9LFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvdW50OiBlbGVtZW50cy5sZW5ndGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRzdGFydF9lbGVtZW50OiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0bnVtX2VsZW1lbnRzOiBlbGVtZW50cy5sZW5ndGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRkYmdfaW5mbzogXy5hc3NpZ24oe30sIHJlc3BvbnNlLmRiZ19pbmZvLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG91dHB1dF90ZXJtOiBmaXJzdE91dHB1dFRlcm0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRpbWU6IHRvdGFsVGltZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdG5ld1Jlc3BvbnNlW2ZpcnN0T3V0cHV0VGVybV0gPSBlbGVtZW50cztcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJlc29sdmUoeyBib2R5OiB7IHJlc3BvbnNlOiBuZXdSZXNwb25zZSB9IH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIHBvc3RBbGwoc3RhcnRFbGVtZW50ICsgbnVtRWxlbWVudHMpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKHJlamVjdCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRyZXR1cm4gcG9zdEFsbCgwKTtcblx0XHR9KTtcblx0fVxuXG5cdHB1YmxpYyBwdXQob3B0czogSU9wdGlvbnNXaXRoUGF5bG9hZCB8IHN0cmluZywgcGF5bG9hZD8sIGV4dGVuZE9wdHM/OiBJR2VuZXJpY09wdGlvbnMpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLl9yZXF1ZXN0KCdQVVQnLCBvcHRzLCBleHRlbmRPcHRzLCBwYXlsb2FkKTtcblx0fVxuXG5cdHB1YmxpYyBkZWxldGUob3B0czogSUdlbmVyaWNPcHRpb25zIHwgc3RyaW5nLCBleHRlbmRPcHRzPzogSUdlbmVyaWNPcHRpb25zKTogUHJvbWlzZTxJUmVzcG9uc2U+IHtcblx0XHRyZXR1cm4gdGhpcy5fcmVxdWVzdCgnREVMRVRFJywgb3B0cywgZXh0ZW5kT3B0cyk7XG5cdH1cblxuXHRwdWJsaWMgbG9naW4odXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgcmVxT3B0cyA9IHtcblx0XHRcdGF1dGg6IHtcblx0XHRcdFx0dXNlcm5hbWUsXG5cdFx0XHRcdHBhc3N3b3JkLFxuXHRcdFx0fSxcblx0XHR9O1xuXHRcdHJldHVybiB0aGlzLnBvc3QoJy9hdXRoJywgcmVxT3B0cykudGhlbigocmVzKSA9PiB7XG5cdFx0XHRpZiAocmVzLnN0YXR1c0NvZGUgPT09IDIwMCAmJiBzdGF0dXNPayhyZXMuYm9keSkpIHtcblx0XHRcdFx0dGhpcy5fY29uZmlnLnRva2VuID0gcmVzLmJvZHkucmVzcG9uc2UudG9rZW47XG5cdFx0XHRcdHJldHVybiB0aGlzLl9jb25maWcudG9rZW47XG5cdFx0XHR9XG5cdFx0XHR0aHJvdyBlcnJvcnMuYnVpbGRFcnJvcihudWxsLCByZXFPcHRzLCByZXMpO1xuXHRcdH0pO1xuXHR9XG5cblx0cHVibGljIHN3aXRjaFVzZXIodXNlcklkOiBudW1iZXIpOiBQcm9taXNlPElSZXNwb25zZT4ge1xuXHRcdHJldHVybiB0aGlzLnBvc3QoJy9hdXRoJywge1xuXHRcdFx0YXV0aDoge1xuXHRcdFx0XHRzd2l0Y2hfdG9fdXNlcjogdXNlcklkLFxuXHRcdFx0fSxcblx0XHR9KTtcblx0fVxufVxuIl19