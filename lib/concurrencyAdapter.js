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
exports.concurrencyAdapter = exports.ConcurrencyQueue = void 0;
const _ = __importStar(require("lodash"));
class ConcurrencyQueue {
    constructor(options) {
        this.options = _.assign({}, options);
        this.queue = [];
        this.running = [];
    }
    push(opts) {
        return new Promise((resolve, reject) => {
            const reqInfo = { opts, resolve, reject };
            this.queue.push(reqInfo);
            if (this.running.length < this.options.limit) {
                this.makeRequest(this.queue.shift());
            }
        });
    }
    finished(requestPromise) {
        _.remove(this.running, requestPromise);
        if (this.queue.length > 0) {
            this.makeRequest(this.queue.shift());
        }
    }
    makeRequest(reqInfo) {
        this.options
            .request(reqInfo.opts)
            .then((res) => {
            this.finished(reqInfo);
            reqInfo.resolve(res);
            return null;
        })
            .catch((err) => {
            this.finished(reqInfo);
            reqInfo.reject(err);
        });
        this.running.push(reqInfo);
    }
}
exports.ConcurrencyQueue = ConcurrencyQueue;
const concurrencyAdapter = (options) => {
    const concurrencyQueue = new ConcurrencyQueue(options);
    return (opts) => {
        return concurrencyQueue.push(opts);
    };
};
exports.concurrencyAdapter = concurrencyAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uY3VycmVuY3lBZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmN1cnJlbmN5QWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQVE1QixNQUFhLGdCQUFnQjtJQUs1QixZQUFZLE9BQWlDO1FBQzVDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVNLElBQUksQ0FBQyxJQUE2QjtRQUN4QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3RDLE1BQU0sT0FBTyxHQUFzQixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDN0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtnQkFDN0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7YUFDckM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFTyxRQUFRLENBQUMsY0FBaUM7UUFDakQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQ3JDO0lBQ0YsQ0FBQztJQUVPLFdBQVcsQ0FBQyxPQUEwQjtRQUM3QyxJQUFJLENBQUMsT0FBTzthQUNWLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2FBQ3JCLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2QixPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZCLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFDSixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QixDQUFDO0NBQ0Q7QUExQ0QsNENBMENDO0FBRU0sTUFBTSxrQkFBa0IsR0FBRyxDQUFDLE9BQWlDLEVBQUUsRUFBRTtJQUN2RSxNQUFNLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsT0FBTyxDQUFDLElBQTZCLEVBQWdCLEVBQUU7UUFDdEQsT0FBTyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBTFcsUUFBQSxrQkFBa0Isc0JBSzdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgSVJlcXVlc3RPcHRpb25zSW50ZXJuYWwgfSBmcm9tICcuL2FwaSc7XG5pbXBvcnQgeyBJUmVxdWVzdFF1ZXVlSXRlbSB9IGZyb20gJy4vcmVxdWVzdC1xdWV1ZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbmN1cnJlbmN5UXVldWVPcHRpb25zIHtcblx0bGltaXQ6IG51bWJlcjtcblx0cmVxdWVzdDogKG9wdHM6IGFueSkgPT4gYW55O1xufVxuZXhwb3J0IGNsYXNzIENvbmN1cnJlbmN5UXVldWUge1xuXHRwcml2YXRlIG9wdGlvbnM6IElDb25jdXJyZW5jeVF1ZXVlT3B0aW9ucztcblx0cHJpdmF0ZSBxdWV1ZTogSVJlcXVlc3RRdWV1ZUl0ZW1bXTtcblx0cHJpdmF0ZSBydW5uaW5nOiBJUmVxdWVzdFF1ZXVlSXRlbVtdO1xuXG5cdGNvbnN0cnVjdG9yKG9wdGlvbnM6IElDb25jdXJyZW5jeVF1ZXVlT3B0aW9ucykge1xuXHRcdHRoaXMub3B0aW9ucyA9IF8uYXNzaWduKHt9LCBvcHRpb25zKTtcblx0XHR0aGlzLnF1ZXVlID0gW107XG5cdFx0dGhpcy5ydW5uaW5nID0gW107XG5cdH1cblxuXHRwdWJsaWMgcHVzaChvcHRzOiBJUmVxdWVzdE9wdGlvbnNJbnRlcm5hbCk6IFByb21pc2U8YW55PiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGNvbnN0IHJlcUluZm86IElSZXF1ZXN0UXVldWVJdGVtID0geyBvcHRzLCByZXNvbHZlLCByZWplY3QgfTtcblx0XHRcdHRoaXMucXVldWUucHVzaChyZXFJbmZvKTtcblx0XHRcdGlmICh0aGlzLnJ1bm5pbmcubGVuZ3RoIDwgdGhpcy5vcHRpb25zLmxpbWl0KSB7XG5cdFx0XHRcdHRoaXMubWFrZVJlcXVlc3QodGhpcy5xdWV1ZS5zaGlmdCgpKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgZmluaXNoZWQocmVxdWVzdFByb21pc2U6IElSZXF1ZXN0UXVldWVJdGVtKTogdm9pZCB7XG5cdFx0Xy5yZW1vdmUodGhpcy5ydW5uaW5nLCByZXF1ZXN0UHJvbWlzZSk7XG5cdFx0aWYgKHRoaXMucXVldWUubGVuZ3RoID4gMCkge1xuXHRcdFx0dGhpcy5tYWtlUmVxdWVzdCh0aGlzLnF1ZXVlLnNoaWZ0KCkpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgbWFrZVJlcXVlc3QocmVxSW5mbzogSVJlcXVlc3RRdWV1ZUl0ZW0pOiB2b2lkIHtcblx0XHR0aGlzLm9wdGlvbnNcblx0XHRcdC5yZXF1ZXN0KHJlcUluZm8ub3B0cylcblx0XHRcdC50aGVuKChyZXMpID0+IHtcblx0XHRcdFx0dGhpcy5maW5pc2hlZChyZXFJbmZvKTtcblx0XHRcdFx0cmVxSW5mby5yZXNvbHZlKHJlcyk7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdHRoaXMuZmluaXNoZWQocmVxSW5mbyk7XG5cdFx0XHRcdHJlcUluZm8ucmVqZWN0KGVycik7XG5cdFx0XHR9KTtcblx0XHR0aGlzLnJ1bm5pbmcucHVzaChyZXFJbmZvKTtcblx0fVxufVxuXG5leHBvcnQgY29uc3QgY29uY3VycmVuY3lBZGFwdGVyID0gKG9wdGlvbnM6IElDb25jdXJyZW5jeVF1ZXVlT3B0aW9ucykgPT4ge1xuXHRjb25zdCBjb25jdXJyZW5jeVF1ZXVlID0gbmV3IENvbmN1cnJlbmN5UXVldWUob3B0aW9ucyk7XG5cdHJldHVybiAob3B0czogSVJlcXVlc3RPcHRpb25zSW50ZXJuYWwpOiBQcm9taXNlPGFueT4gPT4ge1xuXHRcdHJldHVybiBjb25jdXJyZW5jeVF1ZXVlLnB1c2gob3B0cyk7XG5cdH07XG59O1xuIl19