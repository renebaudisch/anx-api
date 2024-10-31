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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildError = exports.buildRequestError = exports.ArgumentError = exports.ConnectionRefusedError = exports.ConnectionResetError = exports.ConnectionTimeoutError = exports.SocketTimeoutError = exports.ConnectionAbortedError = exports.DNSLookupError = exports.NetworkError = exports.TargetError = exports.SystemUnknownError = exports.SystemServiceUnavailableError = exports.RateLimitExceededError = exports.NotAuthenticatedError = exports.NotAuthorizedError = exports.ApiError = void 0;
const _ = __importStar(require("lodash"));
// Api Errors
class ApiError extends Error {
    constructor(req, res, customMessage) {
        super();
        this.name = 'ApiError';
        this.isAnxApi = true;
        this.isApiError = true;
        // Error.captureStackTrace not supported in Firefox
        // tslint:disable-next-line
        Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
        let response;
        let id;
        let code;
        let message;
        let description;
        if (_.isObject(res)) {
            this.statusCode = res.statusCode;
            // Traverse through general API JSON Response
            if (res.body && res.body.response) {
                response = res.body.response; // res is raw api response
            }
            else if (res.response) {
                response = res.response; // res is body
            }
            else {
                response = res;
            }
            // Extract values from object - duck type check
            if (response.hasOwnProperty('error_id')) {
                // Api Response
                id = response.error_id;
                code = response.error_code;
                message = response.error;
                description = response.error_description;
            }
            else if (response.hasOwnProperty('id')) {
                // Simple Object
                id = response.id;
                code = response.code;
                message = response.message;
                description = response.description;
            }
        }
        this.id = id;
        this.code = code;
        this.message = message || customMessage;
        this.description = description || null;
        this.req = req;
        this.res = res;
    }
}
exports.ApiError = ApiError;
class NotAuthorizedError extends ApiError {
    constructor(req, res) {
        super(req, res, 'Authorization failed');
        this.name = 'NotAuthorizedError';
    }
}
exports.NotAuthorizedError = NotAuthorizedError;
// NotAuthenticated extends NotAuthorized for backwards compatibility
class NotAuthenticatedError extends ApiError {
    constructor(req, res) {
        super(req, res, 'Authentication failed');
        this.name = 'NotAuthenticatedError';
    }
}
exports.NotAuthenticatedError = NotAuthenticatedError;
class RateLimitExceededError extends ApiError {
    constructor(req, res) {
        super(req, res, 'Rate Limit Exceeded');
        this.name = 'RateLimitExceededError';
        this.retryAfter = res.headers && res.headers['retry-after'] && parseInt(res.headers['retry-after'], 10);
    }
}
exports.RateLimitExceededError = RateLimitExceededError;
class SystemServiceUnavailableError extends ApiError {
    constructor(req, res) {
        super(req, res, 'Service Unavailable');
        this.name = 'SystemServiceUnavailableError';
    }
}
exports.SystemServiceUnavailableError = SystemServiceUnavailableError;
class SystemUnknownError extends ApiError {
    constructor(req, res) {
        super(req, res, 'Unknown');
        this.name = 'SystemUnknownError';
    }
}
exports.SystemUnknownError = SystemUnknownError;
class TargetError extends ApiError {
}
exports.TargetError = TargetError;
// Network Errors
class NetworkError extends Error {
    constructor(err, req) {
        super();
        this.name = 'NetworkError';
        this.isAnxApi = true;
        this.isNetworkError = true;
        this.err = err;
        this.req = req;
    }
}
exports.NetworkError = NetworkError;
class DNSLookupError extends NetworkError {
    constructor(err, req) {
        super(err, req);
        this.name = 'DNSLookupError';
        this.message = 'DNS Lookup Error: ' + err.hostname;
    }
}
exports.DNSLookupError = DNSLookupError;
class ConnectionAbortedError extends NetworkError {
    constructor() {
        super(...arguments);
        this.name = 'ConnectionAbortedError';
        this.message = 'Connection Aborted Error';
    }
}
exports.ConnectionAbortedError = ConnectionAbortedError;
class SocketTimeoutError extends NetworkError {
    constructor() {
        super(...arguments);
        this.name = 'SocketTimeoutError';
        this.message = 'Timeout Error';
    }
}
exports.SocketTimeoutError = SocketTimeoutError;
class ConnectionTimeoutError extends NetworkError {
    constructor() {
        super(...arguments);
        this.name = 'ConnectionTimeoutError';
        this.message = 'Connection Timeout Error';
    }
}
exports.ConnectionTimeoutError = ConnectionTimeoutError;
class ConnectionResetError extends NetworkError {
    constructor() {
        super(...arguments);
        this.name = 'ConnectionResetError';
        this.message = 'Connection Reset Error';
    }
}
exports.ConnectionResetError = ConnectionResetError;
class ConnectionRefusedError extends NetworkError {
    constructor() {
        super(...arguments);
        this.name = 'ConnectionRefusedError';
        this.message = 'Connection Refused Error';
    }
}
exports.ConnectionRefusedError = ConnectionRefusedError;
// Argument Errors
class ArgumentError extends Error {
    constructor(req, message) {
        super();
        this.name = 'ArgumentError';
        this.isAnxApi = true;
        this.isArgumentError = true;
        this.message = message;
        this.req = req;
    }
}
exports.ArgumentError = ArgumentError;
function buildRequestError(err, req) {
    let error = err;
    if (err.code) {
        const networkError = err;
        if (networkError.code === 'ENOTFOUND') {
            error = new DNSLookupError(err, req);
        }
        else if (networkError.code === 'ECONNABORTED') {
            error = new ConnectionAbortedError(err, req);
        }
        else if (networkError.code === 'ECONNREFUSED') {
            error = new ConnectionRefusedError(err, req);
        }
        else if (networkError.code === 'ECONNRESET') {
            error = new ConnectionResetError(err, req);
        }
        else if (networkError.code === 'ETIMEDOUT') {
            error = new ConnectionTimeoutError(err, req);
        }
        else if (networkError.code === 'ESOCKETTIMEDOUT') {
            error = new SocketTimeoutError(err, req);
        }
    }
    return error;
}
exports.buildRequestError = buildRequestError;
// Build error from root response
// https://wiki.appnexus.com/display/adnexusdocumentation/API+Semantics#APISemantics-Errors
const buildError = (err, req, res) => {
    let error;
    let statusCode;
    let errorId;
    let errorCode;
    if (res) {
        statusCode = res.statusCode;
        if (res.body && res.body.response) {
            errorId = res.body.response.error_id;
            errorCode = res.body.response.error_code;
        }
    }
    if (statusCode || errorId) {
        // Differentiating Authentication vs Authorization [http://stackoverflow.com/a/6937030/2483105]
        if (statusCode === 401 || errorId === 'NOAUTH') {
            error = new NotAuthenticatedError(req, res);
        }
        else if (statusCode === 403 || errorId === 'UNAUTH') {
            error = new NotAuthorizedError(req, res);
        }
        else if (errorId === 'SYSTEM' && errorCode === 'SERVICE_UNAVAILABLE') {
            error = new SystemServiceUnavailableError(req, res);
        }
        else if (statusCode === 405 || statusCode === 429) {
            // Legacy code 405
            error = new RateLimitExceededError(req, res);
        }
        else if (errorId === 'SYSTEM' && errorCode === 'RATE_EXCEEDED') {
            // Legacy rate limit detection pre 1.17
            error = new RateLimitExceededError(req, res);
        }
        else if (errorId === 'SYSTEM' && errorCode === 'UNKNOWN') {
            error = new SystemUnknownError(req, res);
        }
    }
    if (error) {
        return error;
    }
    return new ApiError(req, res, 'Unknown Api Error');
};
exports.buildError = buildError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2Vycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUk1QixhQUFhO0FBRWIsTUFBYSxRQUFTLFNBQVEsS0FBSztJQVlsQyxZQUFZLEdBQVEsRUFBRSxHQUFjLEVBQUUsYUFBc0I7UUFDM0QsS0FBSyxFQUFFLENBQUM7UUFaRixTQUFJLEdBQUcsVUFBVSxDQUFDO1FBQ2xCLGFBQVEsR0FBRyxJQUFJLENBQUM7UUFDaEIsZUFBVSxHQUFHLElBQUksQ0FBQztRQVl4QixtREFBbUQ7UUFDbkQsMkJBQTJCO1FBQzNCLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUUzRSxJQUFJLFFBQVEsQ0FBQztRQUNiLElBQUksRUFBRSxDQUFDO1FBQ1AsSUFBSSxJQUFJLENBQUM7UUFDVCxJQUFJLE9BQU8sQ0FBQztRQUNaLElBQUksV0FBVyxDQUFDO1FBRWhCLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNwQixJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUM7WUFFakMsNkNBQTZDO1lBQzdDLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDbEMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsMEJBQTBCO2FBQ3hEO2lCQUFNLElBQUssR0FBVyxDQUFDLFFBQVEsRUFBRTtnQkFDakMsUUFBUSxHQUFJLEdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxjQUFjO2FBQ2hEO2lCQUFNO2dCQUNOLFFBQVEsR0FBRyxHQUFHLENBQUM7YUFDZjtZQUVELCtDQUErQztZQUMvQyxJQUFJLFFB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SSxTQUFTLEtBQUsscUJBQXFCLEVBQUU7WUFDdkUsS0FBSyxHQUFHLElBQUksNkJBQTZCLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3BEO2FBQU0sSUFBSSxVQUFVLEtBQUssR0FBRyxJQUFJLFVBQVUsS0FBSyxHQUFHLEVBQUU7WUFDcEQsa0JBQWtCO1lBQ2xCLEtBQUssR0FBRyxJQUFJLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUM3QzthQUFNLElBQUksT0FBTyxLQUFLLFFBQVEsSUFBSSxTQUFTLEtBQUssZUFBZSxFQUFFO1lBQ2pFLHVDQUF1QztZQUN2QyxLQUFLLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDN0M7YUFBTSxJQUFJLE9BQU8sS0FBSyxRQUFRLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzRCxLQUFLLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDekM7S0FDRDtJQUVELElBQUksS0FBSyxFQUFFO1FBQ1YsT0FBTyxLQUFLLENBQUM7S0FDYjtJQUVELE9BQU8sSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3BELENBQUMsQ0FBQztBQXhDVyxRQUFBLFVBQVUsY0F3Q3JCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgeyBJUmVzcG9uc2UgfSBmcm9tICcuL3R5cGVzJztcblxuLy8gQXBpIEVycm9yc1xuXG5leHBvcnQgY2xhc3MgQXBpRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG5cdHB1YmxpYyBuYW1lID0gJ0FwaUVycm9yJztcblx0cHVibGljIGlzQW54QXBpID0gdHJ1ZTtcblx0cHVibGljIGlzQXBpRXJyb3IgPSB0cnVlO1xuXHRwdWJsaWMgaWQ7XG5cdHB1YmxpYyBzdGF0dXNDb2RlOiBudW1iZXI7XG5cdHB1YmxpYyBjb2RlO1xuXHRwdWJsaWMgZGVzY3JpcHRpb247XG5cdHB1YmxpYyByZXNwb25zZTtcblx0cHVibGljIHJlcTtcblx0cHVibGljIHJlcztcblxuXHRjb25zdHJ1Y3RvcihyZXE6IGFueSwgcmVzOiBJUmVzcG9uc2UsIGN1c3RvbU1lc3NhZ2U/OiBzdHJpbmcpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0Ly8gRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2Ugbm90IHN1cHBvcnRlZCBpbiBGaXJlZm94XG5cdFx0Ly8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG5cdFx0RXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgJiYgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG5cblx0XHRsZXQgcmVzcG9uc2U7XG5cdFx0bGV0IGlkO1xuXHRcdGxldCBjb2RlO1xuXHRcdGxldCBtZXNzYWdlO1xuXHRcdGxldCBkZXNjcmlwdGlvbjtcblxuXHRcdGlmIChfLmlzT2JqZWN0KHJlcykpIHtcblx0XHRcdHRoaXMuc3RhdHVzQ29kZSA9IHJlcy5zdGF0dXNDb2RlO1xuXG5cdFx0XHQvLyBUcmF2ZXJzZSB0aHJvdWdoIGdlbmVyYWwgQVBJIEpTT04gUmVzcG9uc2Vcblx0XHRcdGlmIChyZXMuYm9keSAmJiByZXMuYm9keS5yZXNwb25zZSkge1xuXHRcdFx0XHRyZXNwb25zZSA9IHJlcy5ib2R5LnJlc3BvbnNlOyAvLyByZXMgaXMgcmF3IGFwaSByZXNwb25zZVxuXHRcdFx0fSBlbHNlIGlmICgocmVzIGFzIGFueSkucmVzcG9uc2UpIHtcblx0XHRcdFx0cmVzcG9uc2UgPSAocmVzIGFzIGFueSkucmVzcG9uc2U7IC8vIHJlcyBpcyBib2R5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXNwb25zZSA9IHJlcztcblx0XHRcdH1cblxuXHRcdFx0Ly8gRXh0cmFjdCB2YWx1ZXMgZnJvbSBvYmplY3QgLSBkdWNrIHR5cGUgY2hlY2tcblx0XHRcdGlmIChyZXNwb25zZS5oYXNPd25Qcm9wZXJ0eSgnZXJyb3JfaWQnKSkge1xuXHRcdFx0XHQvLyBBcGkgUmVzcG9uc2Vcblx0XHRcdFx0aWQgPSByZXNwb25zZS5lcnJvcl9pZDtcblx0XHRcdFx0Y29kZSA9IHJlc3BvbnNlLmVycm9yX2NvZGU7XG5cdFx0XHRcdG1lc3NhZ2UgPSByZXNwb25zZS5lcnJvcjtcblx0XHRcdFx0ZGVzY3JpcHRpb24gPSByZXNwb25zZS5lcnJvcl9kZXNjcmlwdGlvbjtcblx0XHRcdH0gZWxzZSBpZiAocmVzcG9uc2UuaGFzT3duUHJvcGVydHkoJ2lkJykpIHtcblx0XHRcdFx0Ly8gU2ltcGxlIE9iamVjdFxuXHRcdFx0XHRpZCA9IHJlc3BvbnNlLmlkO1xuXHRcdFx0XHRjb2RlID0gcmVzcG9uc2UuY29kZTtcblx0XHRcdFx0bWVzc2FnZSA9IHJlc3BvbnNlLm1lc3NhZ2U7XG5cdFx0XHRcdGRlc2NyaXB0aW9uID0gcmVzcG9uc2UuZGVzY3JpcHRpb247XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMuY29kZSA9IGNvZGU7XG5cdFx0dGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCBjdXN0b21NZXNzYWdlO1xuXHRcdHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbiB8fCBudWxsO1xuXHRcdHRoaXMucmVxID0gcmVxO1xuXHRcdHRoaXMucmVzID0gcmVzO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBOb3RBdXRob3JpemVkRXJyb3IgZXh0ZW5kcyBBcGlFcnJvciB7XG5cdHB1YmxpYyBuYW1lID0gJ05vdEF1dGhvcml6ZWRFcnJvcic7XG5cdGNvbnN0cnVjdG9yKHJlcSwgcmVzKSB7XG5cdFx0c3VwZXIocmVxLCByZXMsICdBdXRob3JpemF0aW9uIGZhaWxlZCcpO1xuXHR9XG59XG5cbi8vIE5vdEF1dGhlbnRpY2F0ZWQgZXh0ZW5kcyBOb3RBdXRob3JpemVkIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuZXhwb3J0IGNsYXNzIE5vdEF1dGhlbnRpY2F0ZWRFcnJvciBleHRlbmRzIEFwaUVycm9yIHtcblx0cHVibGljIG5hbWUgPSAnTm90QXV0aGVudGljYXRlZEVycm9yJztcblx0Y29uc3RydWN0b3IocmVxLCByZXMpIHtcblx0XHRzdXBlcihyZXEsIHJlcywgJ0F1dGhlbnRpY2F0aW9uIGZhaWxlZCcpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBSYXRlTGltaXRFeGNlZWRlZEVycm9yIGV4dGVuZHMgQXBpRXJyb3Ige1xuXHRwdWJsaWMgbmFtZSA9ICdSYXRlTGltaXRFeGNlZWRlZEVycm9yJztcblx0cHVibGljIHJldHJ5QWZ0ZXI7XG5cdGNvbnN0cnVjdG9yKHJlcSwgcmVzKSB7XG5cdFx0c3VwZXIocmVxLCByZXMsICdSYXRlIExpbWl0IEV4Y2VlZGVkJyk7XG5cdFx0dGhpcy5yZXRyeUFmdGVyID0gcmVzLmhlYWRlcnMgJiYgcmVzLmhlYWRlcnNbJ3JldHJ5LWFmdGVyJ10gJiYgcGFyc2VJbnQocmVzLmhlYWRlcnNbJ3JldHJ5LWFmdGVyJ10sIDEwKTtcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgU3lzdGVtU2VydmljZVVuYXZhaWxhYmxlRXJyb3IgZXh0ZW5kcyBBcGlFcnJvciB7XG5cdHB1YmxpYyBuYW1lID0gJ1N5c3RlbVNlcnZpY2VVbmF2YWlsYWJsZUVycm9yJztcblx0Y29uc3RydWN0b3IocmVxLCByZXMpIHtcblx0XHRzdXBlcihyZXEsIHJlcywgJ1NlcnZpY2UgVW5hdmFpbGFibGUnKTtcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgU3lzdGVtVW5rbm93bkVycm9yIGV4dGVuZHMgQXBpRXJyb3Ige1xuXHRwdWJsaWMgbmFtZSA9ICdTeXN0ZW1Vbmtub3duRXJyb3InO1xuXHRjb25zdHJ1Y3RvcihyZXEsIHJlcykge1xuXHRcdHN1cGVyKHJlcSwgcmVzLCAnVW5rbm93bicpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBUYXJnZXRFcnJvciBleHRlbmRzIEFwaUVycm9yIHt9XG5cbi8vIE5ldHdvcmsgRXJyb3JzXG5cbmV4cG9ydCBjbGFzcyBOZXR3b3JrRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG5cdHB1YmxpYyBuYW1lID0gJ05ldHdvcmtFcnJvcic7XG5cdHB1YmxpYyBpc0FueEFwaSA9IHRydWU7XG5cdHB1YmxpYyBpc05ldHdvcmtFcnJvciA9IHRydWU7XG5cdHB1YmxpYyBjb2RlO1xuXHRwdWJsaWMgZXJyO1xuXHRwdWJsaWMgcmVxO1xuXHRjb25zdHJ1Y3RvcihlcnIsIHJlcSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5lcnIgPSBlcnI7XG5cdFx0dGhpcy5yZXEgPSByZXE7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEROU0xvb2t1cEVycm9yIGV4dGVuZHMgTmV0d29ya0Vycm9yIHtcblx0cHVibGljIG5hbWUgPSAnRE5TTG9va3VwRXJyb3InO1xuXHRjb25zdHJ1Y3RvcihlcnIsIHJlcSkge1xuXHRcdHN1cGVyKGVyciwgcmVxKTtcblx0XHR0aGlzLm1lc3NhZ2UgPSAnRE5TIExvb2t1cCBFcnJvcjogJyArIGVyci5ob3N0bmFtZTtcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgQ29ubmVjdGlvbkFib3J0ZWRFcnJvciBleHRlbmRzIE5ldHdvcmtFcnJvciB7XG5cdHB1YmxpYyBuYW1lID0gJ0Nvbm5lY3Rpb25BYm9ydGVkRXJyb3InO1xuXHRwdWJsaWMgbWVzc2FnZSA9ICdDb25uZWN0aW9uIEFib3J0ZWQgRXJyb3InO1xufVxuXG5leHBvcnQgY2xhc3MgU29ja2V0VGltZW91dEVycm9yIGV4dGVuZHMgTmV0d29ya0Vycm9yIHtcblx0cHVibGljIG5hbWUgPSAnU29ja2V0VGltZW91dEVycm9yJztcblx0cHVibGljIG1lc3NhZ2UgPSAnVGltZW91dCBFcnJvcic7XG59XG5cbmV4cG9ydCBjbGFzcyBDb25uZWN0aW9uVGltZW91dEVycm9yIGV4dGVuZHMgTmV0d29ya0Vycm9yIHtcblx0cHVibGljIG5hbWUgPSAnQ29ubmVjdGlvblRpbWVvdXRFcnJvcic7XG5cdHB1YmxpYyBtZXNzYWdlID0gJ0Nvbm5lY3Rpb24gVGltZW91dCBFcnJvcic7XG59XG5cbmV4cG9ydCBjbGFzcyBDb25uZWN0aW9uUmVzZXRFcnJvciBleHRlbmRzIE5ldHdvcmtFcnJvciB7XG5cdHB1YmxpYyBuYW1lID0gJ0Nvbm5lY3Rpb25SZXNldEVycm9yJztcblx0cHVibGljIG1lc3NhZ2UgPSAnQ29ubmVjdGlvbiBSZXNldCBFcnJvcic7XG59XG5cbmV4cG9ydCBjbGFzcyBDb25uZWN0aW9uUmVmdXNlZEVycm9yIGV4dGVuZHMgTmV0d29ya0Vycm9yIHtcblx0cHVibGljIG5hbWUgPSAnQ29ubmVjdGlvblJlZnVzZWRFcnJvcic7XG5cdHB1YmxpYyBtZXNzYWdlID0gJ0Nvbm5lY3Rpb24gUmVmdXNlZCBFcnJvcic7XG59XG5cbi8vIEFyZ3VtZW50IEVycm9yc1xuXG5leHBvcnQgY2xhc3MgQXJndW1lbnRFcnJvciBleHRlbmRzIEVycm9yIHtcblx0cHVibGljIG5hbWUgPSAnQXJndW1lbnRFcnJvcic7XG5cdHB1YmxpYyBpc0FueEFwaSA9IHRydWU7XG5cdHB1YmxpYyBpc0FyZ3VtZW50RXJyb3IgPSB0cnVlO1xuXHRwdWJsaWMgcmVxO1xuXHRjb25zdHJ1Y3RvcihyZXEsIG1lc3NhZ2UpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdFx0dGhpcy5yZXEgPSByZXE7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUmVxdWVzdEVycm9yKGVycjogRXJyb3IsIHJlcSkge1xuXHRsZXQgZXJyb3I6IEVycm9yID0gZXJyO1xuXG5cdGlmICgoZXJyIGFzIGFueSkuY29kZSkge1xuXHRcdGNvbnN0IG5ldHdvcmtFcnJvcjogYW55ID0gZXJyO1xuXHRcdGlmIChuZXR3b3JrRXJyb3IuY29kZSA9PT0gJ0VOT1RGT1VORCcpIHtcblx0XHRcdGVycm9yID0gbmV3IEROU0xvb2t1cEVycm9yKGVyciwgcmVxKTtcblx0XHR9IGVsc2UgaWYgKG5ldHdvcmtFcnJvci5jb2RlID09PSAnRUNPTk5BQk9SVEVEJykge1xuXHRcdFx0ZXJyb3IgPSBuZXcgQ29ubmVjdGlvbkFib3J0ZWRFcnJvcihlcnIsIHJlcSk7XG5cdFx0fSBlbHNlIGlmIChuZXR3b3JrRXJyb3IuY29kZSA9PT0gJ0VDT05OUkVGVVNFRCcpIHtcblx0XHRcdGVycm9yID0gbmV3IENvbm5lY3Rpb25SZWZ1c2VkRXJyb3IoZXJyLCByZXEpO1xuXHRcdH0gZWxzZSBpZiAobmV0d29ya0Vycm9yLmNvZGUgPT09ICdFQ09OTlJFU0VUJykge1xuXHRcdFx0ZXJyb3IgPSBuZXcgQ29ubmVjdGlvblJlc2V0RXJyb3IoZXJyLCByZXEpO1xuXHRcdH0gZWxzZSBpZiAobmV0d29ya0Vycm9yLmNvZGUgPT09ICdFVElNRURPVVQnKSB7XG5cdFx0XHRlcnJvciA9IG5ldyBDb25uZWN0aW9uVGltZW91dEVycm9yKGVyciwgcmVxKTtcblx0XHR9IGVsc2UgaWYgKG5ldHdvcmtFcnJvci5jb2RlID09PSAnRVNPQ0tFVFRJTUVET1VUJykge1xuXHRcdFx0ZXJyb3IgPSBuZXcgU29ja2V0VGltZW91dEVycm9yKGVyciwgcmVxKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZXJyb3I7XG59XG5cbi8vIEJ1aWxkIGVycm9yIGZyb20gcm9vdCByZXNwb25zZVxuLy8gaHR0cHM6Ly93aWtpLmFwcG5leHVzLmNvbS9kaXNwbGF5L2FkbmV4dXNkb2N1bWVudGF0aW9uL0FQSStTZW1hbnRpY3MjQVBJU2VtYW50aWNzLUVycm9yc1xuZXhwb3J0IGNvbnN0IGJ1aWxkRXJyb3IgPSAoZXJyOiBFcnJvciwgcmVxLCByZXMpOiBBcGlFcnJvciB8IE5ldHdvcmtFcnJvciA9PiB7XG5cdGxldCBlcnJvcjogQXBpRXJyb3IgfCBOZXR3b3JrRXJyb3I7XG5cblx0bGV0IHN0YXR1c0NvZGU7XG5cdGxldCBlcnJvcklkO1xuXHRsZXQgZXJyb3JDb2RlO1xuXG5cdGlmIChyZXMpIHtcblx0XHRzdGF0dXNDb2RlID0gcmVzLnN0YXR1c0NvZGU7XG5cblx0XHRpZiAocmVzLmJvZHkgJiYgcmVzLmJvZHkucmVzcG9uc2UpIHtcblx0XHRcdGVycm9ySWQgPSByZXMuYm9keS5yZXNwb25zZS5lcnJvcl9pZDtcblx0XHRcdGVycm9yQ29kZSA9IHJlcy5ib2R5LnJlc3BvbnNlLmVycm9yX2NvZGU7XG5cdFx0fVxuXHR9XG5cblx0aWYgKHN0YXR1c0NvZGUgfHwgZXJyb3JJZCkge1xuXHRcdC8vIERpZmZlcmVudGlhdGluZyBBdXRoZW50aWNhdGlvbiB2cyBBdXRob3JpemF0aW9uIFtodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82OTM3MDMwLzI0ODMxMDVdXG5cdFx0aWYgKHN0YXR1c0NvZGUgPT09IDQwMSB8fCBlcnJvcklkID09PSAnTk9BVVRIJykge1xuXHRcdFx0ZXJyb3IgPSBuZXcgTm90QXV0aGVudGljYXRlZEVycm9yKHJlcSwgcmVzKTtcblx0XHR9IGVsc2UgaWYgKHN0YXR1c0NvZGUgPT09IDQwMyB8fCBlcnJvcklkID09PSAnVU5BVVRIJykge1xuXHRcdFx0ZXJyb3IgPSBuZXcgTm90QXV0aG9yaXplZEVycm9yKHJlcSwgcmVzKTtcblx0XHR9IGVsc2UgaWYgKGVycm9ySWQgPT09ICdTWVNURU0nICYmIGVycm9yQ29kZSA9PT0gJ1NFUlZJQ0VfVU5BVkFJTEFCTEUnKSB7XG5cdFx0XHRlcnJvciA9IG5ldyBTeXN0ZW1TZXJ2aWNlVW5hdmFpbGFibGVFcnJvcihyZXEsIHJlcyk7XG5cdFx0fSBlbHNlIGlmIChzdGF0dXNDb2RlID09PSA0MDUgfHwgc3RhdHVzQ29kZSA9PT0gNDI5KSB7XG5cdFx0XHQvLyBMZWdhY3kgY29kZSA0MDVcblx0XHRcdGVycm9yID0gbmV3IFJhdGVMaW1pdEV4Y2VlZGVkRXJyb3IocmVxLCByZXMpO1xuXHRcdH0gZWxzZSBpZiAoZXJyb3JJZCA9PT0gJ1NZU1RFTScgJiYgZXJyb3JDb2RlID09PSAnUkFURV9FWENFRURFRCcpIHtcblx0XHRcdC8vIExlZ2FjeSByYXRlIGxpbWl0IGRldGVjdGlvbiBwcmUgMS4xN1xuXHRcdFx0ZXJyb3IgPSBuZXcgUmF0ZUxpbWl0RXhjZWVkZWRFcnJvcihyZXEsIHJlcyk7XG5cdFx0fSBlbHNlIGlmIChlcnJvcklkID09PSAnU1lTVEVNJyAmJiBlcnJvckNvZGUgPT09ICdVTktOT1dOJykge1xuXHRcdFx0ZXJyb3IgPSBuZXcgU3lzdGVtVW5rbm93bkVycm9yKHJlcSwgcmVzKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoZXJyb3IpIHtcblx0XHRyZXR1cm4gZXJyb3I7XG5cdH1cblxuXHRyZXR1cm4gbmV3IEFwaUVycm9yKHJlcSwgcmVzLCAnVW5rbm93biBBcGkgRXJyb3InKTtcbn07XG4iXX0=