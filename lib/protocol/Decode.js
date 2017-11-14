"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hessian_js_1 = require("hessian.js");
var ResponseCode;
(function (ResponseCode) {
    ResponseCode[ResponseCode["OK"] = 20] = "OK";
    ResponseCode[ResponseCode["CLIENT_TIMEOUT"] = 30] = "CLIENT_TIMEOUT";
    ResponseCode[ResponseCode["SERVER_TIMEOUT"] = 31] = "SERVER_TIMEOUT";
    ResponseCode[ResponseCode["BAD_REQUEST"] = 40] = "BAD_REQUEST";
    ResponseCode[ResponseCode["BAD_RESPONSE"] = 50] = "BAD_RESPONSE";
    ResponseCode[ResponseCode["SERVICE_NOT_FOUND"] = 60] = "SERVICE_NOT_FOUND";
    ResponseCode[ResponseCode["SERVICE_ERROR"] = 70] = "SERVICE_ERROR";
    ResponseCode[ResponseCode["SERVER_ERROR"] = 80] = "SERVER_ERROR";
    ResponseCode[ResponseCode["CLIENT_ERROR"] = 90] = "CLIENT_ERROR";
})(ResponseCode || (ResponseCode = {}));
var ResponseType;
(function (ResponseType) {
    ResponseType[ResponseType["RESPONSE_WITH_EXCEPTION"] = 0] = "RESPONSE_WITH_EXCEPTION";
    ResponseType[ResponseType["RESPONSE_VALUE"] = 1] = "RESPONSE_VALUE";
    ResponseType[ResponseType["RESPONSE_NULL_VALUE"] = 2] = "RESPONSE_NULL_VALUE";
})(ResponseType || (ResponseType = {}));
function default_1(heap, cb) {
    var flag, result;
    if (heap[3] !== ResponseCode.OK) {
        return cb(heap.slice(18, heap.length - 1).toString());
    }
    try {
        result = new hessian_js_1.DecoderV2(heap.slice(16, heap.length));
        flag = result.readInt();
        switch (flag) {
            case ResponseType.RESPONSE_NULL_VALUE:
                cb(null, null);
                break;
            case ResponseType.RESPONSE_VALUE:
                cb(null, result.read());
                break;
            case ResponseType.RESPONSE_WITH_EXCEPTION:
                var excpt = result.read();
                if (!(excpt instanceof Error)) {
                    excpt = new Error(excpt);
                }
                cb(excpt);
                break;
            default:
                cb(new Error("Unknow result flag, expect '0', '1', '2', got " + flag));
        }
    }
    catch (err) {
        cb(err);
    }
}
exports.default = default_1;
