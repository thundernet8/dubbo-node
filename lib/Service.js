"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var qs = require("querystring");
var url = require("url");
var js_to_java_1 = require("js-to-java");
var Decode_1 = require("./protocol/Decode");
var Encode_1 = require("./protocol/Encode");
var ServiceImpl = /** @class */ (function () {
    function ServiceImpl(zookeeperClient, poolManager, dubboVer, serviceInfo, dubbo) {
        var _this = this;
        this.hosts = [];
        this.executors = {};
        this.find = function (path, cb) {
            _this.hosts = [];
            _this.zookeeper.getChildren("/" + _this.root + "/" + path + "/providers", _this.find.bind(path), function (err, children) {
                var zoo;
                if (err) {
                    if (err.code === -4) {
                        console.log(err);
                    }
                    return;
                }
                if (children && !children.length) {
                    console.log("Service " + path + " on group " + _this.group + " cannot be found");
                    return;
                }
                for (var i = 0, l = children.length; i < l; i++) {
                    zoo = qs.parse(decodeURIComponent(children[i]));
                    if (zoo.version === _this.version &&
                        zoo.group === _this.group) {
                        var host = url.parse(Object.keys(zoo)[0])
                            .host;
                        _this.poolManager.createPool(host);
                        _this.hosts.push(host);
                        var methods = zoo.methods.split(",");
                        for (var j = 0, k = methods.length; j < k; j++) {
                            _this.executors[methods[j]] = (function (method) {
                                var self = _this;
                                return function () {
                                    var args = Array.from(arguments);
                                    if (args.length && self.methods[method]) {
                                        args = self.methods[method].apply(self, args);
                                        if (typeof args === "function") {
                                            args = args(js_to_java_1.default);
                                        }
                                    }
                                    return self.execute(method, args);
                                };
                            })(methods[j]);
                        }
                    }
                }
                if (_this.hosts.length === 0) {
                    console.log("Service " + path + " on group " + _this.group + " cannot be found");
                    return;
                }
                if (typeof cb === "function") {
                    return cb();
                }
            });
        };
        this.execute = function (method, args) {
            _this.encodeParam.method = method;
            _this.encodeParam.args = args;
            var buffer = new Encode_1.default(_this.encodeParam).getBuffer();
            return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                var client, untriedHosts, tryOnce, chunks, heap, bufferLength;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            untriedHosts = [].concat(this.hosts);
                            tryOnce = function () { return __awaiter(_this, void 0, void 0, function () {
                                var host, pool, err_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            host = untriedHosts.splice((Math.random() * this.hosts.length) | 0, 1)[0];
                                            pool = this.poolManager.getPool(host);
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, pool.getResource()];
                                        case 2:
                                            client = _a.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            err_1 = _a.sent();
                                            return [2 /*return*/, reject(err_1)];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); };
                            return [4 /*yield*/, tryOnce()];
                        case 1:
                            _a.sent();
                            chunks = [];
                            bufferLength = 16;
                            client.write(buffer);
                            client.on("error", function (err) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (untriedHosts.length < 1) {
                                                return [2 /*return*/, reject(err)];
                                            }
                                            return [4 /*yield*/, tryOnce()];
                                        case 1:
                                            _a.sent();
                                            client.write(buffer);
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                            client.on("data", function (chunk) {
                                if (chunks.length < 1) {
                                    var arr = Array.prototype.slice.call(chunk.slice(0, 16));
                                    var i = 0;
                                    while (i < 3) {
                                        bufferLength += arr.pop() * Math.pow(256, i++);
                                    }
                                }
                                chunks.push(chunk);
                                heap = Buffer.concat(chunks);
                                heap.length >= bufferLength && client.release();
                            });
                            client.on("end", function () {
                                // TODO clear
                                console.log("end");
                                console.log("client destroyed?: %s", client.destroyed);
                            });
                            client.on("close", function (err) {
                                // TODO clear
                                console.log("close");
                                console.log("client destroyed?: %s", client.destroyed);
                                if (!err) {
                                    Decode_1.default(heap, function (err, result) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        return resolve(result);
                                    });
                                }
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
        };
        this.getExecutor = function (method) {
            return _this.executors[method];
        };
        // 获取hosts用于初始化必要的socket connection pool
        this.getHosts = function () {
            return _this.hosts;
        };
        this.zookeeper = zookeeperClient;
        this.poolManager = poolManager;
        this.version = serviceInfo.version;
        this.dubboVer = dubboVer;
        this.group = serviceInfo.group || dubbo.getGroup();
        this.interfac = serviceInfo.interfac;
        this.methods = Object.assign({}, serviceInfo.methods);
        this.root = dubbo.getRoot();
        this.encodeParam = {
            dubboVer: this.dubboVer || "2.5.3.6",
            interfac: this.interfac,
            version: this.version,
            group: this.group || dubbo.getGroup(),
            timeout: serviceInfo.timeout || dubbo.getTimeout()
        };
        this.find(serviceInfo.interfac);
    }
    return ServiceImpl;
}());
exports.default = ServiceImpl;
