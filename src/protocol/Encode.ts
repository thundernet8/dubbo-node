import { EncoderV2 as Encoder } from "hessian.js";
import { Buffer } from "buffer";

export interface IEncodeOption {
    dubboVer: string;
    interfac: string;
    version: string;
    group: string;
    timeout: number;
    method: string;
    args: any;
}

const DEFAULT_LEN = 8388608; // 8 * 1024 * 1024 default body max length

export default class Encode {
    private options: IEncodeOption;

    public constructor(options: IEncodeOption) {
        this.options = options;
    }

    public getBuffer() {
        const body = this.body();
        const head = this.head(body.length);
        return Buffer.concat([head, body]);
    }

    private head = (bodyLen: number) => {
        const head = [0xda, 0xbb, 0xc2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let i = 15;
        if (bodyLen > DEFAULT_LEN) {
            throw new Error(
                `Data length too large: ${bodyLen}, max payload: ${DEFAULT_LEN}`
            );
        }
        while (bodyLen >= 256) {
            head.splice(i--, 1, bodyLen % 256);
            bodyLen >>= 8;
        }
        head.splice(i, 1, bodyLen);
        return new Buffer(head);
    };

    private body = () => {
        const dubboVer = this.options.dubboVer || "2.5.3.6";
        const args = this.options.args;

        const body = new Encoder();
        body.write(dubboVer);
        body.write(this.options.interfac);
        body.write(this.options.version);
        body.write(this.options.method);

        if (dubboVer.startsWith("2.8")) {
            body.write(-1); //for dubbox 2.8.X
        }
        body.write(this.getArgTypes());
        if (args && args.length) {
            for (var i = 0, len = args.length; i < len; ++i) {
                body.write(args[i]);
            }
        }
        body.write(this.getAttachments());
        return body.byteBuffer._bytes.slice(
            0,
            body.byteBuffer._offset
        ) as Buffer;
    };

    private getArgTypes = () => {
        const { args } = this.options;
        if (!(args && args.length)) {
            return "";
        }

        const typeRef = {
            boolean: "Z",
            int: "I",
            short: "S",
            long: "J",
            double: "D",
            float: "F"
        };

        let argTypes = "";
        let type;

        for (var i = 0, l = args.length; i < l; i++) {
            type = args[i]["$class"];

            if (type.charAt(0) === "[") {
                argTypes += ~type.indexOf(".")
                    ? "[L" + type.slice(1).replace(/\./gi, "/") + ";"
                    : "[" + typeRef[type.slice(1)];
            } else {
                argTypes +=
                    type && ~type.indexOf(".")
                        ? "L" + type.replace(/\./gi, "/") + ";"
                        : typeRef[type];
            }
        }

        return argTypes;
    };

    private getAttachments = () => {
        const { interfac, version, group, timeout } = this.options;
        const implicitArgs: any = {
            interface: interfac,
            path: interfac,
            timeout
        };

        if (version) {
            implicitArgs.version = version;
        }
        if (group) {
            implicitArgs.group = group;
        }

        return {
            $class: "java.util.HashMap",
            $: implicitArgs
        };
    };
}
