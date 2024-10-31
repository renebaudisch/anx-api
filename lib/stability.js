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
exports.deprecatedMethod = exports.experimentalMethod = void 0;
const _ = __importStar(require("lodash"));
const warnings = {
    experimental: {},
    deprecated: {},
};
const experimentalMethod = (methodName, className) => {
    if (!warnings.experimental[methodName + className]) {
        warnings.experimental[methodName + className] = _.once(() => {
            // tslint:disable-next-line:no-console
            const log = (console.warn || console.log || _.noop).bind(console);
            log(`Method ${className}.${methodName} is experimental, use with caution.`);
        });
    }
    warnings.experimental[methodName + className]();
};
exports.experimentalMethod = experimentalMethod;
const deprecatedMethod = (methodName, className, useName) => {
    if (!warnings.deprecated[methodName + className + useName]) {
        warnings.deprecated[methodName + className + useName] = _.once(() => {
            // tslint:disable-next-line:no-console
            const log = (console.warn || console.log || _.noop).bind(console);
            log(`Method ${className}.${methodName} is deprecated, use ${className}.${useName} instead.`);
        });
    }
    warnings.deprecated[methodName + className + useName]();
};
exports.deprecatedMethod = deprecatedMethod;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhYmlsaXR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0YWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUU1QixNQUFNLFFBQVEsR0FBRztJQUNoQixZQUFZLEVBQUUsRUFBRTtJQUNoQixVQUFVLEVBQUUsRUFBRTtDQUNkLENBQUM7QUFFSyxNQUFNLGtCQUFrQixHQUFHLENBQUMsVUFBa0IsRUFBRSxTQUFpQixFQUFRLEVBQUU7SUFDakYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxFQUFFO1FBQ25ELFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQzNELHNDQUFzQztZQUN0QyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xFLEdBQUcsQ0FBQyxVQUFVLFNBQVMsSUFBSSxVQUFVLHFDQUFxQyxDQUFDLENBQUM7UUFDN0UsQ0FBQyxDQUFDLENBQUM7S0FDSDtJQUNELFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFDakQsQ0FBQyxDQUFDO0FBVFcsUUFBQSxrQkFBa0Isc0JBUzdCO0FBRUssTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFVBQWtCLEVBQUUsU0FBaUIsRUFBRSxPQUFlLEVBQVEsRUFBRTtJQUNoRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEdBQUcsU0FBUyxHQUFHLE9BQU8sQ0FBQyxFQUFFO1FBQzNELFFBQVEsQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFHLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNuRSxzQ0FBc0M7WUFDdEMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRSxHQUFHLENBQUMsVUFBVSxTQUFTLElBQUksVUFBVSx1QkFBdUIsU0FBUyxJQUFJLE9BQU8sV0FBVyxDQUFDLENBQUM7UUFDOUYsQ0FBQyxDQUFDLENBQUM7S0FDSDtJQUNELFFBQVEsQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFHLFNBQVMsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDO0FBQ3pELENBQUMsQ0FBQztBQVRXLFFBQUEsZ0JBQWdCLG9CQVMzQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcblxuY29uc3Qgd2FybmluZ3MgPSB7XG5cdGV4cGVyaW1lbnRhbDoge30sXG5cdGRlcHJlY2F0ZWQ6IHt9LFxufTtcblxuZXhwb3J0IGNvbnN0IGV4cGVyaW1lbnRhbE1ldGhvZCA9IChtZXRob2ROYW1lOiBzdHJpbmcsIGNsYXNzTmFtZTogc3RyaW5nKTogdm9pZCA9PiB7XG5cdGlmICghd2FybmluZ3MuZXhwZXJpbWVudGFsW21ldGhvZE5hbWUgKyBjbGFzc05hbWVdKSB7XG5cdFx0d2FybmluZ3MuZXhwZXJpbWVudGFsW21ldGhvZE5hbWUgKyBjbGFzc05hbWVdID0gXy5vbmNlKCgpID0+IHtcblx0XHRcdC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG5cdFx0XHRjb25zdCBsb2cgPSAoY29uc29sZS53YXJuIHx8IGNvbnNvbGUubG9nIHx8IF8ubm9vcCkuYmluZChjb25zb2xlKTtcblx0XHRcdGxvZyhgTWV0aG9kICR7Y2xhc3NOYW1lfS4ke21ldGhvZE5hbWV9IGlzIGV4cGVyaW1lbnRhbCwgdXNlIHdpdGggY2F1dGlvbi5gKTtcblx0XHR9KTtcblx0fVxuXHR3YXJuaW5ncy5leHBlcmltZW50YWxbbWV0aG9kTmFtZSArIGNsYXNzTmFtZV0oKTtcbn07XG5cbmV4cG9ydCBjb25zdCBkZXByZWNhdGVkTWV0aG9kID0gKG1ldGhvZE5hbWU6IHN0cmluZywgY2xhc3NOYW1lOiBzdHJpbmcsIHVzZU5hbWU6IHN0cmluZyk6IHZvaWQgPT4ge1xuXHRpZiAoIXdhcm5pbmdzLmRlcHJlY2F0ZWRbbWV0aG9kTmFtZSArIGNsYXNzTmFtZSArIHVzZU5hbWVdKSB7XG5cdFx0d2FybmluZ3MuZGVwcmVjYXRlZFttZXRob2ROYW1lICsgY2xhc3NOYW1lICsgdXNlTmFtZV0gPSBfLm9uY2UoKCkgPT4ge1xuXHRcdFx0Ly8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcblx0XHRcdGNvbnN0IGxvZyA9IChjb25zb2xlLndhcm4gfHwgY29uc29sZS5sb2cgfHwgXy5ub29wKS5iaW5kKGNvbnNvbGUpO1xuXHRcdFx0bG9nKGBNZXRob2QgJHtjbGFzc05hbWV9LiR7bWV0aG9kTmFtZX0gaXMgZGVwcmVjYXRlZCwgdXNlICR7Y2xhc3NOYW1lfS4ke3VzZU5hbWV9IGluc3RlYWQuYCk7XG5cdFx0fSk7XG5cdH1cblx0d2FybmluZ3MuZGVwcmVjYXRlZFttZXRob2ROYW1lICsgY2xhc3NOYW1lICsgdXNlTmFtZV0oKTtcbn07XG4iXX0=