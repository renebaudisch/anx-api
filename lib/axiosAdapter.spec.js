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
const _ = __importStar(require("lodash"));
const axios_1 = __importDefault(require("axios"));
const axiosAdapter_1 = require("./axiosAdapter");
jest.mock('axios');
const axiosMock = axios_1.default;
describe('Axios Adapter', () => {
    it.skip('should make correct axios request', () => { });
    it('should transform axios response', () => {
        expect.assertions(2);
        axiosMock.mockResolvedValueOnce({
            status: 200,
            headers: { someHeader: 1 },
            data: { response: {} },
        });
        const opts = {
            headers: {
                'X-Proxy-Target': 'http://01-thorondor-hbapi-sor.envnxs.net',
                Authorization: 'hbapi:191561:57a21e5581e67:lax1',
                Accept: 'application/json',
            },
            method: 'GET',
            params: {},
            uri: '/api/access-resource?num_elements=1000',
        };
        return (0, axiosAdapter_1.axiosAdapter)({})(opts).then((res) => {
            expect(_.omit(res, 'requestTime')).toEqual({
                statusCode: 200,
                uri: '/api/access-resource?num_elements=1000',
                headers: { someHeader: 1 },
                body: { response: {} },
            });
            expect(_.isNumber(res.requestTime)).toBe(true);
            return null;
        });
    });
    it('should handle axios error 400 response', () => {
        expect.assertions(4);
        axiosMock.mockResolvedValueOnce({
            status: 401,
            headers: { someHeader: 1 },
            data: { response: {} },
        });
        const opts = {
            headers: {
                'X-Proxy-Target': 'http://01-thorondor-hbapi-sor.envnxs.net',
                Authorization: 'hbapi:191561:57a21e5581e67:lax1',
                Accept: 'application/json',
            },
            method: 'GET',
            params: {},
            uri: '/api/access-resource?num_elements=1000',
        };
        return (0, axiosAdapter_1.axiosAdapter)({})(opts).then((res) => {
            expect(res.statusCode).toBe(401);
            expect(res.headers).toEqual({ someHeader: 1 });
            expect(res.body).toEqual({ response: {} });
            expect(res.requestTime).toBeDefined();
            return null;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXhpb3NBZGFwdGVyLnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYXhpb3NBZGFwdGVyLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUU1QixrREFBMEI7QUFDMUIsaURBQThDO0FBRTlDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbkIsTUFBTSxTQUFTLEdBQWMsZUFBWSxDQUFDO0FBRTFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO0lBQzlCLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDLENBQUM7SUFFdkQsRUFBRSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtRQUMxQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXJCLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQztZQUMvQixNQUFNLEVBQUUsR0FBRztZQUNYLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUU7WUFDMUIsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtTQUN0QixDQUFDLENBQUM7UUFFSCxNQUFNLElBQUksR0FBRztZQUNaLE9BQU8sRUFBRTtnQkFDUixnQkFBZ0IsRUFBRSwwQ0FBMEM7Z0JBQzVELGFBQWEsRUFBRSxpQ0FBaUM7Z0JBQ2hELE1BQU0sRUFBRSxrQkFBa0I7YUFDMUI7WUFDRCxNQUFNLEVBQUUsS0FBSztZQUNiLE1BQU0sRUFBRSxFQUFFO1lBQ1YsR0FBRyxFQUFFLHdDQUF3QztTQUM3QyxDQUFDO1FBRUYsT0FBTyxJQUFBLDJCQUFZLEVBQUMsRUFBRSxDQUFDLENBQUMsSUFBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDakQsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUMxQyxVQUFVLEVBQUUsR0FBRztnQkFDZixHQUFHLEVBQUUsd0NBQXdDO2dCQUM3QyxPQUFPLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFO2dCQUMxQixJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO2FBQ3RCLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1FBQ2pELE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckIsU0FBUyxDQUFDLHFCQUFxQixDQUFDO1lBQy9CLE1BQU0sRUFBRSxHQUFHO1lBQ1gsT0FBTyxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRTtZQUMxQixJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO1NBQ3RCLENBQUMsQ0FBQztRQUVILE1BQU0sSUFBSSxHQUFHO1lBQ1osT0FBTyxFQUFFO2dCQUNSLGdCQUFnQixFQUFFLDBDQUEwQztnQkFDNUQsYUFBYSxFQUFFLGlDQUFpQztnQkFDaEQsTUFBTSxFQUFFLGtCQUFrQjthQUMxQjtZQUNELE1BQU0sRUFBRSxLQUFLO1lBQ2IsTUFBTSxFQUFFLEVBQUU7WUFDVixHQUFHLEVBQUUsd0NBQXdDO1NBQzdDLENBQUM7UUFFRixPQUFPLElBQUEsMkJBQVksRUFBQyxFQUFFLENBQUMsQ0FBQyxJQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNqRCxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN0QyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCB7IGF4aW9zQWRhcHRlciB9IGZyb20gJy4vYXhpb3NBZGFwdGVyJztcblxuamVzdC5tb2NrKCdheGlvcycpO1xuY29uc3QgYXhpb3NNb2NrOiBqZXN0Lk1vY2sgPSBheGlvcyBhcyBhbnk7XG5cbmRlc2NyaWJlKCdBeGlvcyBBZGFwdGVyJywgKCkgPT4ge1xuXHRpdC5za2lwKCdzaG91bGQgbWFrZSBjb3JyZWN0IGF4aW9zIHJlcXVlc3QnLCAoKSA9PiB7fSk7XG5cblx0aXQoJ3Nob3VsZCB0cmFuc2Zvcm0gYXhpb3MgcmVzcG9uc2UnLCAoKSA9PiB7XG5cdFx0ZXhwZWN0LmFzc2VydGlvbnMoMik7XG5cblx0XHRheGlvc01vY2subW9ja1Jlc29sdmVkVmFsdWVPbmNlKHtcblx0XHRcdHN0YXR1czogMjAwLFxuXHRcdFx0aGVhZGVyczogeyBzb21lSGVhZGVyOiAxIH0sXG5cdFx0XHRkYXRhOiB7IHJlc3BvbnNlOiB7fSB9LFxuXHRcdH0pO1xuXG5cdFx0Y29uc3Qgb3B0cyA9IHtcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J1gtUHJveHktVGFyZ2V0JzogJ2h0dHA6Ly8wMS10aG9yb25kb3ItaGJhcGktc29yLmVudm54cy5uZXQnLFxuXHRcdFx0XHRBdXRob3JpemF0aW9uOiAnaGJhcGk6MTkxNTYxOjU3YTIxZTU1ODFlNjc6bGF4MScsXG5cdFx0XHRcdEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0fSxcblx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRwYXJhbXM6IHt9LFxuXHRcdFx0dXJpOiAnL2FwaS9hY2Nlc3MtcmVzb3VyY2U/bnVtX2VsZW1lbnRzPTEwMDAnLFxuXHRcdH07XG5cblx0XHRyZXR1cm4gYXhpb3NBZGFwdGVyKHt9KShvcHRzIGFzIGFueSkudGhlbigocmVzKSA9PiB7XG5cdFx0XHRleHBlY3QoXy5vbWl0KHJlcywgJ3JlcXVlc3RUaW1lJykpLnRvRXF1YWwoe1xuXHRcdFx0XHRzdGF0dXNDb2RlOiAyMDAsXG5cdFx0XHRcdHVyaTogJy9hcGkvYWNjZXNzLXJlc291cmNlP251bV9lbGVtZW50cz0xMDAwJyxcblx0XHRcdFx0aGVhZGVyczogeyBzb21lSGVhZGVyOiAxIH0sXG5cdFx0XHRcdGJvZHk6IHsgcmVzcG9uc2U6IHt9IH0sXG5cdFx0XHR9KTtcblx0XHRcdGV4cGVjdChfLmlzTnVtYmVyKHJlcy5yZXF1ZXN0VGltZSkpLnRvQmUodHJ1ZSk7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9KTtcblx0fSk7XG5cblx0aXQoJ3Nob3VsZCBoYW5kbGUgYXhpb3MgZXJyb3IgNDAwIHJlc3BvbnNlJywgKCkgPT4ge1xuXHRcdGV4cGVjdC5hc3NlcnRpb25zKDQpO1xuXG5cdFx0YXhpb3NNb2NrLm1vY2tSZXNvbHZlZFZhbHVlT25jZSh7XG5cdFx0XHRzdGF0dXM6IDQwMSxcblx0XHRcdGhlYWRlcnM6IHsgc29tZUhlYWRlcjogMSB9LFxuXHRcdFx0ZGF0YTogeyByZXNwb25zZToge30gfSxcblx0XHR9KTtcblxuXHRcdGNvbnN0IG9wdHMgPSB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdYLVByb3h5LVRhcmdldCc6ICdodHRwOi8vMDEtdGhvcm9uZG9yLWhiYXBpLXNvci5lbnZueHMubmV0Jyxcblx0XHRcdFx0QXV0aG9yaXphdGlvbjogJ2hiYXBpOjE5MTU2MTo1N2EyMWU1NTgxZTY3OmxheDEnLFxuXHRcdFx0XHRBY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRcdH0sXG5cdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0cGFyYW1zOiB7fSxcblx0XHRcdHVyaTogJy9hcGkvYWNjZXNzLXJlc291cmNlP251bV9lbGVtZW50cz0xMDAwJyxcblx0XHR9O1xuXG5cdFx0cmV0dXJuIGF4aW9zQWRhcHRlcih7fSkob3B0cyBhcyBhbnkpLnRoZW4oKHJlcykgPT4ge1xuXHRcdFx0ZXhwZWN0KHJlcy5zdGF0dXNDb2RlKS50b0JlKDQwMSk7XG5cdFx0XHRleHBlY3QocmVzLmhlYWRlcnMpLnRvRXF1YWwoeyBzb21lSGVhZGVyOiAxIH0pO1xuXHRcdFx0ZXhwZWN0KHJlcy5ib2R5KS50b0VxdWFsKHsgcmVzcG9uc2U6IHt9IH0pO1xuXHRcdFx0ZXhwZWN0KHJlcy5yZXF1ZXN0VGltZSkudG9CZURlZmluZWQoKTtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIl19