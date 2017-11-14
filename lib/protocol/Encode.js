"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hessian_js_1 = require("hessian.js");
var buffer_1 = require("buffer");
var DEFAULT_LEN = 8388608; // 8 * 1024 * 1024 default body max length
var Encode = /** @class */ (function () {
    function Encode(options) {
        var _this = this;
        this.head = function (bodyLen) {
            var head = [0xda, 0xbb, 0xc2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            var i = 15;
            if (bodyLen > DEFAULT_LEN) {
                throw new Error("Data length too large: " + bodyLen + ", max payload: " + DEFAULT_LEN);
            }
            while (bodyLen >= 256) {
                head.splice(i--, 1, bodyLen % 256);
                bodyLen >>= 8;
            }
            head.splice(i, 1, bodyLen);
            return new buffer_1.Buffer(head);
        };
        this.body = function () {
            var dubboVer = _this.options.dubboVer || "2.5.3.6";
            var args = _this.options.args;
            var body = new hessian_js_1.EncoderV2();
            body.write(dubboVer);
            body.write(_this.options.interfac);
            body.write(_this.options.version);
            body.write(_this.options.method);
            if (dubboVer.startsWith("2.8")) {
                body.write(-1); //for dubbox 2.8.X
            }
            body.write(_this.getArgTypes());
            if (args && args.length) {
                for (var i = 0, len = args.length; i < len; ++i) {
                    body.write(args[i]);
                }
            }
            body.write(_this.getAttachments());
            return body.byteBuffer._bytes.slice(0, body.byteBuffer._offset);
        };
        this.getArgTypes = function () {
            var args = _this.options.args;
            if (!(args && args.length)) {
                return "";
            }
            var typeRef = {
                boolean: "Z",
                int: "I",
                short: "S",
                long: "J",
                double: "D",
                float: "F"
            };
            var argTypes = "";
            var type;
            for (var i = 0, l = args.length; i < l; i++) {
                type = args[i]["$class"];
                if (type.charAt(0) === "[") {
                    argTypes += ~type.indexOf(".")
                        ? "[L" + type.slice(1).replace(/\./gi, "/") + ";"
                        : "[" + typeRef[type.slice(1)];
                }
                else {
                    argTypes +=
                        type && ~type.indexOf(".")
                            ? "L" + type.replace(/\./gi, "/") + ";"
                            : typeRef[type];
                }
            }
            return argTypes;
        };
        this.getAttachments = function () {
            var _a = _this.options, interfac = _a.interfac, version = _a.version, group = _a.group, timeout = _a.timeout;
            var implicitArgs = {
                interface: interfac,
                path: interfac,
                timeout: timeout
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
        this.options = options;
    }
    Encode.prototype.getBuffer = function () {
        var body = this.body();
        var head = this.head(body.length);
        return buffer_1.Buffer.concat([head, body]);
    };
    return Encode;
}());
exports.default = Encode;
