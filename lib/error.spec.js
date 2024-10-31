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
const nock_1 = __importDefault(require("nock"));
const api_1 = require("./api");
const errors = __importStar(require("./errors"));
describe('Error Types', () => {
    ['ApiError', 'NotAuthenticatedError', 'NotAuthorizedError', 'TargetError'].forEach((errorName) => {
        function assertAnxError(e) {
            expect(e).toBeInstanceOf(Error);
            expect(e).toBeInstanceOf(errors.ApiError);
            ['id', 'code', 'message', 'description'].forEach((prop) => {
                expect(e.hasOwnProperty(prop)).toBe(true);
            });
            expect(e.stack.indexOf('exFn') > 0).toBe(true);
        }
        describe(errorName, () => {
            it('should have proper type and properties', () => {
                try {
                    (function exFn() {
                        throw new errors[errorName]();
                    })();
                }
                catch (e) {
                    assertAnxError(e);
                }
            });
            it('should ignore unknown objects as error data', () => {
                function check(obj) {
                    try {
                        throw new errors[errorName]({}, obj);
                    }
                    catch (e) {
                        expect(typeof e.id === 'undefined').toBe(true);
                        expect(typeof e.code === 'undefined').toBe(true);
                        expect(e.description).toBeNull();
                    }
                }
                check(undefined);
                check({ a: 1 });
                check({ id: undefined });
                check({ error_id: undefined });
                check({ body: undefined });
                check({ body: {} });
                check({ body: { response: undefined } });
                check({ body: { response: {} } });
                check({ body: { response: { id: undefined } } });
                check({ body: { response: { error_id: undefined } } });
            });
            const response = {
                error_id: 'xyz',
                error_code: 'm-n-o-p',
                error: 'something',
                error_description: 'stuff happens',
            };
            function assertErrorInfo(e) {
                expect('xyz').toBe(e.id);
                expect('m-n-o-p').toBe(e.code);
                expect('something').toBe(e.message);
                expect('stuff happens').toBe(e.description);
            }
            it('should accept just object as error data', () => {
                const obj = response;
                try {
                    throw new errors[errorName](null, obj, {});
                }
                catch (e) {
                    assertErrorInfo(e);
                }
            });
            it('should accept body as error data', () => {
                const obj = {
                    response,
                };
                try {
                    throw new errors[errorName](null, obj, {});
                }
                catch (e) {
                    assertErrorInfo(e);
                }
            });
            it('should accept raw api json as error data', () => {
                const obj = {
                    body: {
                        response,
                    },
                };
                try {
                    throw new errors[errorName](null, obj, {});
                }
                catch (e) {
                    assertErrorInfo(e);
                }
            });
            it('should accept simple object as error data', () => {
                const obj = {
                    id: response.error_id,
                    code: response.error_code,
                    message: response.error,
                    description: response.error_description,
                };
                try {
                    throw new errors[errorName](null, obj, {});
                }
                catch (e) {
                    assertErrorInfo(e);
                }
            });
        });
    });
    describe('buildRequestError', () => {
        it('should build ApiError by default', () => {
            expect(errors.buildRequestError(new Error('my generic error'), null)).toBeInstanceOf(Error);
        });
    });
    describe('buildError', () => {
        it('should detect legacy RateLimitExceededError pre 1.17', () => {
            const err = errors.buildError(null, {}, {
                statusCode: 405,
                body: {
                    response: {
                        error_id: 'SYSTEM',
                        error_code: 'RATE_EXCEEDED',
                    },
                },
            });
            expect(err).toBeInstanceOf(errors.RateLimitExceededError);
        });
        [
            {
                name: 'ApiError',
                errorType: errors.ApiError,
                statusCode: 500,
                errorId: 'Z',
                errorMessage: 'Unknown Api Error',
                isApiError: true,
            },
            {
                name: 'NotAuthorizedError',
                errorType: errors.NotAuthorizedError,
                statusCode: 403,
                errorId: 'UNAUTH',
                errorMessage: 'Authorization failed',
                isApiError: true,
            },
            {
                name: 'NotAuthenticatedError',
                errorType: errors.NotAuthenticatedError,
                statusCode: 401,
                errorId: 'NOAUTH',
                errorMessage: 'Authentication failed',
                isApiError: true,
            },
            {
                name: 'RateLimitExceededError',
                errorType: errors.RateLimitExceededError,
                statusCode: 429,
                errorId: 'SYSTEM',
                errorCode: 'RATE_EXCEEDED',
                errorMessage: 'Rate Limit Exceeded',
                isApiError: true,
            },
        ].forEach((errorSpec) => {
            it('should build ' + errorSpec.name, () => {
                function check(err) {
                    expect(err.name).toEqual(errorSpec.name);
                    expect(err.message).toEqual(errorSpec.errorMessage);
                    expect(err.isApiError).toEqual(errorSpec.isApiError);
                }
                check(errors.buildError(null, {}, { statusCode: errorSpec.statusCode }));
                check(errors.buildError(null, {}, { statusCode: errorSpec.statusCode, body: undefined }));
                check(errors.buildError(null, {}, { statusCode: errorSpec.statusCode, body: {} }));
                check(errors.buildError(null, {}, { statusCode: errorSpec.statusCode, body: { response: undefined } }));
                check(errors.buildError(null, {}, { statusCode: errorSpec.statusCode, body: { response: {} } }));
                check(errors.buildError(null, {}, {
                    statusCode: errorSpec.statusCode,
                    body: { response: { error_id: 'X' } },
                }));
                check(errors.buildError(null, {}, {
                    statusCode: errorSpec.statusCode,
                    body: { response: { error_id: errorSpec.errorId } },
                }));
                check(errors.buildError(null, {}, {
                    statusCode: 200,
                    body: {
                        response: {
                            error_id: errorSpec.errorId,
                            error_code: errorSpec.errorCode,
                        },
                    },
                }));
                check(errors.buildError(null, {}, {
                    body: {
                        response: {
                            error_id: errorSpec.errorId,
                            error_code: errorSpec.errorCode,
                        },
                    },
                }));
            });
        });
    });
    describe('Network Errors', () => {
        it('Should handle dns lookup errors', () => {
            const api = new api_1.AnxApi({
                target: 'http://.com',
                rateLimiting: false,
            });
            return api
                .get('junk')
                .then(() => {
                return new Error('expected error');
            })
                .catch((err) => {
                expect(err).toBeInstanceOf(errors.NetworkError);
                expect(err).toBeInstanceOf(errors.DNSLookupError);
            });
        });
        it('Should handle software timeouts', () => {
            (0, nock_1.default)('http://api.example.com').get('/timeout').delayConnection(2000).reply(200);
            const api = new api_1.AnxApi({
                target: 'http://api.example.com',
                timeout: 500,
                rateLimiting: false,
            });
            return api
                .get('timeout')
                .then(() => {
                return new Error('expected error');
            })
                .catch((err) => {
                expect(err).toBeInstanceOf(errors.NetworkError);
                expect(err).toBeInstanceOf(errors.ConnectionAbortedError);
            });
        });
        it.skip('SocketTimeoutError', () => { });
        it.skip('ConnectionTimeoutError', () => { });
        it.skip('ConnectionResetError', () => { });
        it.skip('ConnectionRefusedError', () => { });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3Iuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9lcnJvci5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFFeEIsK0JBQStCO0FBQy9CLGlEQUFtQztBQUVuQyxRQUFRLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtJQUM1QixDQUFDLFVBQVUsRUFBRSx1QkFBdUIsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUNoRyxTQUFTLGNBQWMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDMUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDekQsTUFBTSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUN4QixFQUFFLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO2dCQUNqRCxJQUFJO29CQUNILENBQUMsU0FBUyxJQUFJO3dCQUNiLE1BQU0sSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FB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QUMsQ0FBQyxDQUFDO0lBQzdDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbm9jayBmcm9tICdub2NrJztcblxuaW1wb3J0IHsgQW54QXBpIH0gZnJvbSAnLi9hcGknO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gJy4vZXJyb3JzJztcblxuZGVzY3JpYmUoJ0Vycm9yIFR5cGVzJywgKCkgPT4ge1xuXHRbJ0FwaUVycm9yJywgJ05vdEF1dGhlbnRpY2F0ZWRFcnJvcicsICdOb3RBdXRob3JpemVkRXJyb3InLCAnVGFyZ2V0RXJyb3InXS5mb3JFYWNoKChlcnJvck5hbWUpID0+IHtcblx0XHRmdW5jdGlvbiBhc3NlcnRBbnhFcnJvcihlKSB7XG5cdFx0XHRleHBlY3QoZSkudG9CZUluc3RhbmNlT2YoRXJyb3IpO1xuXHRcdFx0ZXhwZWN0KGUpLnRvQmVJbnN0YW5jZU9mKGVycm9ycy5BcGlFcnJvcik7XG5cdFx0XHRbJ2lkJywgJ2NvZGUnLCAnbWVzc2FnZScsICdkZXNjcmlwdGlvbiddLmZvckVhY2goKHByb3ApID0+IHtcblx0XHRcdFx0ZXhwZWN0KGUuaGFzT3duUHJvcGVydHkocHJvcCkpLnRvQmUodHJ1ZSk7XG5cdFx0XHR9KTtcblx0XHRcdGV4cGVjdChlLnN0YWNrLmluZGV4T2YoJ2V4Rm4nKSA+IDApLnRvQmUodHJ1ZSk7XG5cdFx0fVxuXG5cdFx0ZGVzY3JpYmUoZXJyb3JOYW1lLCAoKSA9PiB7XG5cdFx0XHRpdCgnc2hvdWxkIGhhdmUgcHJvcGVyIHR5cGUgYW5kIHByb3BlcnRpZXMnLCAoKSA9PiB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0KGZ1bmN0aW9uIGV4Rm4oKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgZXJyb3JzW2Vycm9yTmFtZV0oKTtcblx0XHRcdFx0XHR9KSgpO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0YXNzZXJ0QW54RXJyb3IoZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRpdCgnc2hvdWxkIGlnbm9yZSB1bmtub3duIG9iamVjdHMgYXMgZXJyb3IgZGF0YScsICgpID0+IHtcblx0XHRcdFx0ZnVuY3Rpb24gY2hlY2sob2JqKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHRocm93IG5ldyBlcnJvcnNbZXJyb3JOYW1lXSh7fSwgb2JqKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRleHBlY3QodHlwZW9mIGUuaWQgPT09ICd1bmRlZmluZWQnKS50b0JlKHRydWUpO1xuXHRcdFx0XHRcdFx0ZXhwZWN0KHR5cGVvZiBlLmNvZGUgPT09ICd1bmRlZmluZWQnKS50b0JlKHRydWUpO1xuXHRcdFx0XHRcdFx0ZXhwZWN0KGUuZGVzY3JpcHRpb24pLnRvQmVOdWxsKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2hlY2sodW5kZWZpbmVkKTtcblx0XHRcdFx0Y2hlY2soeyBhOiAxIH0pO1xuXHRcdFx0XHRjaGVjayh7IGlkOiB1bmRlZmluZWQgfSk7XG5cdFx0XHRcdGNoZWNrKHsgZXJyb3JfaWQ6IHVuZGVmaW5lZCB9KTtcblx0XHRcdFx0Y2hlY2soeyBib2R5OiB1bmRlZmluZWQgfSk7XG5cdFx0XHRcdGNoZWNrKHsgYm9keToge30gfSk7XG5cdFx0XHRcdGNoZWNrKHsgYm9keTogeyByZXNwb25zZTogdW5kZWZpbmVkIH0gfSk7XG5cdFx0XHRcdGNoZWNrKHsgYm9keTogeyByZXNwb25zZToge30gfSB9KTtcblx0XHRcdFx0Y2hlY2soeyBib2R5OiB7IHJlc3BvbnNlOiB7IGlkOiB1bmRlZmluZWQgfSB9IH0pO1xuXHRcdFx0XHRjaGVjayh7IGJvZHk6IHsgcmVzcG9uc2U6IHsgZXJyb3JfaWQ6IHVuZGVmaW5lZCB9IH0gfSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSB7XG5cdFx0XHRcdGVycm9yX2lkOiAneHl6Jyxcblx0XHRcdFx0ZXJyb3JfY29kZTogJ20tbi1vLXAnLFxuXHRcdFx0XHRlcnJvcjogJ3NvbWV0aGluZycsXG5cdFx0XHRcdGVycm9yX2Rlc2NyaXB0aW9uOiAnc3R1ZmYgaGFwcGVucycsXG5cdFx0XHR9O1xuXG5cdFx0XHRmdW5jdGlvbiBhc3NlcnRFcnJvckluZm8oZSkge1xuXHRcdFx0XHRleHBlY3QoJ3h5eicpLnRvQmUoZS5pZCk7XG5cdFx0XHRcdGV4cGVjdCgnbS1uLW8tcCcpLnRvQmUoZS5jb2RlKTtcblx0XHRcdFx0ZXhwZWN0KCdzb21ldGhpbmcnKS50b0JlKGUubWVzc2FnZSk7XG5cdFx0XHRcdGV4cGVjdCgnc3R1ZmYgaGFwcGVucycpLnRvQmUoZS5kZXNjcmlwdGlvbik7XG5cdFx0XHR9XG5cblx0XHRcdGl0KCdzaG91bGQgYWNjZXB0IGp1c3Qgb2JqZWN0IGFzIGVycm9yIGRhdGEnLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IG9iaiA9IHJlc3BvbnNlO1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBlcnJvcnNbZXJyb3JOYW1lXShudWxsLCBvYmosIHt9KTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGFzc2VydEVycm9ySW5mbyhlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGl0KCdzaG91bGQgYWNjZXB0IGJvZHkgYXMgZXJyb3IgZGF0YScsICgpID0+IHtcblx0XHRcdFx0Y29uc3Qgb2JqID0ge1xuXHRcdFx0XHRcdHJlc3BvbnNlLFxuXHRcdFx0XHR9O1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBlcnJvcnNbZXJyb3JOYW1lXShudWxsLCBvYmosIHt9KTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGFzc2VydEVycm9ySW5mbyhlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGl0KCdzaG91bGQgYWNjZXB0IHJhdyBhcGkganNvbiBhcyBlcnJvciBkYXRhJywgKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBvYmogPSB7XG5cdFx0XHRcdFx0Ym9keToge1xuXHRcdFx0XHRcdFx0cmVzcG9uc2UsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fTtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgZXJyb3JzW2Vycm9yTmFtZV0obnVsbCwgb2JqLCB7fSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRhc3NlcnRFcnJvckluZm8oZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRpdCgnc2hvdWxkIGFjY2VwdCBzaW1wbGUgb2JqZWN0IGFzIGVycm9yIGRhdGEnLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IG9iaiA9IHtcblx0XHRcdFx0XHRpZDogcmVzcG9uc2UuZXJyb3JfaWQsXG5cdFx0XHRcdFx0Y29kZTogcmVzcG9uc2UuZXJyb3JfY29kZSxcblx0XHRcdFx0XHRtZXNzYWdlOiByZXNwb25zZS5lcnJvcixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogcmVzcG9uc2UuZXJyb3JfZGVzY3JpcHRpb24sXG5cdFx0XHRcdH07XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IGVycm9yc1tlcnJvck5hbWVdKG51bGwsIG9iaiwge30pO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0YXNzZXJ0RXJyb3JJbmZvKGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSk7XG5cblx0ZGVzY3JpYmUoJ2J1aWxkUmVxdWVzdEVycm9yJywgKCkgPT4ge1xuXHRcdGl0KCdzaG91bGQgYnVpbGQgQXBpRXJyb3IgYnkgZGVmYXVsdCcsICgpID0+IHtcblx0XHRcdGV4cGVjdChlcnJvcnMuYnVpbGRSZXF1ZXN0RXJyb3IobmV3IEVycm9yKCdteSBnZW5lcmljIGVycm9yJyksIG51bGwpKS50b0JlSW5zdGFuY2VPZihFcnJvcik7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGRlc2NyaWJlKCdidWlsZEVycm9yJywgKCkgPT4ge1xuXHRcdGl0KCdzaG91bGQgZGV0ZWN0IGxlZ2FjeSBSYXRlTGltaXRFeGNlZWRlZEVycm9yIHByZSAxLjE3JywgKCkgPT4ge1xuXHRcdFx0Y29uc3QgZXJyID0gZXJyb3JzLmJ1aWxkRXJyb3IoXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA1LFxuXHRcdFx0XHRcdGJvZHk6IHtcblx0XHRcdFx0XHRcdHJlc3BvbnNlOiB7XG5cdFx0XHRcdFx0XHRcdGVycm9yX2lkOiAnU1lTVEVNJyxcblx0XHRcdFx0XHRcdFx0ZXJyb3JfY29kZTogJ1JBVEVfRVhDRUVERUQnLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0KTtcblx0XHRcdGV4cGVjdChlcnIpLnRvQmVJbnN0YW5jZU9mKGVycm9ycy5SYXRlTGltaXRFeGNlZWRlZEVycm9yKTtcblx0XHR9KTtcblxuXHRcdFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogJ0FwaUVycm9yJyxcblx0XHRcdFx0ZXJyb3JUeXBlOiBlcnJvcnMuQXBpRXJyb3IsXG5cdFx0XHRcdHN0YXR1c0NvZGU6IDUwMCxcblx0XHRcdFx0ZXJyb3JJZDogJ1onLFxuXHRcdFx0XHRlcnJvck1lc3NhZ2U6ICdVbmtub3duIEFwaSBFcnJvcicsXG5cdFx0XHRcdGlzQXBpRXJyb3I6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiAnTm90QXV0aG9yaXplZEVycm9yJyxcblx0XHRcdFx0ZXJyb3JUeXBlOiBlcnJvcnMuTm90QXV0aG9yaXplZEVycm9yLFxuXHRcdFx0XHRzdGF0dXNDb2RlOiA0MDMsXG5cdFx0XHRcdGVycm9ySWQ6ICdVTkFVVEgnLFxuXHRcdFx0XHRlcnJvck1lc3NhZ2U6ICdBdXRob3JpemF0aW9uIGZhaWxlZCcsXG5cdFx0XHRcdGlzQXBpRXJyb3I6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiAnTm90QXV0aGVudGljYXRlZEVycm9yJyxcblx0XHRcdFx0ZXJyb3JUeXBlOiBlcnJvcnMuTm90QXV0aGVudGljYXRlZEVycm9yLFxuXHRcdFx0XHRzdGF0dXNDb2RlOiA0MDEsXG5cdFx0XHRcdGVycm9ySWQ6ICdOT0FVVEgnLFxuXHRcdFx0XHRlcnJvck1lc3NhZ2U6ICdBdXRoZW50aWNhdGlvbiBmYWlsZWQnLFxuXHRcdFx0XHRpc0FwaUVycm9yOiB0cnVlLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogJ1JhdGVMaW1pdEV4Y2VlZGVkRXJyb3InLFxuXHRcdFx0XHRlcnJvclR5cGU6IGVycm9ycy5SYXRlTGltaXRFeGNlZWRlZEVycm9yLFxuXHRcdFx0XHRzdGF0dXNDb2RlOiA0MjksXG5cdFx0XHRcdGVycm9ySWQ6ICdTWVNURU0nLFxuXHRcdFx0XHRlcnJvckNvZGU6ICdSQVRFX0VYQ0VFREVEJyxcblx0XHRcdFx0ZXJyb3JNZXNzYWdlOiAnUmF0ZSBMaW1pdCBFeGNlZWRlZCcsXG5cdFx0XHRcdGlzQXBpRXJyb3I6IHRydWUsXG5cdFx0XHR9LFxuXHRcdF0uZm9yRWFjaCgoZXJyb3JTcGVjKSA9PiB7XG5cdFx0XHRpdCgnc2hvdWxkIGJ1aWxkICcgKyBlcnJvclNwZWMubmFtZSwgKCkgPT4ge1xuXHRcdFx0XHRmdW5jdGlvbiBjaGVjayhlcnIpIHtcblx0XHRcdFx0XHRleHBlY3QoZXJyLm5hbWUpLnRvRXF1YWwoZXJyb3JTcGVjLm5hbWUpO1xuXHRcdFx0XHRcdGV4cGVjdChlcnIubWVzc2FnZSkudG9FcXVhbChlcnJvclNwZWMuZXJyb3JNZXNzYWdlKTtcblx0XHRcdFx0XHRleHBlY3QoZXJyLmlzQXBpRXJyb3IpLnRvRXF1YWwoZXJyb3JTcGVjLmlzQXBpRXJyb3IpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNoZWNrKGVycm9ycy5idWlsZEVycm9yKG51bGwsIHt9LCB7IHN0YXR1c0NvZGU6IGVycm9yU3BlYy5zdGF0dXNDb2RlIH0pKTtcblx0XHRcdFx0Y2hlY2soZXJyb3JzLmJ1aWxkRXJyb3IobnVsbCwge30sIHsgc3RhdHVzQ29kZTogZXJyb3JTcGVjLnN0YXR1c0NvZGUsIGJvZHk6IHVuZGVmaW5lZCB9KSk7XG5cdFx0XHRcdGNoZWNrKGVycm9ycy5idWlsZEVycm9yKG51bGwsIHt9LCB7IHN0YXR1c0NvZGU6IGVycm9yU3BlYy5zdGF0dXNDb2RlLCBib2R5OiB7fSB9KSk7XG5cdFx0XHRcdGNoZWNrKGVycm9ycy5idWlsZEVycm9yKG51bGwsIHt9LCB7IHN0YXR1c0NvZGU6IGVycm9yU3BlYy5zdGF0dXNDb2RlLCBib2R5OiB7IHJlc3BvbnNlOiB1bmRlZmluZWQgfSB9KSk7XG5cdFx0XHRcdGNoZWNrKGVycm9ycy5idWlsZEVycm9yKG51bGwsIHt9LCB7IHN0YXR1c0NvZGU6IGVycm9yU3BlYy5zdGF0dXNDb2RlLCBib2R5OiB7IHJlc3BvbnNlOiB7fSB9IH0pKTtcblx0XHRcdFx0Y2hlY2soXG5cdFx0XHRcdFx0ZXJyb3JzLmJ1aWxkRXJyb3IoXG5cdFx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdFx0e30sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IGVycm9yU3BlYy5zdGF0dXNDb2RlLFxuXHRcdFx0XHRcdFx0XHRib2R5OiB7IHJlc3BvbnNlOiB7IGVycm9yX2lkOiAnWCcgfSB9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRjaGVjayhcblx0XHRcdFx0XHRlcnJvcnMuYnVpbGRFcnJvcihcblx0XHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0XHR7fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogZXJyb3JTcGVjLnN0YXR1c0NvZGUsXG5cdFx0XHRcdFx0XHRcdGJvZHk6IHsgcmVzcG9uc2U6IHsgZXJyb3JfaWQ6IGVycm9yU3BlYy5lcnJvcklkIH0gfSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0KTtcblx0XHRcdFx0Y2hlY2soXG5cdFx0XHRcdFx0ZXJyb3JzLmJ1aWxkRXJyb3IoXG5cdFx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdFx0e30sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDIwMCxcblx0XHRcdFx0XHRcdFx0Ym9keToge1xuXHRcdFx0XHRcdFx0XHRcdHJlc3BvbnNlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlcnJvcl9pZDogZXJyb3JTcGVjLmVycm9ySWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRlcnJvcl9jb2RlOiBlcnJvclNwZWMuZXJyb3JDb2RlLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGNoZWNrKFxuXHRcdFx0XHRcdGVycm9ycy5idWlsZEVycm9yKFxuXHRcdFx0XHRcdFx0bnVsbCxcblx0XHRcdFx0XHRcdHt9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRib2R5OiB7XG5cdFx0XHRcdFx0XHRcdFx0cmVzcG9uc2U6IHtcblx0XHRcdFx0XHRcdFx0XHRcdGVycm9yX2lkOiBlcnJvclNwZWMuZXJyb3JJZCxcblx0XHRcdFx0XHRcdFx0XHRcdGVycm9yX2NvZGU6IGVycm9yU3BlYy5lcnJvckNvZGUsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRkZXNjcmliZSgnTmV0d29yayBFcnJvcnMnLCAoKSA9PiB7XG5cdFx0aXQoJ1Nob3VsZCBoYW5kbGUgZG5zIGxvb2t1cCBlcnJvcnMnLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBhcGkgPSBuZXcgQW54QXBpKHtcblx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovLy5jb20nLFxuXHRcdFx0XHRyYXRlTGltaXRpbmc6IGZhbHNlLFxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBhcGlcblx0XHRcdFx0LmdldCgnanVuaycpXG5cdFx0XHRcdC50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gbmV3IEVycm9yKCdleHBlY3RlZCBlcnJvcicpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRcdGV4cGVjdChlcnIpLnRvQmVJbnN0YW5jZU9mKGVycm9ycy5OZXR3b3JrRXJyb3IpO1xuXHRcdFx0XHRcdGV4cGVjdChlcnIpLnRvQmVJbnN0YW5jZU9mKGVycm9ycy5ETlNMb29rdXBFcnJvcik7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0aXQoJ1Nob3VsZCBoYW5kbGUgc29mdHdhcmUgdGltZW91dHMnLCAoKSA9PiB7XG5cdFx0XHRub2NrKCdodHRwOi8vYXBpLmV4YW1wbGUuY29tJykuZ2V0KCcvdGltZW91dCcpLmRlbGF5Q29ubmVjdGlvbigyMDAwKS5yZXBseSgyMDApO1xuXG5cdFx0XHRjb25zdCBhcGkgPSBuZXcgQW54QXBpKHtcblx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2FwaS5leGFtcGxlLmNvbScsXG5cdFx0XHRcdHRpbWVvdXQ6IDUwMCxcblx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gYXBpXG5cdFx0XHRcdC5nZXQoJ3RpbWVvdXQnKVxuXHRcdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBFcnJvcignZXhwZWN0ZWQgZXJyb3InKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHRleHBlY3QoZXJyKS50b0JlSW5zdGFuY2VPZihlcnJvcnMuTmV0d29ya0Vycm9yKTtcblx0XHRcdFx0XHRleHBlY3QoZXJyKS50b0JlSW5zdGFuY2VPZihlcnJvcnMuQ29ubmVjdGlvbkFib3J0ZWRFcnJvcik7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0aXQuc2tpcCgnU29ja2V0VGltZW91dEVycm9yJywgKCkgPT4ge30pO1xuXG5cdFx0aXQuc2tpcCgnQ29ubmVjdGlvblRpbWVvdXRFcnJvcicsICgpID0+IHt9KTtcblxuXHRcdGl0LnNraXAoJ0Nvbm5lY3Rpb25SZXNldEVycm9yJywgKCkgPT4ge30pO1xuXG5cdFx0aXQuc2tpcCgnQ29ubmVjdGlvblJlZnVzZWRFcnJvcicsICgpID0+IHt9KTtcblx0fSk7XG59KTtcbiJdfQ==