"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const api_1 = require("./api");
jest.mock('axios');
const axiosMock = axios_1.default;
describe('Concurrency Adapter', () => {
    afterEach(() => {
        axiosMock.mockReset();
    });
    it('should handle a concurrency of 1', () => {
        axiosMock.mockReturnValueOnce(new Promise((resolve) => {
            const id = 'call1';
            setTimeout(() => {
                resolve({
                    headers: { myHeader: id },
                    status: 200,
                    data: { id },
                });
            }, 1000);
        }));
        axiosMock.mockReturnValueOnce(new Promise((resolve) => {
            const id = 'call2';
            setTimeout(() => {
                resolve({
                    headers: { myHeader: id },
                    status: 200,
                    data: { id },
                });
            }, 1);
        }));
        const api = new api_1.AnxApi({
            target: 'http://api.example.com',
            rateLimiting: false,
            concurrencyLimit: 1,
            userAgent: 'concurrency',
        });
        expect.assertions(4);
        return Promise.all([api.get('/limit'), api.get('/limit2')]).then(([res1, res2]) => {
            expect(res1.body).toEqual({ id: 'call1' });
            expect(res2.body).toEqual({ id: 'call2' });
            expect(axiosMock).toBeCalledWith({
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'concurrency',
                },
                method: 'GET',
                timeout: 60000,
                url: 'http://api.example.com/limit',
            });
            expect(axiosMock).toBeCalledWith({
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'concurrency',
                },
                method: 'GET',
                timeout: 60000,
                url: 'http://api.example.com/limit2',
            });
        });
    });
    it('should handle a concurrency of 1 with the first request failing', () => {
        axiosMock.mockReturnValueOnce(new Promise((_resolve, reject) => {
            const id = 'call1';
            setTimeout(() => {
                reject(new Error(id));
            }, 1000);
        }));
        axiosMock.mockReturnValueOnce(new Promise((resolve) => {
            const id = 'call2';
            setTimeout(() => {
                resolve({
                    headers: { myHeader: id },
                    status: 200,
                    data: { id },
                });
            }, 1);
        }));
        const api = new api_1.AnxApi({
            target: 'http://api.example.com',
            rateLimiting: false,
            concurrencyLimit: 1,
            userAgent: 'concurrency',
        });
        expect.assertions(4);
        return Promise.all([
            api.get('/limit').catch((err) => {
                expect(err.message).toEqual('call1');
                expect(axiosMock).toBeCalledWith({
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'concurrency',
                    },
                    method: 'GET',
                    timeout: 60000,
                    url: 'http://api.example.com/limit',
                });
            }),
            api.get('/limit2').then((res2) => {
                expect(res2.body).toEqual({ id: 'call2' });
                expect(axiosMock).toBeCalledWith({
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'concurrency',
                    },
                    method: 'GET',
                    timeout: 60000,
                    url: 'http://api.example.com/limit2',
                });
            }),
        ]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uY3VycmVuY3lBZGFwdGVyLnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY29uY3VycmVuY3lBZGFwdGVyLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsK0JBQStCO0FBRS9CLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbkIsTUFBTSxTQUFTLEdBQWMsZUFBWSxDQUFDO0FBRTFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7SUFDcEMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNkLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7UUFDM0MsU0FBUyxDQUFDLG1CQUFtQixDQUM1QixJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQ3ZCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUNuQixVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNmLE9BQU8sQ0FBQztvQkFDUCxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO29CQUN6QixNQUFNLEVBQUUsR0FBRztvQkFDWCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUU7aUJBQ1osQ0FBQyxDQUFDO1lBQ0osQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ1YsQ0FBQyxDQUFDLENBQ0YsQ0FBQztRQUVGLFNBQVMsQ0FBQyxtQkFBbUIsQ0FDNUIsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUN2QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDbkIsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDZixPQUFPLENBQUM7b0JBQ1AsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtvQkFDekIsTUFBTSxFQUFFLEdBQUc7b0JBQ1gsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFO2lCQUNaLENBQUMsQ0FBQztZQUNKLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUNGLENBQUM7UUFFRixNQUFNLEdBQUcsR0FBRyxJQUFJLFlBQU0sQ0FBQztZQUN0QixNQUFNLEVBQUUsd0JBQXdCO1lBQ2hDLFlBQVksRUFBRSxLQUFLO1lBQ25CLGdCQUFnQixFQUFFLENBQUM7WUFDbkIsU0FBUyxFQUFFLGFBQWE7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVyQixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDakYsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRTNDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxjQUFjLENBQUM7Z0JBQ2hDLE9BQU8sRUFBRTtvQkFDUixNQUFNLEVBQUUsa0JBQWtCO29CQUMxQixZQUFZLEVBQUUsYUFBYTtpQkFDM0I7Z0JBQ0QsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsR0FBRyxFQUFFLDhCQUE4QjthQUNuQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsY0FBYyxDQUFDO2dCQUNoQyxPQUFPLEVBQUU7b0JBQ1IsTUFBTSxFQUFFLGtCQUFrQjtvQkFDMUIsWUFBWSxFQUFFLGFBQWE7aUJBQzNCO2dCQUNELE1BQU0sRUFBRSxLQUFLO2dCQUNiLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEdBQUcsRUFBRSwrQkFBK0I7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxpRUFBaUUsRUFBRSxHQUFHLEVBQUU7UUFDMUUsU0FBUyxDQUFDLG1CQUFtQixDQUM1QixJQUFJLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNoQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDbkIsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDZixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDVixDQUFDLENBQUMsQ0FDRixDQUFDO1FBRUYsU0FBUyxDQUFDLG1CQUFtQixDQUM1QixJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQ3ZCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUNuQixVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNmLE9BQU8sQ0FBQztvQkFDUCxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO29CQUN6QixNQUFNLEVBQUUsR0FBRztvQkFDWCxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUU7aUJBQ1osQ0FBQyxDQUFDO1lBQ0osQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQ0YsQ0FBQztRQUVGLE1BQU0sR0FBRyxHQUFHLElBQUksWUFBTSxDQUFDO1lBQ3RCLE1BQU0sRUFBRSx3QkFBd0I7WUFDaEMsWUFBWSxFQUFFLEtBQUs7WUFDbkIsZ0JBQWdCLEVBQUUsQ0FBQztZQUNuQixTQUFTLEVBQUUsYUFBYTtTQUN4QixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXJCLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNsQixHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUMvQixNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFckMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztvQkFDaEMsT0FBTyxFQUFFO3dCQUNSLE1BQU0sRUFBRSxrQkFBa0I7d0JBQzFCLFlBQVksRUFBRSxhQUFhO3FCQUMzQjtvQkFDRCxNQUFNLEVBQUUsS0FBSztvQkFDYixPQUFPLEVBQUUsS0FBSztvQkFDZCxHQUFHLEVBQUUsOEJBQThCO2lCQUNuQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUM7WUFDRixHQUFHLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUUzQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsY0FBYyxDQUFDO29CQUNoQyxPQUFPLEVBQUU7d0JBQ1IsTUFBTSxFQUFFLGtCQUFrQjt3QkFDMUIsWUFBWSxFQUFFLGFBQWE7cUJBQzNCO29CQUNELE1BQU0sRUFBRSxLQUFLO29CQUNiLE9BQU8sRUFBRSxLQUFLO29CQUNkLEdBQUcsRUFBRSwrQkFBK0I7aUJBQ3BDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IHsgQW54QXBpIH0gZnJvbSAnLi9hcGknO1xuXG5qZXN0Lm1vY2soJ2F4aW9zJyk7XG5jb25zdCBheGlvc01vY2s6IGplc3QuTW9jayA9IGF4aW9zIGFzIGFueTtcblxuZGVzY3JpYmUoJ0NvbmN1cnJlbmN5IEFkYXB0ZXInLCAoKSA9PiB7XG5cdGFmdGVyRWFjaCgoKSA9PiB7XG5cdFx0YXhpb3NNb2NrLm1vY2tSZXNldCgpO1xuXHR9KTtcblxuXHRpdCgnc2hvdWxkIGhhbmRsZSBhIGNvbmN1cnJlbmN5IG9mIDEnLCAoKSA9PiB7XG5cdFx0YXhpb3NNb2NrLm1vY2tSZXR1cm5WYWx1ZU9uY2UoXG5cdFx0XHRuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0XHRjb25zdCBpZCA9ICdjYWxsMSc7XG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRcdHJlc29sdmUoe1xuXHRcdFx0XHRcdFx0aGVhZGVyczogeyBteUhlYWRlcjogaWQgfSxcblx0XHRcdFx0XHRcdHN0YXR1czogMjAwLFxuXHRcdFx0XHRcdFx0ZGF0YTogeyBpZCB9LFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9LCAxMDAwKTtcblx0XHRcdH0pLFxuXHRcdCk7XG5cblx0XHRheGlvc01vY2subW9ja1JldHVyblZhbHVlT25jZShcblx0XHRcdG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGlkID0gJ2NhbGwyJztcblx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0cmVzb2x2ZSh7XG5cdFx0XHRcdFx0XHRoZWFkZXJzOiB7IG15SGVhZGVyOiBpZCB9LFxuXHRcdFx0XHRcdFx0c3RhdHVzOiAyMDAsXG5cdFx0XHRcdFx0XHRkYXRhOiB7IGlkIH0sXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0sIDEpO1xuXHRcdFx0fSksXG5cdFx0KTtcblxuXHRcdGNvbnN0IGFwaSA9IG5ldyBBbnhBcGkoe1xuXHRcdFx0dGFyZ2V0OiAnaHR0cDovL2FwaS5leGFtcGxlLmNvbScsXG5cdFx0XHRyYXRlTGltaXRpbmc6IGZhbHNlLFxuXHRcdFx0Y29uY3VycmVuY3lMaW1pdDogMSxcblx0XHRcdHVzZXJBZ2VudDogJ2NvbmN1cnJlbmN5Jyxcblx0XHR9KTtcblxuXHRcdGV4cGVjdC5hc3NlcnRpb25zKDQpO1xuXG5cdFx0cmV0dXJuIFByb21pc2UuYWxsKFthcGkuZ2V0KCcvbGltaXQnKSwgYXBpLmdldCgnL2xpbWl0MicpXSkudGhlbigoW3JlczEsIHJlczJdKSA9PiB7XG5cdFx0XHRleHBlY3QocmVzMS5ib2R5KS50b0VxdWFsKHsgaWQ6ICdjYWxsMScgfSk7XG5cdFx0XHRleHBlY3QocmVzMi5ib2R5KS50b0VxdWFsKHsgaWQ6ICdjYWxsMicgfSk7XG5cblx0XHRcdGV4cGVjdChheGlvc01vY2spLnRvQmVDYWxsZWRXaXRoKHtcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdCdVc2VyLUFnZW50JzogJ2NvbmN1cnJlbmN5Jyxcblx0XHRcdFx0fSxcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dGltZW91dDogNjAwMDAsXG5cdFx0XHRcdHVybDogJ2h0dHA6Ly9hcGkuZXhhbXBsZS5jb20vbGltaXQnLFxuXHRcdFx0fSk7XG5cblx0XHRcdGV4cGVjdChheGlvc01vY2spLnRvQmVDYWxsZWRXaXRoKHtcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdCdVc2VyLUFnZW50JzogJ2NvbmN1cnJlbmN5Jyxcblx0XHRcdFx0fSxcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dGltZW91dDogNjAwMDAsXG5cdFx0XHRcdHVybDogJ2h0dHA6Ly9hcGkuZXhhbXBsZS5jb20vbGltaXQyJyxcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRpdCgnc2hvdWxkIGhhbmRsZSBhIGNvbmN1cnJlbmN5IG9mIDEgd2l0aCB0aGUgZmlyc3QgcmVxdWVzdCBmYWlsaW5nJywgKCkgPT4ge1xuXHRcdGF4aW9zTW9jay5tb2NrUmV0dXJuVmFsdWVPbmNlKFxuXHRcdFx0bmV3IFByb21pc2UoKF9yZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0Y29uc3QgaWQgPSAnY2FsbDEnO1xuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKGlkKSk7XG5cdFx0XHRcdH0sIDEwMDApO1xuXHRcdFx0fSksXG5cdFx0KTtcblxuXHRcdGF4aW9zTW9jay5tb2NrUmV0dXJuVmFsdWVPbmNlKFxuXHRcdFx0bmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdFx0Y29uc3QgaWQgPSAnY2FsbDInO1xuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRyZXNvbHZlKHtcblx0XHRcdFx0XHRcdGhlYWRlcnM6IHsgbXlIZWFkZXI6IGlkIH0sXG5cdFx0XHRcdFx0XHRzdGF0dXM6IDIwMCxcblx0XHRcdFx0XHRcdGRhdGE6IHsgaWQgfSxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSwgMSk7XG5cdFx0XHR9KSxcblx0XHQpO1xuXG5cdFx0Y29uc3QgYXBpID0gbmV3IEFueEFwaSh7XG5cdFx0XHR0YXJnZXQ6ICdodHRwOi8vYXBpLmV4YW1wbGUuY29tJyxcblx0XHRcdHJhdGVMaW1pdGluZzogZmFsc2UsXG5cdFx0XHRjb25jdXJyZW5jeUxpbWl0OiAxLFxuXHRcdFx0dXNlckFnZW50OiAnY29uY3VycmVuY3knLFxuXHRcdH0pO1xuXG5cdFx0ZXhwZWN0LmFzc2VydGlvbnMoNCk7XG5cblx0XHRyZXR1cm4gUHJvbWlzZS5hbGwoW1xuXHRcdFx0YXBpLmdldCgnL2xpbWl0JykuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRleHBlY3QoZXJyLm1lc3NhZ2UpLnRvRXF1YWwoJ2NhbGwxJyk7XG5cblx0XHRcdFx0ZXhwZWN0KGF4aW9zTW9jaykudG9CZUNhbGxlZFdpdGgoe1xuXHRcdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHRcdEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdFx0J1VzZXItQWdlbnQnOiAnY29uY3VycmVuY3knLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0XHR0aW1lb3V0OiA2MDAwMCxcblx0XHRcdFx0XHR1cmw6ICdodHRwOi8vYXBpLmV4YW1wbGUuY29tL2xpbWl0Jyxcblx0XHRcdFx0fSk7XG5cdFx0XHR9KSxcblx0XHRcdGFwaS5nZXQoJy9saW1pdDInKS50aGVuKChyZXMyKSA9PiB7XG5cdFx0XHRcdGV4cGVjdChyZXMyLmJvZHkpLnRvRXF1YWwoeyBpZDogJ2NhbGwyJyB9KTtcblxuXHRcdFx0XHRleHBlY3QoYXhpb3NNb2NrKS50b0JlQ2FsbGVkV2l0aCh7XG5cdFx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdFx0QWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHRcdFx0XHQnVXNlci1BZ2VudCc6ICdjb25jdXJyZW5jeScsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHRcdHRpbWVvdXQ6IDYwMDAwLFxuXHRcdFx0XHRcdHVybDogJ2h0dHA6Ly9hcGkuZXhhbXBsZS5jb20vbGltaXQyJyxcblx0XHRcdFx0fSk7XG5cdFx0XHR9KSxcblx0XHRdKTtcblx0fSk7XG59KTtcbiJdfQ==