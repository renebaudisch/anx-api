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
const _ = __importStar(require("lodash"));
const api_1 = require("./api");
const errors = __importStar(require("./errors"));
describe('AnxApi', () => {
    describe('Request', () => {
        describe('config', () => {
            let opts;
            let res;
            describe('with valid config', () => {
                beforeEach(() => {
                    opts = null;
                    res = null;
                    const api = new api_1.AnxApi({
                        target: 'http://example.com',
                        token: 'MySessionToken',
                        userAgent: 'MyAgent',
                        rateLimiting: false,
                        request(o) {
                            opts = o;
                            return Promise.resolve({
                                testKey: 'testValue',
                                statusCode: 200,
                                headers: {},
                                body: {},
                                requestTime: 0,
                                uri: '',
                            });
                        },
                        beforeRequest(reqOpts) {
                            return _.assign({}, reqOpts, { body: 'test' });
                        },
                        afterRequest(reqRes) {
                            return _.assign({}, reqRes, { afterRequest: 'value' });
                        },
                    });
                    return api.get('/user').then((reqRes) => {
                        res = reqRes;
                        return null;
                    });
                });
                it('should use target', () => {
                    expect(_.includes(opts.uri, 'http://example.com/')).toBe(true);
                });
                it('should use token', () => {
                    expect(opts.headers.Authorization).toBe('MySessionToken');
                });
                it('should use User-Agent', () => {
                    expect(opts.headers['User-Agent']).toBe('MyAgent');
                });
                it('should use beforeRequest function', () => {
                    expect(opts.body).toBe('test');
                });
                it('should use afterRequest function', () => {
                    expect(res.afterRequest).toBe('value');
                });
                it('should default request timeout', () => {
                    expect(opts.timeout).toBe(60000);
                });
                it('should attach original request options to the response', () => {
                    expect(res.req).toEqual(opts);
                });
            });
            describe('with invalid config', () => {
                it('should throw on missing target', () => {
                    const api = new api_1.AnxApi({
                        rateLimiting: false,
                        target: '',
                    });
                    return api.get('/user').catch((err) => {
                        expect(err).toBeInstanceOf(errors.TargetError);
                    });
                });
            });
        });
        describe('Options', () => {
            let opts;
            let get;
            describe('with encodeParams defaulted to false', () => {
                beforeEach(() => {
                    opts = null;
                    const api = new api_1.AnxApi({
                        target: 'http://example.com',
                        rateLimiting: false,
                        request(o) {
                            opts = o;
                            return Promise.resolve({
                                statusCode: 200,
                                headers: {},
                                body: {},
                                requestTime: 0,
                                uri: '',
                            });
                        },
                    });
                    get = api.get({
                        uri: 'user',
                        timeout: 5000,
                        startElement: 100,
                        numElements: 25,
                        params: {
                            myParam: 'value',
                            myStdArray: [1, 2, 3],
                            myObjArray: [
                                {
                                    a: 'apple',
                                },
                                {
                                    b: 'bee',
                                },
                            ],
                        },
                    });
                    return get;
                });
                it('uri should contain start_element', () => {
                    expect.assertions(1);
                    return get.then(() => {
                        expect(_.includes(opts.uri, 'start_element=100')).toBe(true);
                        return null;
                    });
                });
                it('uri should contain num_elements', () => {
                    expect.assertions(1);
                    return get.then(() => {
                        expect(_.includes(opts.uri, 'num_elements=25')).toBe(true);
                        return null;
                    });
                });
                it('uri should contain params', () => {
                    expect.assertions(1);
                    return get.then(() => {
                        expect(_.includes(opts.uri, 'myParam=value')).toBe(true);
                        return null;
                    });
                });
                it('uri should convert standard nested array params', () => {
                    expect.assertions(1);
                    return get.then(() => {
                        expect(_.includes(opts.uri, 'myStdArray[0]=1&myStdArray[1]=2&myStdArray[2]=3')).toBe(true);
                        return null;
                    });
                });
                it('uri should convert nested object array params', () => {
                    expect.assertions(1);
                    return get.then(() => {
                        expect(_.includes(opts.uri, 'myObjArray[0][a]=apple&myObjArray[1][b]=bee')).toBe(true);
                        return null;
                    });
                });
                it('should default request timeout', () => {
                    expect.assertions(1);
                    return get.then(() => {
                        expect(opts.timeout).toBe(5000);
                        return null;
                    });
                });
            });
            describe('with encodeParams true', () => {
                beforeEach(() => {
                    opts = null;
                    const api = new api_1.AnxApi({
                        target: 'http://example.com',
                        rateLimiting: false,
                        request(o) {
                            opts = o;
                            return Promise.resolve({});
                        },
                    });
                    return api.get({
                        uri: 'user',
                        timeout: 5000,
                        startElement: 100,
                        numElements: 25,
                        encodeParams: true,
                        params: {
                            myEncodedString: '%ssp',
                        },
                    });
                });
                it('uri should encode params', () => {
                    expect(_.includes(opts.uri, 'myEncodedString=%25ssp')).toBe(true);
                });
            });
            describe('validation', () => {
                let api;
                let reqOpts;
                beforeEach(() => {
                    api = new api_1.AnxApi({
                        target: 'http://example.com',
                        rateLimiting: false,
                        request: (o) => {
                            reqOpts = o;
                            return {
                                then(callback) {
                                    callback({});
                                },
                            };
                        },
                    });
                });
                function expectValidationError(errOpts, expected, done) {
                    api
                        .request(errOpts)
                        .then(() => {
                        return done(new Error('Expected error: ' + expected));
                    })
                        .catch((err) => {
                        expect(err).toBeInstanceOf(errors.ArgumentError);
                        if (err.message !== expected) {
                            return done(new Error('Unexpected error message: ' + err.message + ' Expected: ' + expected));
                        }
                        return done();
                    });
                }
                _.each({
                    uri: [{ value: 'creative' }, { value: null }, { value: undefined }],
                    startElement: [
                        { value: null },
                        { value: undefined },
                        { value: 0 },
                        { value: 1.1, message: 'Invalid startElement' },
                        { value: '', message: 'Invalid startElement' },
                        { value: 5, uriContains: 'start_element=5' },
                        { value: '10', uriContains: 'start_element=10' },
                        { value: 'ZZZ', message: 'Invalid startElement' },
                    ],
                    numElements: [
                        { value: null },
                        { value: undefined },
                        { value: 0 },
                        { value: 1.1, message: 'Invalid numElements' },
                        { value: '', message: 'Invalid numElements' },
                        { value: 5, uriContains: 'num_elements=5' },
                        { value: '10', uriContains: 'num_elements=10' },
                        { value: 'ZZZ', message: 'Invalid numElements' },
                    ],
                }, (tests, param) => {
                    describe(param, () => {
                        _.forEach(tests, (test) => {
                            const newOpts = {};
                            if (param !== 'uri') {
                                newOpts.uri = '/user';
                            }
                            newOpts[param] = test.value;
                            if (test.message) {
                                it(param + ' should not accept ' + test.value, (done) => {
                                    expectValidationError(newOpts, test.message, done);
                                });
                            }
                            else {
                                it(param + ' should accept ' + test.value, () => {
                                    return api.request(newOpts).then(() => {
                                        if (test.uriContains) {
                                            expect(_.includes(reqOpts.uri, test.uriContains)).toBe(true);
                                        }
                                        return null;
                                    });
                                });
                            }
                        });
                    });
                });
            });
            describe('Errors', () => {
                describe('NotAuthenticatedError', () => {
                    let api;
                    beforeEach(() => {
                        api = new api_1.AnxApi({
                            target: 'http://example.com',
                            userAgent: 'MyAgent',
                            rateLimiting: false,
                            request: () => {
                                return {
                                    then: (callback) => {
                                        callback({
                                            statusCode: 401,
                                        });
                                    },
                                };
                            },
                        });
                    });
                    it('should reject with NotAuthenticatedError', () => {
                        expect.assertions(1);
                        return api.get('user').catch((err) => {
                            expect(err).toBeInstanceOf(errors.NotAuthenticatedError);
                        });
                    });
                });
            });
        });
    });
    describe('#request', () => {
        describe('opts.headers', () => {
            let api;
            beforeEach(() => {
                api = new api_1.AnxApi({
                    target: 'http://example.com',
                    rateLimiting: false,
                    request: (opts) => {
                        return Promise.resolve(opts);
                    },
                });
            });
            describe('json default', () => {
                it('should set up GET request for json', () => {
                    expect.assertions(2);
                    return api.request({}).then((opts) => {
                        expect(opts.headers.Accept).toBe('application/json');
                        expect(opts.headers['Content-Type']).toBeUndefined();
                        return null;
                    });
                });
                it('should set up POST request for json', () => {
                    expect.assertions(2);
                    return api.request({ method: 'POST' }).then((opts) => {
                        expect(opts.headers.Accept).toBe('application/json');
                        expect(opts.headers['Content-Type']).toBe('application/json');
                        return null;
                    });
                });
                it('should set up PUT request for json', () => {
                    expect.assertions(2);
                    return api.request({ method: 'PUT' }).then((opts) => {
                        expect(opts.headers.Accept).toBe('application/json');
                        expect(opts.headers['Content-Type']).toBe('application/json');
                        return null;
                    });
                });
                describe('header overrides', () => {
                    it('should allow overriding Accept', () => {
                        expect.assertions(2);
                        return api.request({ method: 'DELETE' }).then((opts) => {
                            expect(opts.headers.Accept).toBe('application/json');
                            expect(opts.headers['Content-Type']).toBeUndefined();
                            return null;
                        });
                    });
                    it('should allow overriding Content-Type', () => {
                        expect.assertions(2);
                        return api
                            .request({
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then((opts) => {
                            expect(opts.headers.Accept).toBe('application/json');
                            expect(opts.headers['Content-Type']).toBeDefined();
                            return null;
                        });
                    });
                });
            });
            it('should allow overriding json accept type', () => {
                expect.assertions(2);
                return api
                    .request({
                    method: 'POST',
                    headers: { Accept: 'text/csv', 'Content-Type': 'text/csv' },
                })
                    .then((opts) => {
                    expect(opts.headers.Accept).toBe('text/csv');
                    expect(opts.headers['Content-Type']).toBe('text/csv');
                    return null;
                });
            });
            it('should allow setting Accept and Content-Type with mimeType option', () => {
                expect.assertions(2);
                return api.request({ method: 'POST', mimeType: 'text/csv' }).then((opts) => {
                    expect(opts.headers.Accept).toBe('text/csv');
                    expect(opts.headers['Content-Type']).toBe('text/csv');
                    return null;
                });
            });
        });
        describe('url formatting', () => {
            it('should not alter the target URL', () => {
                const finalRoute = 'http://example.com/route/sub-route';
                const api = new api_1.AnxApi({
                    target: 'http://example.com/route',
                    rateLimiting: false,
                    request(opts) {
                        return Promise.resolve(opts);
                    },
                });
                return api.get('sub-route').then((opts) => {
                    return expect(finalRoute).toBe(opts.uri);
                });
            });
            it('should handle trailing slashes in the target URL', () => {
                const finalRoute = 'http://example.com/route/sub-route';
                const api = new api_1.AnxApi({
                    target: 'http://example.com/route/',
                    rateLimiting: false,
                    request(opts) {
                        return Promise.resolve(opts);
                    },
                });
                return api.get('sub-route').then((opts) => {
                    return expect(finalRoute).toBe(opts.uri);
                });
            });
            it('should trim off leading slashes on sub-routes', () => {
                const finalRoute = 'http://example.com/route/sub-route';
                const api = new api_1.AnxApi({
                    target: 'http://example.com/route',
                    rateLimiting: false,
                    request(opts) {
                        return Promise.resolve(opts);
                    },
                });
                return api.get('/sub-route').then((opts) => {
                    return expect(finalRoute).toBe(opts.uri);
                });
            });
        });
    });
    describe('#get', () => {
        describe('opts', () => {
            let opts;
            beforeEach((done) => {
                opts = null;
                const api = new api_1.AnxApi({
                    target: 'http://example.com',
                    rateLimiting: false,
                    request(o) {
                        opts = o;
                        return done();
                    },
                });
                api.get('user').catch((error) => error);
            });
            it('method should be GET', () => {
                expect(opts.method).toBe('GET');
            });
            it('should use string path', () => {
                expect(_.includes(opts.uri, 'http://example.com/user')).toBe(true);
            });
        });
    });
    describe('#getAll', () => {
        let api;
        let requestStub;
        beforeEach(() => {
            requestStub = jest.fn();
            api = new api_1.AnxApi({
                target: 'http://example.com',
                request: requestStub,
                rateLimiting: false,
            });
        });
        it('should ', () => {
            requestStub.mockReturnValueOnce(Promise.resolve({
                body: {
                    response: {
                        status: 'OK',
                        count: 3,
                        num_elements: 2,
                        users: [{ id: 1 }, { id: 2 }],
                        dbg_info: { output_term: 'users' },
                    },
                },
            }));
            requestStub.mockReturnValueOnce(Promise.resolve({
                body: {
                    response: {
                        status: 'OK',
                        count: 3,
                        num_elements: 2,
                        user: { id: 3 },
                        dbg_info: { output_term: 'user' },
                    },
                },
            }));
            return api.getAll('user').then((res) => {
                expect(requestStub.mock.calls[0][0].uri).toEqual('http://example.com/user?start_element=0&num_elements=100');
                expect(requestStub.mock.calls[1][0].uri).toEqual('http://example.com/user?start_element=2&num_elements=2');
                expect(res.body).toEqual({
                    response: {
                        count: 3,
                        dbg_info: {
                            output_term: 'users',
                            time: 0,
                        },
                        num_elements: 3,
                        start_element: 0,
                        users: [
                            {
                                id: 1,
                            },
                            {
                                id: 2,
                            },
                            {
                                id: 3,
                            },
                        ],
                    },
                });
                return null;
            });
        });
    });
    describe('#post', () => {
        describe('opts', () => {
            let opts;
            beforeEach((done) => {
                const api = new api_1.AnxApi({
                    target: 'http://example.com',
                    rateLimiting: false,
                    request(o) {
                        opts = o;
                        return done();
                    },
                });
                api.post('user', { name: 'MyName' }).catch((error) => error);
            });
            it('method should be POST', () => {
                expect(opts.method).toBe('POST');
            });
            it('should use string path', () => {
                expect(_.includes(opts.uri, 'http://example.com/user')).toBe(true);
            });
            it('should place the payload into the post body', () => {
                expect(opts.body).toEqual({ name: 'MyName' });
            });
        });
    });
    describe('#put', () => {
        describe('opts', () => {
            let opts;
            beforeEach((done) => {
                const api = new api_1.AnxApi({
                    target: 'http://example.com',
                    rateLimiting: false,
                    request(o) {
                        opts = o;
                        return done();
                    },
                });
                api.put('user', { name: 'MyName' }).catch((error) => error);
            });
            it('method should be PUT', () => {
                expect(opts.method).toBe('PUT');
            });
            it('should use string path', () => {
                expect(_.includes(opts.uri, 'http://example.com/user')).toBe(true);
            });
            it('should place the payload into the put body', () => {
                expect(opts.body).toEqual({ name: 'MyName' });
            });
        });
    });
    describe('#delete', () => {
        describe('opts', () => {
            let opts;
            beforeEach((done) => {
                const api = new api_1.AnxApi({
                    target: 'http://example.com',
                    rateLimiting: false,
                    request(o) {
                        opts = o;
                        return done();
                    },
                });
                api.delete('user?id=1').catch((error) => error);
            });
            it('method should be DELETE', () => {
                expect(opts.method).toBe('DELETE');
            });
            it('should use string path', () => {
                expect(_.includes(opts.uri, 'http://example.com/user')).toBe(true);
            });
        });
    });
    describe('#statusOk', () => {
        it('should return true when status is OK', () => {
            expect((0, api_1.statusOk)({ response: { status: 'OK' } })).toBe(true);
        });
        it('should return false when status is not OK', () => {
            expect((0, api_1.statusOk)({ response: { status: '' } })).toBe(false);
        });
        it('should return false with no status field', () => {
            expect((0, api_1.statusOk)({ response: {} })).toBe(false);
        });
        it('should return false with no response field', () => {
            expect((0, api_1.statusOk)({})).toBe(false);
        });
    });
    describe('#login', () => {
        function buildApi(responseData) {
            const api = new api_1.AnxApi({
                // target: 'http://example.com',
                target: 'https://sand.api.appnexus.com',
                userAgent: 'MyAgent',
                rateLimiting: false,
                request: () => {
                    return new Promise((resolve) => {
                        resolve(responseData);
                    });
                },
            });
            return api;
        }
        it('should reject with NotAuthenticatedError if status is not ok', () => {
            const api = buildApi({
                statusCode: 200,
                body: {
                    response: {
                        error_id: 'UNAUTH',
                        error: 'No match found for user/pass',
                        error_description: null,
                        service: null,
                        method: null,
                        error_code: null,
                    },
                },
            });
            return api
                .login('test_user', 'bad_password')
                .then(() => {
                throw new Error('Did not catch Login Error');
            })
                .catch((err) => {
                // API treats bad password as Authentication instead of Authorization Error.
                // assert(err instanceof NotAuthenticatedError, 'Api.NotAuthenticatedError');
                expect(err).toBeInstanceOf(errors.NotAuthorizedError);
                expect('UNAUTH').toBe(err.id);
                expect('No match found for user/pass').toBe(err.message);
            });
        });
        it('should login give api auth token', () => {
            const api = buildApi({
                statusCode: 200,
                body: {
                    response: {
                        status: 'OK',
                        token: 'hbapi:10340:55ba41134f752:lax1',
                    },
                },
            });
            return api.login('test_user', 'test_password').then((token) => {
                expect('hbapi:10340:55ba41134f752:lax1').toBe(token);
                return null;
            });
        });
    });
    describe('#switchUser', () => {
        let api;
        let requestStub;
        beforeEach(() => {
            requestStub = jest.fn();
            api = new api_1.AnxApi({
                target: 'http://example.com',
                request: requestStub,
                rateLimiting: false,
            });
        });
        it('should post to /auth', () => {
            requestStub.mockReturnValueOnce(Promise.resolve({}));
            return api.switchUser(1234).then(() => {
                expect(requestStub.mock.calls[0][0].method).toBe('POST');
                expect(requestStub.mock.calls[0][0].uri).toBe('http://example.com/auth');
                expect(requestStub.mock.calls[0][0].body).toEqual({
                    auth: { switch_to_user: 1234 },
                });
                return null;
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYXBpLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUU1QiwrQkFBeUM7QUFDekMsaURBQW1DO0FBRW5DLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO0lBQ3ZCLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBQ3hCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDO1lBQ1QsSUFBSSxHQUFHLENBQUM7WUFFUixRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO2dCQUNsQyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNmLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ1osR0FBRyxHQUFHLElBQUksQ0FBQztvQkFFWCxNQUFNLEdBQUcsR0FBRyxJQUFJLFlBQU0sQ0FBQzt3QkFDdEIsTUFBTSxFQUFFLG9CQUFvQjt3QkFDNUIsS0FBSyxFQUFFLGdCQUFnQjt3QkFDdkIsU0FBUyxFQUFFLFNBQVM7d0JBQ3BCLFlBQVksRUFBRSxLQUFLO3dCQUNuQixPQUFPLENBQUMsQ0FBQzs0QkFDUixJQUFJLEdBQUcsQ0FBQyxDQUFDOzRCQUNULE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztnQ0FDdEIsT0FBTyxFQUFFLFdBQVc7Z0NBQ3BCLFVBQVUsRUFBRSxHQUFHO2dDQUNmLE9BQU8sRUFBRSxFQUFFO2dDQUNYLElBQUksRUFBRSxFQUFFO2dDQUNSLFdBQVcsRUFBRSxDQUFDO2dDQUNkLEdBQUcsRUFBRSxFQUFFOzZCQUNQLENBQUMsQ0FBQzt3QkFDSixDQUFDO3dCQUNELGFBQWEsQ0FBQyxPQUFPOzRCQUNwQixPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxD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WUFDL0IsV0FBVyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRCxPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDO29CQUNqRCxJQUFJLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFO2lCQUM5QixDQUFDLENBQUM7Z0JBQ0gsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0IHsgQW54QXBpLCBzdGF0dXNPayB9IGZyb20gJy4vYXBpJztcbmltcG9ydCAqIGFzIGVycm9ycyBmcm9tICcuL2Vycm9ycyc7XG5cbmRlc2NyaWJlKCdBbnhBcGknLCAoKSA9PiB7XG5cdGRlc2NyaWJlKCdSZXF1ZXN0JywgKCkgPT4ge1xuXHRcdGRlc2NyaWJlKCdjb25maWcnLCAoKSA9PiB7XG5cdFx0XHRsZXQgb3B0cztcblx0XHRcdGxldCByZXM7XG5cblx0XHRcdGRlc2NyaWJlKCd3aXRoIHZhbGlkIGNvbmZpZycsICgpID0+IHtcblx0XHRcdFx0YmVmb3JlRWFjaCgoKSA9PiB7XG5cdFx0XHRcdFx0b3B0cyA9IG51bGw7XG5cdFx0XHRcdFx0cmVzID0gbnVsbDtcblxuXHRcdFx0XHRcdGNvbnN0IGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2V4YW1wbGUuY29tJyxcblx0XHRcdFx0XHRcdHRva2VuOiAnTXlTZXNzaW9uVG9rZW4nLFxuXHRcdFx0XHRcdFx0dXNlckFnZW50OiAnTXlBZ2VudCcsXG5cdFx0XHRcdFx0XHRyYXRlTGltaXRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdFx0cmVxdWVzdChvKSB7XG5cdFx0XHRcdFx0XHRcdG9wdHMgPSBvO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcblx0XHRcdFx0XHRcdFx0XHR0ZXN0S2V5OiAndGVzdFZhbHVlJyxcblx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiAyMDAsXG5cdFx0XHRcdFx0XHRcdFx0aGVhZGVyczoge30sXG5cdFx0XHRcdFx0XHRcdFx0Ym9keToge30sXG5cdFx0XHRcdFx0XHRcdFx0cmVxdWVzdFRpbWU6IDAsXG5cdFx0XHRcdFx0XHRcdFx0dXJpOiAnJyxcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0YmVmb3JlUmVxdWVzdChyZXFPcHRzKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBfLmFzc2lnbih7fSwgcmVxT3B0cywgeyBib2R5OiAndGVzdCcgfSk7XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0YWZ0ZXJSZXF1ZXN0KHJlcVJlcykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gXy5hc3NpZ24oe30sIHJlcVJlcywgeyBhZnRlclJlcXVlc3Q6ICd2YWx1ZScgfSk7XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0cmV0dXJuIGFwaS5nZXQoJy91c2VyJykudGhlbigocmVxUmVzKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXMgPSByZXFSZXM7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aXQoJ3Nob3VsZCB1c2UgdGFyZ2V0JywgKCkgPT4ge1xuXHRcdFx0XHRcdGV4cGVjdChfLmluY2x1ZGVzKG9wdHMudXJpLCAnaHR0cDovL2V4YW1wbGUuY29tLycpKS50b0JlKHRydWUpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpdCgnc2hvdWxkIHVzZSB0b2tlbicsICgpID0+IHtcblx0XHRcdFx0XHRleHBlY3Qob3B0cy5oZWFkZXJzLkF1dGhvcml6YXRpb24pLnRvQmUoJ015U2Vzc2lvblRva2VuJyk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGl0KCdzaG91bGQgdXNlIFVzZXItQWdlbnQnLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVyc1snVXNlci1BZ2VudCddKS50b0JlKCdNeUFnZW50Jyk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGl0KCdzaG91bGQgdXNlIGJlZm9yZVJlcXVlc3QgZnVuY3Rpb24nLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0KG9wdHMuYm9keSkudG9CZSgndGVzdCcpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpdCgnc2hvdWxkIHVzZSBhZnRlclJlcXVlc3QgZnVuY3Rpb24nLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0KHJlcy5hZnRlclJlcXVlc3QpLnRvQmUoJ3ZhbHVlJyk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGl0KCdzaG91bGQgZGVmYXVsdCByZXF1ZXN0IHRpbWVvdXQnLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0KG9wdHMudGltZW91dCkudG9CZSg2MDAwMCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGl0KCdzaG91bGQgYXR0YWNoIG9yaWdpbmFsIHJlcXVlc3Qgb3B0aW9ucyB0byB0aGUgcmVzcG9uc2UnLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0KHJlcy5yZXEpLnRvRXF1YWwob3B0cyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGRlc2NyaWJlKCd3aXRoIGludmFsaWQgY29uZmlnJywgKCkgPT4ge1xuXHRcdFx0XHRpdCgnc2hvdWxkIHRocm93IG9uIG1pc3NpbmcgdGFyZ2V0JywgKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdFx0XHRcdHRhcmdldDogJycsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gYXBpLmdldCgnL3VzZXInKS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0XHRleHBlY3QoZXJyKS50b0JlSW5zdGFuY2VPZihlcnJvcnMuVGFyZ2V0RXJyb3IpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0ZGVzY3JpYmUoJ09wdGlvbnMnLCAoKSA9PiB7XG5cdFx0XHRsZXQgb3B0cztcblx0XHRcdGxldCBnZXQ7XG5cblx0XHRcdGRlc2NyaWJlKCd3aXRoIGVuY29kZVBhcmFtcyBkZWZhdWx0ZWQgdG8gZmFsc2UnLCAoKSA9PiB7XG5cdFx0XHRcdGJlZm9yZUVhY2goKCkgPT4ge1xuXHRcdFx0XHRcdG9wdHMgPSBudWxsO1xuXHRcdFx0XHRcdGNvbnN0IGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2V4YW1wbGUuY29tJyxcblx0XHRcdFx0XHRcdHJhdGVMaW1pdGluZzogZmFsc2UsXG5cdFx0XHRcdFx0XHRyZXF1ZXN0KG8pIHtcblx0XHRcdFx0XHRcdFx0b3B0cyA9IG87XG5cdFx0XHRcdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDIwMCxcblx0XHRcdFx0XHRcdFx0XHRoZWFkZXJzOiB7fSxcblx0XHRcdFx0XHRcdFx0XHRib2R5OiB7fSxcblx0XHRcdFx0XHRcdFx0XHRyZXF1ZXN0VGltZTogMCxcblx0XHRcdFx0XHRcdFx0XHR1cmk6ICcnLFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Z2V0ID0gYXBpLmdldCh7XG5cdFx0XHRcdFx0XHR1cmk6ICd1c2VyJyxcblx0XHRcdFx0XHRcdHRpbWVvdXQ6IDUwMDAsXG5cdFx0XHRcdFx0XHRzdGFydEVsZW1lbnQ6IDEwMCxcblx0XHRcdFx0XHRcdG51bUVsZW1lbnRzOiAyNSxcblx0XHRcdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdFx0XHRteVBhcmFtOiAndmFsdWUnLFxuXHRcdFx0XHRcdFx0XHRteVN0ZEFycmF5OiBbMSwgMiwgM10sXG5cdFx0XHRcdFx0XHRcdG15T2JqQXJyYXk6IFtcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRhOiAnYXBwbGUnLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0YjogJ2JlZScsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gZ2V0O1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpdCgndXJpIHNob3VsZCBjb250YWluIHN0YXJ0X2VsZW1lbnQnLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0LmFzc2VydGlvbnMoMSk7XG5cdFx0XHRcdFx0cmV0dXJuIGdldC50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdGV4cGVjdChfLmluY2x1ZGVzKG9wdHMudXJpLCAnc3RhcnRfZWxlbWVudD0xMDAnKSkudG9CZSh0cnVlKTtcblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpdCgndXJpIHNob3VsZCBjb250YWluIG51bV9lbGVtZW50cycsICgpID0+IHtcblx0XHRcdFx0XHRleHBlY3QuYXNzZXJ0aW9ucygxKTtcblx0XHRcdFx0XHRyZXR1cm4gZ2V0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0ZXhwZWN0KF8uaW5jbHVkZXMob3B0cy51cmksICdudW1fZWxlbWVudHM9MjUnKSkudG9CZSh0cnVlKTtcblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpdCgndXJpIHNob3VsZCBjb250YWluIHBhcmFtcycsICgpID0+IHtcblx0XHRcdFx0XHRleHBlY3QuYXNzZXJ0aW9ucygxKTtcblx0XHRcdFx0XHRyZXR1cm4gZ2V0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0ZXhwZWN0KF8uaW5jbHVkZXMob3B0cy51cmksICdteVBhcmFtPXZhbHVlJykpLnRvQmUodHJ1ZSk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aXQoJ3VyaSBzaG91bGQgY29udmVydCBzdGFuZGFyZCBuZXN0ZWQgYXJyYXkgcGFyYW1zJywgKCkgPT4ge1xuXHRcdFx0XHRcdGV4cGVjdC5hc3NlcnRpb25zKDEpO1xuXHRcdFx0XHRcdHJldHVybiBnZXQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRleHBlY3QoXy5pbmNsdWRlcyhvcHRzLnVyaSwgJ215U3RkQXJyYXlbMF09MSZteVN0ZEFycmF5WzFdPTImbXlTdGRBcnJheVsyXT0zJykpLnRvQmUodHJ1ZSk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aXQoJ3VyaSBzaG91bGQgY29udmVydCBuZXN0ZWQgb2JqZWN0IGFycmF5IHBhcmFtcycsICgpID0+IHtcblx0XHRcdFx0XHRleHBlY3QuYXNzZXJ0aW9ucygxKTtcblx0XHRcdFx0XHRyZXR1cm4gZ2V0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0ZXhwZWN0KF8uaW5jbHVkZXMob3B0cy51cmksICdteU9iakFycmF5WzBdW2FdPWFwcGxlJm15T2JqQXJyYXlbMV1bYl09YmVlJykpLnRvQmUodHJ1ZSk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aXQoJ3Nob3VsZCBkZWZhdWx0IHJlcXVlc3QgdGltZW91dCcsICgpID0+IHtcblx0XHRcdFx0XHRleHBlY3QuYXNzZXJ0aW9ucygxKTtcblx0XHRcdFx0XHRyZXR1cm4gZ2V0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0ZXhwZWN0KG9wdHMudGltZW91dCkudG9CZSg1MDAwKTtcblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRkZXNjcmliZSgnd2l0aCBlbmNvZGVQYXJhbXMgdHJ1ZScsICgpID0+IHtcblx0XHRcdFx0YmVmb3JlRWFjaCgoKSA9PiB7XG5cdFx0XHRcdFx0b3B0cyA9IG51bGw7XG5cdFx0XHRcdFx0Y29uc3QgYXBpID0gbmV3IEFueEFwaSh7XG5cdFx0XHRcdFx0XHR0YXJnZXQ6ICdodHRwOi8vZXhhbXBsZS5jb20nLFxuXHRcdFx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdFx0XHRcdHJlcXVlc3Qobykge1xuXHRcdFx0XHRcdFx0XHRvcHRzID0gbztcblx0XHRcdFx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSBhcyBhbnkpO1xuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gYXBpLmdldCh7XG5cdFx0XHRcdFx0XHR1cmk6ICd1c2VyJyxcblx0XHRcdFx0XHRcdHRpbWVvdXQ6IDUwMDAsXG5cdFx0XHRcdFx0XHRzdGFydEVsZW1lbnQ6IDEwMCxcblx0XHRcdFx0XHRcdG51bUVsZW1lbnRzOiAyNSxcblx0XHRcdFx0XHRcdGVuY29kZVBhcmFtczogdHJ1ZSxcblx0XHRcdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdFx0XHRteUVuY29kZWRTdHJpbmc6ICclc3NwJyxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGl0KCd1cmkgc2hvdWxkIGVuY29kZSBwYXJhbXMnLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0KF8uaW5jbHVkZXMob3B0cy51cmksICdteUVuY29kZWRTdHJpbmc9JTI1c3NwJykpLnRvQmUodHJ1ZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGRlc2NyaWJlKCd2YWxpZGF0aW9uJywgKCkgPT4ge1xuXHRcdFx0XHRsZXQgYXBpO1xuXHRcdFx0XHRsZXQgcmVxT3B0cztcblxuXHRcdFx0XHRiZWZvcmVFYWNoKCgpID0+IHtcblx0XHRcdFx0XHRhcGkgPSBuZXcgQW54QXBpKHtcblx0XHRcdFx0XHRcdHRhcmdldDogJ2h0dHA6Ly9leGFtcGxlLmNvbScsXG5cdFx0XHRcdFx0XHRyYXRlTGltaXRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdFx0cmVxdWVzdDogKG8pID0+IHtcblx0XHRcdFx0XHRcdFx0cmVxT3B0cyA9IG87XG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhlbihjYWxsYmFjaykge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soe30pO1xuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH0gYXMgYW55O1xuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0ZnVuY3Rpb24gZXhwZWN0VmFsaWRhdGlvbkVycm9yKGVyck9wdHMsIGV4cGVjdGVkLCBkb25lKSB7XG5cdFx0XHRcdFx0YXBpXG5cdFx0XHRcdFx0XHQucmVxdWVzdChlcnJPcHRzKVxuXHRcdFx0XHRcdFx0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZG9uZShuZXcgRXJyb3IoJ0V4cGVjdGVkIGVycm9yOiAnICsgZXhwZWN0ZWQpKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRcdFx0XHRleHBlY3QoZXJyKS50b0JlSW5zdGFuY2VPZihlcnJvcnMuQXJndW1lbnRFcnJvcik7XG5cdFx0XHRcdFx0XHRcdGlmIChlcnIubWVzc2FnZSAhPT0gZXhwZWN0ZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZG9uZShuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgZXJyb3IgbWVzc2FnZTogJyArIGVyci5tZXNzYWdlICsgJyBFeHBlY3RlZDogJyArIGV4cGVjdGVkKSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGRvbmUoKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Xy5lYWNoKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHVyaTogW3sgdmFsdWU6ICdjcmVhdGl2ZScgfSwgeyB2YWx1ZTogbnVsbCB9LCB7IHZhbHVlOiB1bmRlZmluZWQgfV0sXG5cdFx0XHRcdFx0XHRzdGFydEVsZW1lbnQ6IFtcblx0XHRcdFx0XHRcdFx0eyB2YWx1ZTogbnVsbCB9LFxuXHRcdFx0XHRcdFx0XHR7IHZhbHVlOiB1bmRlZmluZWQgfSxcblx0XHRcdFx0XHRcdFx0eyB2YWx1ZTogMCB9LFxuXHRcdFx0XHRcdFx0XHR7IHZhbHVlOiAxLjEsIG1lc3NhZ2U6ICdJbnZhbGlkIHN0YXJ0RWxlbWVudCcgfSxcblx0XHRcdFx0XHRcdFx0eyB2YWx1ZTogJycsIG1lc3NhZ2U6ICdJbnZhbGlkIHN0YXJ0RWxlbWVudCcgfSxcblx0XHRcdFx0XHRcdFx0eyB2YWx1ZTogNSwgdXJpQ29udGFpbnM6ICdzdGFydF9lbGVtZW50PTUnIH0sXG5cdFx0XHRcdFx0XHRcdHsgdmFsdWU6ICcxMCcsIHVyaUNvbnRhaW5zOiAnc3RhcnRfZWxlbWVudD0xMCcgfSxcblx0XHRcdFx0XHRcdFx0eyB2YWx1ZTogJ1paWicsIG1lc3NhZ2U6ICdJbnZhbGlkIHN0YXJ0RWxlbWVudCcgfSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRudW1FbGVtZW50czogW1xuXHRcdFx0XHRcdFx0XHR7IHZhbHVlOiBudWxsIH0sXG5cdFx0XHRcdFx0XHRcdHsgdmFsdWU6IHVuZGVmaW5lZCB9LFxuXHRcdFx0XHRcdFx0XHR7IHZhbHVlOiAwIH0sXG5cdFx0XHRcdFx0XHRcdHsgdmFsdWU6IDEuMSwgbWVzc2FnZTogJ0ludmFsaWQgbnVtRWxlbWVudHMnIH0sXG5cdFx0XHRcdFx0XHRcdHsgdmFsdWU6ICcnLCBtZXNzYWdlOiAnSW52YWxpZCBudW1FbGVtZW50cycgfSxcblx0XHRcdFx0XHRcdFx0eyB2YWx1ZTogNSwgdXJpQ29udGFpbnM6ICdudW1fZWxlbWVudHM9NScgfSxcblx0XHRcdFx0XHRcdFx0eyB2YWx1ZTogJzEwJywgdXJpQ29udGFpbnM6ICdudW1fZWxlbWVudHM9MTAnIH0sXG5cdFx0XHRcdFx0XHRcdHsgdmFsdWU6ICdaWlonLCBtZXNzYWdlOiAnSW52YWxpZCBudW1FbGVtZW50cycgfSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQodGVzdHM6IGFueSwgcGFyYW0pID0+IHtcblx0XHRcdFx0XHRcdGRlc2NyaWJlKHBhcmFtLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdF8uZm9yRWFjaCh0ZXN0cywgKHRlc3QpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBuZXdPcHRzOiBhbnkgPSB7fTtcblx0XHRcdFx0XHRcdFx0XHRpZiAocGFyYW0gIT09ICd1cmknKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRuZXdPcHRzLnVyaSA9ICcvdXNlcic7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdG5ld09wdHNbcGFyYW1dID0gdGVzdC52YWx1ZTtcblx0XHRcdFx0XHRcdFx0XHRpZiAodGVzdC5tZXNzYWdlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpdChwYXJhbSArICcgc2hvdWxkIG5vdCBhY2NlcHQgJyArIHRlc3QudmFsdWUsIChkb25lKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGV4cGVjdFZhbGlkYXRpb25FcnJvcihuZXdPcHRzLCB0ZXN0Lm1lc3NhZ2UsIGRvbmUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGl0KHBhcmFtICsgJyBzaG91bGQgYWNjZXB0ICcgKyB0ZXN0LnZhbHVlLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBhcGkucmVxdWVzdChuZXdPcHRzKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodGVzdC51cmlDb250YWlucykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZXhwZWN0KF8uaW5jbHVkZXMocmVxT3B0cy51cmksIHRlc3QudXJpQ29udGFpbnMpKS50b0JlKHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRkZXNjcmliZSgnRXJyb3JzJywgKCkgPT4ge1xuXHRcdFx0XHRkZXNjcmliZSgnTm90QXV0aGVudGljYXRlZEVycm9yJywgKCkgPT4ge1xuXHRcdFx0XHRcdGxldCBhcGk7XG5cblx0XHRcdFx0XHRiZWZvcmVFYWNoKCgpID0+IHtcblx0XHRcdFx0XHRcdGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHRcdFx0XHR0YXJnZXQ6ICdodHRwOi8vZXhhbXBsZS5jb20nLFxuXHRcdFx0XHRcdFx0XHR1c2VyQWdlbnQ6ICdNeUFnZW50Jyxcblx0XHRcdFx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0cmVxdWVzdDogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGVuOiAoY2FsbGJhY2spID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdH0gYXMgYW55O1xuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRpdCgnc2hvdWxkIHJlamVjdCB3aXRoIE5vdEF1dGhlbnRpY2F0ZWRFcnJvcicsICgpID0+IHtcblx0XHRcdFx0XHRcdGV4cGVjdC5hc3NlcnRpb25zKDEpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGFwaS5nZXQoJ3VzZXInKS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGV4cGVjdChlcnIpLnRvQmVJbnN0YW5jZU9mKGVycm9ycy5Ob3RBdXRoZW50aWNhdGVkRXJyb3IpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGRlc2NyaWJlKCcjcmVxdWVzdCcsICgpID0+IHtcblx0XHRkZXNjcmliZSgnb3B0cy5oZWFkZXJzJywgKCkgPT4ge1xuXHRcdFx0bGV0IGFwaTtcblxuXHRcdFx0YmVmb3JlRWFjaCgoKSA9PiB7XG5cdFx0XHRcdGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHRcdHRhcmdldDogJ2h0dHA6Ly9leGFtcGxlLmNvbScsXG5cdFx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdFx0XHRyZXF1ZXN0OiAob3B0cykgPT4ge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShvcHRzKSBhcyBhbnk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZGVzY3JpYmUoJ2pzb24gZGVmYXVsdCcsICgpID0+IHtcblx0XHRcdFx0aXQoJ3Nob3VsZCBzZXQgdXAgR0VUIHJlcXVlc3QgZm9yIGpzb24nLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0LmFzc2VydGlvbnMoMik7XG5cdFx0XHRcdFx0cmV0dXJuIGFwaS5yZXF1ZXN0KHt9KS50aGVuKChvcHRzKSA9PiB7XG5cdFx0XHRcdFx0XHRleHBlY3Qob3B0cy5oZWFkZXJzLkFjY2VwdCkudG9CZSgnYXBwbGljYXRpb24vanNvbicpO1xuXHRcdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmVVbmRlZmluZWQoKTtcblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpdCgnc2hvdWxkIHNldCB1cCBQT1NUIHJlcXVlc3QgZm9yIGpzb24nLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0LmFzc2VydGlvbnMoMik7XG5cdFx0XHRcdFx0cmV0dXJuIGFwaS5yZXF1ZXN0KHsgbWV0aG9kOiAnUE9TVCcgfSkudGhlbigob3B0cykgPT4ge1xuXHRcdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVycy5BY2NlcHQpLnRvQmUoJ2FwcGxpY2F0aW9uL2pzb24nKTtcblx0XHRcdFx0XHRcdGV4cGVjdChvcHRzLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddKS50b0JlKCdhcHBsaWNhdGlvbi9qc29uJyk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aXQoJ3Nob3VsZCBzZXQgdXAgUFVUIHJlcXVlc3QgZm9yIGpzb24nLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0LmFzc2VydGlvbnMoMik7XG5cdFx0XHRcdFx0cmV0dXJuIGFwaS5yZXF1ZXN0KHsgbWV0aG9kOiAnUFVUJyB9KS50aGVuKChvcHRzKSA9PiB7XG5cdFx0XHRcdFx0XHRleHBlY3Qob3B0cy5oZWFkZXJzLkFjY2VwdCkudG9CZSgnYXBwbGljYXRpb24vanNvbicpO1xuXHRcdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ2FwcGxpY2F0aW9uL2pzb24nKTtcblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRkZXNjcmliZSgnaGVhZGVyIG92ZXJyaWRlcycsICgpID0+IHtcblx0XHRcdFx0XHRpdCgnc2hvdWxkIGFsbG93IG92ZXJyaWRpbmcgQWNjZXB0JywgKCkgPT4ge1xuXHRcdFx0XHRcdFx0ZXhwZWN0LmFzc2VydGlvbnMoMik7XG5cdFx0XHRcdFx0XHRyZXR1cm4gYXBpLnJlcXVlc3QoeyBtZXRob2Q6ICdERUxFVEUnIH0pLnRoZW4oKG9wdHMpID0+IHtcblx0XHRcdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVycy5BY2NlcHQpLnRvQmUoJ2FwcGxpY2F0aW9uL2pzb24nKTtcblx0XHRcdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmVVbmRlZmluZWQoKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGl0KCdzaG91bGQgYWxsb3cgb3ZlcnJpZGluZyBDb250ZW50LVR5cGUnLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRleHBlY3QuYXNzZXJ0aW9ucygyKTtcblx0XHRcdFx0XHRcdHJldHVybiBhcGlcblx0XHRcdFx0XHRcdFx0LnJlcXVlc3Qoe1xuXHRcdFx0XHRcdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdFx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC50aGVuKChvcHRzKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVycy5BY2NlcHQpLnRvQmUoJ2FwcGxpY2F0aW9uL2pzb24nKTtcblx0XHRcdFx0XHRcdFx0XHRleHBlY3Qob3B0cy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZURlZmluZWQoKTtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGl0KCdzaG91bGQgYWxsb3cgb3ZlcnJpZGluZyBqc29uIGFjY2VwdCB0eXBlJywgKCkgPT4ge1xuXHRcdFx0XHRleHBlY3QuYXNzZXJ0aW9ucygyKTtcblx0XHRcdFx0cmV0dXJuIGFwaVxuXHRcdFx0XHRcdC5yZXF1ZXN0KHtcblx0XHRcdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHRcdFx0aGVhZGVyczogeyBBY2NlcHQ6ICd0ZXh0L2NzdicsICdDb250ZW50LVR5cGUnOiAndGV4dC9jc3YnIH0sXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGhlbigob3B0cykgPT4ge1xuXHRcdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVycy5BY2NlcHQpLnRvQmUoJ3RleHQvY3N2Jyk7XG5cdFx0XHRcdFx0XHRleHBlY3Qob3B0cy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSkudG9CZSgndGV4dC9jc3YnKTtcblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGl0KCdzaG91bGQgYWxsb3cgc2V0dGluZyBBY2NlcHQgYW5kIENvbnRlbnQtVHlwZSB3aXRoIG1pbWVUeXBlIG9wdGlvbicsICgpID0+IHtcblx0XHRcdFx0ZXhwZWN0LmFzc2VydGlvbnMoMik7XG5cdFx0XHRcdHJldHVybiBhcGkucmVxdWVzdCh7IG1ldGhvZDogJ1BPU1QnLCBtaW1lVHlwZTogJ3RleHQvY3N2JyB9KS50aGVuKChvcHRzKSA9PiB7XG5cdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVycy5BY2NlcHQpLnRvQmUoJ3RleHQvY3N2Jyk7XG5cdFx0XHRcdFx0ZXhwZWN0KG9wdHMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10pLnRvQmUoJ3RleHQvY3N2Jyk7XG5cdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRkZXNjcmliZSgndXJsIGZvcm1hdHRpbmcnLCAoKSA9PiB7XG5cdFx0XHRpdCgnc2hvdWxkIG5vdCBhbHRlciB0aGUgdGFyZ2V0IFVSTCcsICgpID0+IHtcblx0XHRcdFx0Y29uc3QgZmluYWxSb3V0ZSA9ICdodHRwOi8vZXhhbXBsZS5jb20vcm91dGUvc3ViLXJvdXRlJztcblx0XHRcdFx0Y29uc3QgYXBpID0gbmV3IEFueEFwaSh7XG5cdFx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2V4YW1wbGUuY29tL3JvdXRlJyxcblx0XHRcdFx0XHRyYXRlTGltaXRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdHJlcXVlc3Qob3B0cykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShvcHRzKSBhcyBhbnk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybiBhcGkuZ2V0KCdzdWItcm91dGUnKS50aGVuKChvcHRzKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIGV4cGVjdChmaW5hbFJvdXRlKS50b0JlKG9wdHMudXJpKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aXQoJ3Nob3VsZCBoYW5kbGUgdHJhaWxpbmcgc2xhc2hlcyBpbiB0aGUgdGFyZ2V0IFVSTCcsICgpID0+IHtcblx0XHRcdFx0Y29uc3QgZmluYWxSb3V0ZSA9ICdodHRwOi8vZXhhbXBsZS5jb20vcm91dGUvc3ViLXJvdXRlJztcblx0XHRcdFx0Y29uc3QgYXBpID0gbmV3IEFueEFwaSh7XG5cdFx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2V4YW1wbGUuY29tL3JvdXRlLycsXG5cdFx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdFx0XHRyZXF1ZXN0KG9wdHMpIHtcblx0XHRcdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUob3B0cykgYXMgYW55O1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyZXR1cm4gYXBpLmdldCgnc3ViLXJvdXRlJykudGhlbigob3B0cykgPT4ge1xuXHRcdFx0XHRcdHJldHVybiBleHBlY3QoZmluYWxSb3V0ZSkudG9CZShvcHRzLnVyaSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGl0KCdzaG91bGQgdHJpbSBvZmYgbGVhZGluZyBzbGFzaGVzIG9uIHN1Yi1yb3V0ZXMnLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGZpbmFsUm91dGUgPSAnaHR0cDovL2V4YW1wbGUuY29tL3JvdXRlL3N1Yi1yb3V0ZSc7XG5cdFx0XHRcdGNvbnN0IGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHRcdHRhcmdldDogJ2h0dHA6Ly9leGFtcGxlLmNvbS9yb3V0ZScsXG5cdFx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdFx0XHRyZXF1ZXN0KG9wdHMpIHtcblx0XHRcdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUob3B0cykgYXMgYW55O1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHJldHVybiBhcGkuZ2V0KCcvc3ViLXJvdXRlJykudGhlbigob3B0cykgPT4ge1xuXHRcdFx0XHRcdHJldHVybiBleHBlY3QoZmluYWxSb3V0ZSkudG9CZShvcHRzLnVyaSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGRlc2NyaWJlKCcjZ2V0JywgKCkgPT4ge1xuXHRcdGRlc2NyaWJlKCdvcHRzJywgKCkgPT4ge1xuXHRcdFx0bGV0IG9wdHM7XG5cblx0XHRcdGJlZm9yZUVhY2goKGRvbmUpID0+IHtcblx0XHRcdFx0b3B0cyA9IG51bGw7XG5cdFx0XHRcdGNvbnN0IGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHRcdHRhcmdldDogJ2h0dHA6Ly9leGFtcGxlLmNvbScsXG5cdFx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdFx0XHRyZXF1ZXN0KG8pIHtcblx0XHRcdFx0XHRcdG9wdHMgPSBvO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGRvbmUoKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0YXBpLmdldCgndXNlcicpLmNhdGNoKChlcnJvcikgPT4gZXJyb3IpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGl0KCdtZXRob2Qgc2hvdWxkIGJlIEdFVCcsICgpID0+IHtcblx0XHRcdFx0ZXhwZWN0KG9wdHMubWV0aG9kKS50b0JlKCdHRVQnKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpdCgnc2hvdWxkIHVzZSBzdHJpbmcgcGF0aCcsICgpID0+IHtcblx0XHRcdFx0ZXhwZWN0KF8uaW5jbHVkZXMob3B0cy51cmksICdodHRwOi8vZXhhbXBsZS5jb20vdXNlcicpKS50b0JlKHRydWUpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGRlc2NyaWJlKCcjZ2V0QWxsJywgKCkgPT4ge1xuXHRcdGxldCBhcGk7XG5cdFx0bGV0IHJlcXVlc3RTdHViO1xuXG5cdFx0YmVmb3JlRWFjaCgoKSA9PiB7XG5cdFx0XHRyZXF1ZXN0U3R1YiA9IGplc3QuZm4oKTtcblx0XHRcdGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHR0YXJnZXQ6ICdodHRwOi8vZXhhbXBsZS5jb20nLFxuXHRcdFx0XHRyZXF1ZXN0OiByZXF1ZXN0U3R1Yixcblx0XHRcdFx0cmF0ZUxpbWl0aW5nOiBmYWxzZSxcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0aXQoJ3Nob3VsZCAnLCAoKSA9PiB7XG5cdFx0XHRyZXF1ZXN0U3R1Yi5tb2NrUmV0dXJuVmFsdWVPbmNlKFxuXHRcdFx0XHRQcm9taXNlLnJlc29sdmUoe1xuXHRcdFx0XHRcdGJvZHk6IHtcblx0XHRcdFx0XHRcdHJlc3BvbnNlOiB7XG5cdFx0XHRcdFx0XHRcdHN0YXR1czogJ09LJyxcblx0XHRcdFx0XHRcdFx0Y291bnQ6IDMsXG5cdFx0XHRcdFx0XHRcdG51bV9lbGVtZW50czogMixcblx0XHRcdFx0XHRcdFx0dXNlcnM6IFt7IGlkOiAxIH0sIHsgaWQ6IDIgfV0sXG5cdFx0XHRcdFx0XHRcdGRiZ19pbmZvOiB7IG91dHB1dF90ZXJtOiAndXNlcnMnIH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0KTtcblx0XHRcdHJlcXVlc3RTdHViLm1vY2tSZXR1cm5WYWx1ZU9uY2UoXG5cdFx0XHRcdFByb21pc2UucmVzb2x2ZSh7XG5cdFx0XHRcdFx0Ym9keToge1xuXHRcdFx0XHRcdFx0cmVzcG9uc2U6IHtcblx0XHRcdFx0XHRcdFx0c3RhdHVzOiAnT0snLFxuXHRcdFx0XHRcdFx0XHRjb3VudDogMyxcblx0XHRcdFx0XHRcdFx0bnVtX2VsZW1lbnRzOiAyLFxuXHRcdFx0XHRcdFx0XHR1c2VyOiB7IGlkOiAzIH0sXG5cdFx0XHRcdFx0XHRcdGRiZ19pbmZvOiB7IG91dHB1dF90ZXJtOiAndXNlcicgfSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHQpO1xuXHRcdFx0cmV0dXJuIGFwaS5nZXRBbGwoJ3VzZXInKS50aGVuKChyZXMpID0+IHtcblx0XHRcdFx0ZXhwZWN0KHJlcXVlc3RTdHViLm1vY2suY2FsbHNbMF1bMF0udXJpKS50b0VxdWFsKCdodHRwOi8vZXhhbXBsZS5jb20vdXNlcj9zdGFydF9lbGVtZW50PTAmbnVtX2VsZW1lbnRzPTEwMCcpO1xuXHRcdFx0XHRleHBlY3QocmVxdWVzdFN0dWIubW9jay5jYWxsc1sxXVswXS51cmkpLnRvRXF1YWwoJ2h0dHA6Ly9leGFtcGxlLmNvbS91c2VyP3N0YXJ0X2VsZW1lbnQ9MiZudW1fZWxlbWVudHM9MicpO1xuXHRcdFx0XHRleHBlY3QocmVzLmJvZHkpLnRvRXF1YWwoe1xuXHRcdFx0XHRcdHJlc3BvbnNlOiB7XG5cdFx0XHRcdFx0XHRjb3VudDogMyxcblx0XHRcdFx0XHRcdGRiZ19pbmZvOiB7XG5cdFx0XHRcdFx0XHRcdG91dHB1dF90ZXJtOiAndXNlcnMnLFxuXHRcdFx0XHRcdFx0XHR0aW1lOiAwLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG51bV9lbGVtZW50czogMyxcblx0XHRcdFx0XHRcdHN0YXJ0X2VsZW1lbnQ6IDAsXG5cdFx0XHRcdFx0XHR1c2VyczogW1xuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWQ6IDEsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRpZDogMixcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlkOiAzLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSk7XG5cblx0ZGVzY3JpYmUoJyNwb3N0JywgKCkgPT4ge1xuXHRcdGRlc2NyaWJlKCdvcHRzJywgKCkgPT4ge1xuXHRcdFx0bGV0IG9wdHM7XG5cblx0XHRcdGJlZm9yZUVhY2goKGRvbmUpID0+IHtcblx0XHRcdFx0Y29uc3QgYXBpID0gbmV3IEFueEFwaSh7XG5cdFx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2V4YW1wbGUuY29tJyxcblx0XHRcdFx0XHRyYXRlTGltaXRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdHJlcXVlc3Qobykge1xuXHRcdFx0XHRcdFx0b3B0cyA9IG87XG5cdFx0XHRcdFx0XHRyZXR1cm4gZG9uZSgpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRhcGkucG9zdCgndXNlcicsIHsgbmFtZTogJ015TmFtZScgfSkuY2F0Y2goKGVycm9yKSA9PiBlcnJvcik7XG5cdFx0XHR9KTtcblxuXHRcdFx0aXQoJ21ldGhvZCBzaG91bGQgYmUgUE9TVCcsICgpID0+IHtcblx0XHRcdFx0ZXhwZWN0KG9wdHMubWV0aG9kKS50b0JlKCdQT1NUJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aXQoJ3Nob3VsZCB1c2Ugc3RyaW5nIHBhdGgnLCAoKSA9PiB7XG5cdFx0XHRcdGV4cGVjdChfLmluY2x1ZGVzKG9wdHMudXJpLCAnaHR0cDovL2V4YW1wbGUuY29tL3VzZXInKSkudG9CZSh0cnVlKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpdCgnc2hvdWxkIHBsYWNlIHRoZSBwYXlsb2FkIGludG8gdGhlIHBvc3QgYm9keScsICgpID0+IHtcblx0XHRcdFx0ZXhwZWN0KG9wdHMuYm9keSkudG9FcXVhbCh7IG5hbWU6ICdNeU5hbWUnIH0pO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGRlc2NyaWJlKCcjcHV0JywgKCkgPT4ge1xuXHRcdGRlc2NyaWJlKCdvcHRzJywgKCkgPT4ge1xuXHRcdFx0bGV0IG9wdHM7XG5cblx0XHRcdGJlZm9yZUVhY2goKGRvbmUpID0+IHtcblx0XHRcdFx0Y29uc3QgYXBpID0gbmV3IEFueEFwaSh7XG5cdFx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2V4YW1wbGUuY29tJyxcblx0XHRcdFx0XHRyYXRlTGltaXRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdHJlcXVlc3Qobykge1xuXHRcdFx0XHRcdFx0b3B0cyA9IG87XG5cdFx0XHRcdFx0XHRyZXR1cm4gZG9uZSgpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRhcGkucHV0KCd1c2VyJywgeyBuYW1lOiAnTXlOYW1lJyB9KS5jYXRjaCgoZXJyb3IpID0+IGVycm9yKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpdCgnbWV0aG9kIHNob3VsZCBiZSBQVVQnLCAoKSA9PiB7XG5cdFx0XHRcdGV4cGVjdChvcHRzLm1ldGhvZCkudG9CZSgnUFVUJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aXQoJ3Nob3VsZCB1c2Ugc3RyaW5nIHBhdGgnLCAoKSA9PiB7XG5cdFx0XHRcdGV4cGVjdChfLmluY2x1ZGVzKG9wdHMudXJpLCAnaHR0cDovL2V4YW1wbGUuY29tL3VzZXInKSkudG9CZSh0cnVlKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpdCgnc2hvdWxkIHBsYWNlIHRoZSBwYXlsb2FkIGludG8gdGhlIHB1dCBib2R5JywgKCkgPT4ge1xuXHRcdFx0XHRleHBlY3Qob3B0cy5ib2R5KS50b0VxdWFsKHsgbmFtZTogJ015TmFtZScgfSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSk7XG5cblx0ZGVzY3JpYmUoJyNkZWxldGUnLCAoKSA9PiB7XG5cdFx0ZGVzY3JpYmUoJ29wdHMnLCAoKSA9PiB7XG5cdFx0XHRsZXQgb3B0cztcblxuXHRcdFx0YmVmb3JlRWFjaCgoZG9uZSkgPT4ge1xuXHRcdFx0XHRjb25zdCBhcGkgPSBuZXcgQW54QXBpKHtcblx0XHRcdFx0XHR0YXJnZXQ6ICdodHRwOi8vZXhhbXBsZS5jb20nLFxuXHRcdFx0XHRcdHJhdGVMaW1pdGluZzogZmFsc2UsXG5cdFx0XHRcdFx0cmVxdWVzdChvKSB7XG5cdFx0XHRcdFx0XHRvcHRzID0gbztcblx0XHRcdFx0XHRcdHJldHVybiBkb25lKCk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGFwaS5kZWxldGUoJ3VzZXI/aWQ9MScpLmNhdGNoKChlcnJvcikgPT4gZXJyb3IpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGl0KCdtZXRob2Qgc2hvdWxkIGJlIERFTEVURScsICgpID0+IHtcblx0XHRcdFx0ZXhwZWN0KG9wdHMubWV0aG9kKS50b0JlKCdERUxFVEUnKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpdCgnc2hvdWxkIHVzZSBzdHJpbmcgcGF0aCcsICgpID0+IHtcblx0XHRcdFx0ZXhwZWN0KF8uaW5jbHVkZXMob3B0cy51cmksICdodHRwOi8vZXhhbXBsZS5jb20vdXNlcicpKS50b0JlKHRydWUpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGRlc2NyaWJlKCcjc3RhdHVzT2snLCAoKSA9PiB7XG5cdFx0aXQoJ3Nob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHN0YXR1cyBpcyBPSycsICgpID0+IHtcblx0XHRcdGV4cGVjdChzdGF0dXNPayh7IHJlc3BvbnNlOiB7IHN0YXR1czogJ09LJyB9IH0pKS50b0JlKHRydWUpO1xuXHRcdH0pO1xuXG5cdFx0aXQoJ3Nob3VsZCByZXR1cm4gZmFsc2Ugd2hlbiBzdGF0dXMgaXMgbm90IE9LJywgKCkgPT4ge1xuXHRcdFx0ZXhwZWN0KHN0YXR1c09rKHsgcmVzcG9uc2U6IHsgc3RhdHVzOiAnJyB9IH0pKS50b0JlKGZhbHNlKTtcblx0XHR9KTtcblxuXHRcdGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIHdpdGggbm8gc3RhdHVzIGZpZWxkJywgKCkgPT4ge1xuXHRcdFx0ZXhwZWN0KHN0YXR1c09rKHsgcmVzcG9uc2U6IHt9IH0pKS50b0JlKGZhbHNlKTtcblx0XHR9KTtcblxuXHRcdGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIHdpdGggbm8gcmVzcG9uc2UgZmllbGQnLCAoKSA9PiB7XG5cdFx0XHRleHBlY3Qoc3RhdHVzT2soe30pKS50b0JlKGZhbHNlKTtcblx0XHR9KTtcblx0fSk7XG5cblx0ZGVzY3JpYmUoJyNsb2dpbicsICgpID0+IHtcblx0XHRmdW5jdGlvbiBidWlsZEFwaShyZXNwb25zZURhdGEpIHtcblx0XHRcdGNvbnN0IGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0XHQvLyB0YXJnZXQ6ICdodHRwOi8vZXhhbXBsZS5jb20nLFxuXHRcdFx0XHR0YXJnZXQ6ICdodHRwczovL3NhbmQuYXBpLmFwcG5leHVzLmNvbScsXG5cdFx0XHRcdHVzZXJBZ2VudDogJ015QWdlbnQnLFxuXHRcdFx0XHRyYXRlTGltaXRpbmc6IGZhbHNlLFxuXHRcdFx0XHRyZXF1ZXN0OiAoKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlRGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fVxuXG5cdFx0aXQoJ3Nob3VsZCByZWplY3Qgd2l0aCBOb3RBdXRoZW50aWNhdGVkRXJyb3IgaWYgc3RhdHVzIGlzIG5vdCBvaycsICgpID0+IHtcblx0XHRcdGNvbnN0IGFwaSA9IGJ1aWxkQXBpKHtcblx0XHRcdFx0c3RhdHVzQ29kZTogMjAwLCAvLyAyMDAgaW5zdGVhZCBvZiA0MDEgYmVjYXVzZSB0aGF0cyB3aGF0IHRoZSBzZXJ2aWNlIHJlc3BvbmRzIHdpdGhcblx0XHRcdFx0Ym9keToge1xuXHRcdFx0XHRcdHJlc3BvbnNlOiB7XG5cdFx0XHRcdFx0XHRlcnJvcl9pZDogJ1VOQVVUSCcsXG5cdFx0XHRcdFx0XHRlcnJvcjogJ05vIG1hdGNoIGZvdW5kIGZvciB1c2VyL3Bhc3MnLFxuXHRcdFx0XHRcdFx0ZXJyb3JfZGVzY3JpcHRpb246IG51bGwsXG5cdFx0XHRcdFx0XHRzZXJ2aWNlOiBudWxsLFxuXHRcdFx0XHRcdFx0bWV0aG9kOiBudWxsLFxuXHRcdFx0XHRcdFx0ZXJyb3JfY29kZTogbnVsbCxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gYXBpXG5cdFx0XHRcdC5sb2dpbigndGVzdF91c2VyJywgJ2JhZF9wYXNzd29yZCcpXG5cdFx0XHRcdC50aGVuKCgpID0+IHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0RpZCBub3QgY2F0Y2ggTG9naW4gRXJyb3InKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHQvLyBBUEkgdHJlYXRzIGJhZCBwYXNzd29yZCBhcyBBdXRoZW50aWNhdGlvbiBpbnN0ZWFkIG9mIEF1dGhvcml6YXRpb24gRXJyb3IuXG5cdFx0XHRcdFx0Ly8gYXNzZXJ0KGVyciBpbnN0YW5jZW9mIE5vdEF1dGhlbnRpY2F0ZWRFcnJvciwgJ0FwaS5Ob3RBdXRoZW50aWNhdGVkRXJyb3InKTtcblx0XHRcdFx0XHRleHBlY3QoZXJyKS50b0JlSW5zdGFuY2VPZihlcnJvcnMuTm90QXV0aG9yaXplZEVycm9yKTtcblxuXHRcdFx0XHRcdGV4cGVjdCgnVU5BVVRIJykudG9CZShlcnIuaWQpO1xuXHRcdFx0XHRcdGV4cGVjdCgnTm8gbWF0Y2ggZm91bmQgZm9yIHVzZXIvcGFzcycpLnRvQmUoZXJyLm1lc3NhZ2UpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGl0KCdzaG91bGQgbG9naW4gZ2l2ZSBhcGkgYXV0aCB0b2tlbicsICgpID0+IHtcblx0XHRcdGNvbnN0IGFwaSA9IGJ1aWxkQXBpKHtcblx0XHRcdFx0c3RhdHVzQ29kZTogMjAwLFxuXHRcdFx0XHRib2R5OiB7XG5cdFx0XHRcdFx0cmVzcG9uc2U6IHtcblx0XHRcdFx0XHRcdHN0YXR1czogJ09LJyxcblx0XHRcdFx0XHRcdHRva2VuOiAnaGJhcGk6MTAzNDA6NTViYTQxMTM0Zjc1MjpsYXgxJyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gYXBpLmxvZ2luKCd0ZXN0X3VzZXInLCAndGVzdF9wYXNzd29yZCcpLnRoZW4oKHRva2VuKSA9PiB7XG5cdFx0XHRcdGV4cGVjdCgnaGJhcGk6MTAzNDA6NTViYTQxMTM0Zjc1MjpsYXgxJykudG9CZSh0b2tlbik7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGRlc2NyaWJlKCcjc3dpdGNoVXNlcicsICgpID0+IHtcblx0XHRsZXQgYXBpO1xuXHRcdGxldCByZXF1ZXN0U3R1YjtcblxuXHRcdGJlZm9yZUVhY2goKCkgPT4ge1xuXHRcdFx0cmVxdWVzdFN0dWIgPSBqZXN0LmZuKCk7XG5cdFx0XHRhcGkgPSBuZXcgQW54QXBpKHtcblx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2V4YW1wbGUuY29tJyxcblx0XHRcdFx0cmVxdWVzdDogcmVxdWVzdFN0dWIsXG5cdFx0XHRcdHJhdGVMaW1pdGluZzogZmFsc2UsXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGl0KCdzaG91bGQgcG9zdCB0byAvYXV0aCcsICgpID0+IHtcblx0XHRcdHJlcXVlc3RTdHViLm1vY2tSZXR1cm5WYWx1ZU9uY2UoUHJvbWlzZS5yZXNvbHZlKHt9KSk7XG5cdFx0XHRyZXR1cm4gYXBpLnN3aXRjaFVzZXIoMTIzNCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdGV4cGVjdChyZXF1ZXN0U3R1Yi5tb2NrLmNhbGxzWzBdWzBdLm1ldGhvZCkudG9CZSgnUE9TVCcpO1xuXHRcdFx0XHRleHBlY3QocmVxdWVzdFN0dWIubW9jay5jYWxsc1swXVswXS51cmkpLnRvQmUoJ2h0dHA6Ly9leGFtcGxlLmNvbS9hdXRoJyk7XG5cdFx0XHRcdGV4cGVjdChyZXF1ZXN0U3R1Yi5tb2NrLmNhbGxzWzBdWzBdLmJvZHkpLnRvRXF1YWwoe1xuXHRcdFx0XHRcdGF1dGg6IHsgc3dpdGNoX3RvX3VzZXI6IDEyMzQgfSxcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xufSk7XG4iXX0=