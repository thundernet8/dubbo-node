import { DecoderV2 as Decoder } from "hessian.js";

enum ResponseCode {
    OK = 20,
    CLIENT_TIMEOUT = 30,
    SERVER_TIMEOUT = 31,
    BAD_REQUEST = 40,
    BAD_RESPONSE = 50,
    SERVICE_NOT_FOUND = 60,
    SERVICE_ERROR = 70,
    SERVER_ERROR = 80,
    CLIENT_ERROR = 90
}

enum ResponseType {
    RESPONSE_WITH_EXCEPTION,
    RESPONSE_VALUE,
    RESPONSE_NULL_VALUE
}

export default function(heap: number[], cb) {
    let flag, result;
    if (heap[3] !== ResponseCode.OK) {
        return cb(heap.slice(18, heap.length - 1).toString());
    }

    try {
        result = new Decoder(heap.slice(16, heap.length));
        flag = result.readInt();

        switch (flag) {
            case ResponseType.RESPONSE_NULL_VALUE:
                cb(null, null);
                break;
            case ResponseType.RESPONSE_VALUE:
                cb(null, result.read());
                break;
            case ResponseType.RESPONSE_WITH_EXCEPTION:
                let excpt = result.read();
                if (!(excpt instanceof Error)) {
                    excpt = new Error(excpt);
                }
                cb(excpt);
                break;
            default:
                cb(
                    new Error(
                        `Unknow result flag, expect '0', '1', '2', got ${flag}`
                    )
                );
        }
    } catch (err) {
        cb(err);
    }
}
