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
exports.axiosAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const _ = __importStar(require("lodash"));
const httpAdapter = axios_1.default.getAdapter('http');
const axiosAdapter = (config) => (opts) => {
    const url = opts.uri;
    const axiosConfig = {
        url,
        timeout: opts.timeout,
        method: opts.method,
        headers: opts.headers,
    };
    if (config.forceHttpAdaptor) {
        axiosConfig.adapter = httpAdapter;
    }
    if (!_.isUndefined(opts.body)) {
        axiosConfig.data = opts.body;
    }
    const startTime = new Date().getTime();
    return (0, axios_1.default)(axiosConfig)
        .then((res) => {
        return {
            uri: opts.uri,
            statusCode: res.status,
            headers: res.headers,
            body: res.data,
            requestTime: new Date().getTime() - startTime,
        };
    })
        .catch((err) => {
        if (!err.response) {
            throw err;
        }
        return {
            uri: opts.uri,
            statusCode: err.response.status,
            headers: err.response.headers,
            body: err.response.data,
            requestTime: new Date().getTime() - startTime,
        };
    });
};
exports.axiosAdapter = axiosAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXhpb3NBZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2F4aW9zQWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUFrRDtBQUNsRCwwQ0FBNEI7QUFJNUIsTUFBTSxXQUFXLEdBQUcsZUFBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUV0QyxNQUFNLFlBQVksR0FDeEIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUNYLENBQUMsSUFBNkIsRUFBc0IsRUFBRTtJQUNyRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ3JCLE1BQU0sV0FBVyxHQUF1QjtRQUN2QyxHQUFHO1FBQ0gsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1FBQ3JCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtRQUNuQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87S0FDckIsQ0FBQztJQUVGLElBQUksTUFBTSxDQUFDLGdCQUFnQixFQUFFO1FBQzVCLFdBQVcsQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDO0tBQ2xDO0lBRUQsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzlCLFdBQVcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztLQUM3QjtJQUVELE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFFdkMsT0FBTyxJQUFBLGVBQUssRUFBQyxXQUFXLENBQUM7U0FDdkIsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDYixPQUFPO1lBQ04sR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO1lBQ2IsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNO1lBQ3RCLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTztZQUNwQixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7WUFDZCxXQUFXLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxTQUFTO1NBQzdDLENBQUM7SUFDSCxDQUFDLENBQUM7U0FDRCxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQWEsRUFBRTtRQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRTtZQUNsQixNQUFNLEdBQUcsQ0FBQztTQUNWO1FBQ0QsT0FBTztZQUNOLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztZQUNiLFVBQVUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU07WUFDL0IsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTztZQUM3QixJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJO1lBQ3ZCLFdBQVcsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLFNBQVM7U0FDN0MsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBM0NVLFFBQUEsWUFBWSxnQkEyQ3RCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGF4aW9zLCB7IEF4aW9zUmVxdWVzdENvbmZpZyB9IGZyb20gJ2F4aW9zJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IElSZXF1ZXN0T3B0aW9uc0ludGVybmFsIH0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHsgSVJlc3BvbnNlIH0gZnJvbSAnLi90eXBlcyc7XG5cbmNvbnN0IGh0dHBBZGFwdGVyID0gYXhpb3MuZ2V0QWRhcHRlcignaHR0cCcpO1xuXG5leHBvcnQgY29uc3QgYXhpb3NBZGFwdGVyID1cblx0KGNvbmZpZykgPT5cblx0KG9wdHM6IElSZXF1ZXN0T3B0aW9uc0ludGVybmFsKTogUHJvbWlzZTxJUmVzcG9uc2U+ID0+IHtcblx0XHRjb25zdCB1cmwgPSBvcHRzLnVyaTtcblx0XHRjb25zdCBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0ge1xuXHRcdFx0dXJsLFxuXHRcdFx0dGltZW91dDogb3B0cy50aW1lb3V0LFxuXHRcdFx0bWV0aG9kOiBvcHRzLm1ldGhvZCxcblx0XHRcdGhlYWRlcnM6IG9wdHMuaGVhZGVycyxcblx0XHR9O1xuXG5cdFx0aWYgKGNvbmZpZy5mb3JjZUh0dHBBZGFwdG9yKSB7XG5cdFx0XHRheGlvc0NvbmZpZy5hZGFwdGVyID0gaHR0cEFkYXB0ZXI7XG5cdFx0fVxuXG5cdFx0aWYgKCFfLmlzVW5kZWZpbmVkKG9wdHMuYm9keSkpIHtcblx0XHRcdGF4aW9zQ29uZmlnLmRhdGEgPSBvcHRzLmJvZHk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cblx0XHRyZXR1cm4gYXhpb3MoYXhpb3NDb25maWcpXG5cdFx0XHQudGhlbigocmVzKSA9PiB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0dXJpOiBvcHRzLnVyaSxcblx0XHRcdFx0XHRzdGF0dXNDb2RlOiByZXMuc3RhdHVzLFxuXHRcdFx0XHRcdGhlYWRlcnM6IHJlcy5oZWFkZXJzLFxuXHRcdFx0XHRcdGJvZHk6IHJlcy5kYXRhLFxuXHRcdFx0XHRcdHJlcXVlc3RUaW1lOiBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSxcblx0XHRcdFx0fTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goKGVycik6IElSZXNwb25zZSA9PiB7XG5cdFx0XHRcdGlmICghZXJyLnJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0dGhyb3cgZXJyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0dXJpOiBvcHRzLnVyaSxcblx0XHRcdFx0XHRzdGF0dXNDb2RlOiBlcnIucmVzcG9uc2Uuc3RhdHVzLFxuXHRcdFx0XHRcdGhlYWRlcnM6IGVyci5yZXNwb25zZS5oZWFkZXJzLFxuXHRcdFx0XHRcdGJvZHk6IGVyci5yZXNwb25zZS5kYXRhLFxuXHRcdFx0XHRcdHJlcXVlc3RUaW1lOiBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSxcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXHR9O1xuIl19