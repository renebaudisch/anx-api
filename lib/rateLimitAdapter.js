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
exports.rateLimitAdapter = void 0;
const _ = __importStar(require("lodash"));
const request_queue_1 = require("./request-queue");
const DEFAULT_READ_LIMIT = 100;
const DEFAULT_READ_LIMIT_SECONDS = 60;
const DEFAULT_READ_LIMIT_HEADER = 'x-ratelimit-read';
const DEFAULT_WRITE_LIMIT = 60;
const DEFAULT_WRITE_LIMIT_SECONDS = 60;
const DEFAULT_WRITE_LIMIT_HEADER = 'x-ratelimit-write';
const rateLimitAdapter = (options) => {
    const readQueue = new request_queue_1.RequestQueue({
        request: options.request,
        limit: options.rateLimitRead || DEFAULT_READ_LIMIT,
        limitSeconds: options.rateLimitReadSeconds || DEFAULT_READ_LIMIT_SECONDS,
        limitHeader: DEFAULT_READ_LIMIT_HEADER,
        onRateLimitExceeded: _.partial(options.onRateLimitExceeded || _.noop, 'READ'),
        onRateLimitPause: _.partial(options.onRateLimitPause || _.noop, 'READ'),
        onRateLimitResume: _.partial(options.onRateLimitResume || _.noop, 'READ'),
    });
    const writeQueue = new request_queue_1.RequestQueue({
        request: options.request,
        limit: options.rateLimitWrite || DEFAULT_WRITE_LIMIT,
        limitSeconds: options.rateLimitWriteSeconds || DEFAULT_WRITE_LIMIT_SECONDS,
        limitHeader: DEFAULT_WRITE_LIMIT_HEADER,
        onRateLimitExceeded: _.partial(options.onRateLimitExceeded || _.noop, 'WRITE'),
        onRateLimitPause: _.partial(options.onRateLimitPause || _.noop, 'WRITE'),
        onRateLimitResume: _.partial(options.onRateLimitResume || _.noop, 'WRITE'),
    });
    return (opts) => {
        return opts.method === 'GET' ? readQueue.enqueue(opts) : writeQueue.enqueue(opts);
    };
};
exports.rateLimitAdapter = rateLimitAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF0ZUxpbWl0QWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yYXRlTGltaXRBZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMENBQTRCO0FBRTVCLG1EQUErQztBQUcvQyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztBQUMvQixNQUFNLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztBQUN0QyxNQUFNLHlCQUF5QixHQUFHLGtCQUFrQixDQUFDO0FBQ3JELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBQy9CLE1BQU0sMkJBQTJCLEdBQUcsRUFBRSxDQUFDO0FBQ3ZDLE1BQU0sMEJBQTBCLEdBQUcsbUJBQW1CLENBQUM7QUFhaEQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLE9BQWlDLEVBQXNELEVBQUU7SUFDekgsTUFBTSxTQUFTLEdBQWlCLElBQUksNEJBQVksQ0FBQztRQUNoRCxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDeEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhLElBQUksa0JBQWtCO1FBQ2xELFlBQVksRUFBRSxPQUFPLENBQUMsb0JBQW9CLElBQUksMEJBQTBCO1FBQ3hFLFdBQVcsRUFBRSx5QkFBeUI7UUFDdEMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsbUJBQW1CLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7UUFDN0UsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7UUFDdkUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7S0FDekUsQ0FBQyxDQUFDO0lBRUgsTUFBTSxVQUFVLEdBQWlCLElBQUksNEJBQVksQ0FBQztRQUNqRCxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDeEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxjQUFjLElBQUksbUJBQW1CO1FBQ3BELFlBQVksRUFBRSxPQUFPLENBQUMscUJBQXFCLElBQUksMkJBQTJCO1FBQzFFLFdBQVcsRUFBRSwwQkFBMEI7UUFDdkMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsbUJBQW1CLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7UUFDOUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7UUFDeEUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7S0FDMUUsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxDQUFDLElBQTZCLEVBQWlCLEVBQUU7UUFDdkQsT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuRixDQUFDLENBQUM7QUFDSCxDQUFDLENBQUM7QUF2QlcsUUFBQSxnQkFBZ0Isb0JBdUIzQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IElSZXF1ZXN0T3B0aW9uc0ludGVybmFsIH0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHsgUmVxdWVzdFF1ZXVlIH0gZnJvbSAnLi9yZXF1ZXN0LXF1ZXVlJztcbmltcG9ydCB7IElSZXNwb25zZSB9IGZyb20gJy4vdHlwZXMnO1xuXG5jb25zdCBERUZBVUxUX1JFQURfTElNSVQgPSAxMDA7XG5jb25zdCBERUZBVUxUX1JFQURfTElNSVRfU0VDT05EUyA9IDYwO1xuY29uc3QgREVGQVVMVF9SRUFEX0xJTUlUX0hFQURFUiA9ICd4LXJhdGVsaW1pdC1yZWFkJztcbmNvbnN0IERFRkFVTFRfV1JJVEVfTElNSVQgPSA2MDtcbmNvbnN0IERFRkFVTFRfV1JJVEVfTElNSVRfU0VDT05EUyA9IDYwO1xuY29uc3QgREVGQVVMVF9XUklURV9MSU1JVF9IRUFERVIgPSAneC1yYXRlbGltaXQtd3JpdGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElSYXRlTGltaXRBZGFwdGVyT3B0aW9ucyB7XG5cdHJlcXVlc3Q6IChvcHRzOiBJUmVxdWVzdE9wdGlvbnNJbnRlcm5hbCkgPT4gUHJvbWlzZTxJUmVzcG9uc2U+O1xuXHRyYXRlTGltaXRSZWFkPzogbnVtYmVyO1xuXHRyYXRlTGltaXRSZWFkU2Vjb25kcz86IG51bWJlcjtcblx0cmF0ZUxpbWl0V3JpdGU/OiBudW1iZXI7XG5cdHJhdGVMaW1pdFdyaXRlU2Vjb25kcz86IG51bWJlcjtcblx0b25SYXRlTGltaXRFeGNlZWRlZD86IChlcnI6IGFueSkgPT4gYW55O1xuXHRvblJhdGVMaW1pdFBhdXNlPzogKCkgPT4gYW55O1xuXHRvblJhdGVMaW1pdFJlc3VtZT86ICgpID0+IGFueTtcbn1cblxuZXhwb3J0IGNvbnN0IHJhdGVMaW1pdEFkYXB0ZXIgPSAob3B0aW9uczogSVJhdGVMaW1pdEFkYXB0ZXJPcHRpb25zKTogKChvcHRzOiBJUmVxdWVzdE9wdGlvbnNJbnRlcm5hbCkgPT4gUHJvbWlzZTx2b2lkPikgPT4ge1xuXHRjb25zdCByZWFkUXVldWU6IFJlcXVlc3RRdWV1ZSA9IG5ldyBSZXF1ZXN0UXVldWUoe1xuXHRcdHJlcXVlc3Q6IG9wdGlvbnMucmVxdWVzdCxcblx0XHRsaW1pdDogb3B0aW9ucy5yYXRlTGltaXRSZWFkIHx8IERFRkFVTFRfUkVBRF9MSU1JVCxcblx0XHRsaW1pdFNlY29uZHM6IG9wdGlvbnMucmF0ZUxpbWl0UmVhZFNlY29uZHMgfHwgREVGQVVMVF9SRUFEX0xJTUlUX1NFQ09ORFMsXG5cdFx0bGltaXRIZWFkZXI6IERFRkFVTFRfUkVBRF9MSU1JVF9IRUFERVIsXG5cdFx0b25SYXRlTGltaXRFeGNlZWRlZDogXy5wYXJ0aWFsKG9wdGlvbnMub25SYXRlTGltaXRFeGNlZWRlZCB8fCBfLm5vb3AsICdSRUFEJyksXG5cdFx0b25SYXRlTGltaXRQYXVzZTogXy5wYXJ0aWFsKG9wdGlvbnMub25SYXRlTGltaXRQYXVzZSB8fCBfLm5vb3AsICdSRUFEJyksXG5cdFx0b25SYXRlTGltaXRSZXN1bWU6IF8ucGFydGlhbChvcHRpb25zLm9uUmF0ZUxpbWl0UmVzdW1lIHx8IF8ubm9vcCwgJ1JFQUQnKSxcblx0fSk7XG5cblx0Y29uc3Qgd3JpdGVRdWV1ZTogUmVxdWVzdFF1ZXVlID0gbmV3IFJlcXVlc3RRdWV1ZSh7XG5cdFx0cmVxdWVzdDogb3B0aW9ucy5yZXF1ZXN0LFxuXHRcdGxpbWl0OiBvcHRpb25zLnJhdGVMaW1pdFdyaXRlIHx8IERFRkFVTFRfV1JJVEVfTElNSVQsXG5cdFx0bGltaXRTZWNvbmRzOiBvcHRpb25zLnJhdGVMaW1pdFdyaXRlU2Vjb25kcyB8fCBERUZBVUxUX1dSSVRFX0xJTUlUX1NFQ09ORFMsXG5cdFx0bGltaXRIZWFkZXI6IERFRkFVTFRfV1JJVEVfTElNSVRfSEVBREVSLFxuXHRcdG9uUmF0ZUxpbWl0RXhjZWVkZWQ6IF8ucGFydGlhbChvcHRpb25zLm9uUmF0ZUxpbWl0RXhjZWVkZWQgfHwgXy5ub29wLCAnV1JJVEUnKSxcblx0XHRvblJhdGVMaW1pdFBhdXNlOiBfLnBhcnRpYWwob3B0aW9ucy5vblJhdGVMaW1pdFBhdXNlIHx8IF8ubm9vcCwgJ1dSSVRFJyksXG5cdFx0b25SYXRlTGltaXRSZXN1bWU6IF8ucGFydGlhbChvcHRpb25zLm9uUmF0ZUxpbWl0UmVzdW1lIHx8IF8ubm9vcCwgJ1dSSVRFJyksXG5cdH0pO1xuXHRyZXR1cm4gKG9wdHM6IElSZXF1ZXN0T3B0aW9uc0ludGVybmFsKTogUHJvbWlzZTx2b2lkPiA9PiB7XG5cdFx0cmV0dXJuIG9wdHMubWV0aG9kID09PSAnR0VUJyA/IHJlYWRRdWV1ZS5lbnF1ZXVlKG9wdHMpIDogd3JpdGVRdWV1ZS5lbnF1ZXVlKG9wdHMpO1xuXHR9O1xufTtcbiJdfQ==