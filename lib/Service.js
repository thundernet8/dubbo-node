"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var qs = require("querystring");
var net = require("net");
var url = require("url");
var js_to_java_1 = require("js-to-java");
var encode_1 = require("./libs/encode");
var decode = require("./libs/decode");
var ServiceImpl = /** @class */ (function () {
    function ServiceImpl(zookeeperClient, dubboVer, serviceInfo, dubbo) {
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
                        _this.hosts.push(url.parse(Object.keys(zoo)[0])
                            .host);
                        var methods = zoo.methods.split(",");
                        for (var j = 0, k = methods.length; j < k; j++) {
                            _this.executors[methods[i]] = (function (method) {
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
                            })(methods[i]);
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
        this.flush = function (cb) {
            _this.find(_this._interface, cb);
        };
        this.execute = function (method, args) {
            _this.encodeParam._method = method;
            _this.encodeParam._args = args;
            var buffer = new encode_1.Encode(_this.encodeParam);
            return new Promise(function (resolve, reject) {
                var client = new net.Socket();
                var host = _this.hosts[(Math.random() * _this.hosts.length) | 0].split(":");
                var chunks = [];
                var heap;
                var bufferLength = 16;
                client.connect(Number(host[1]), host[0], function () {
                    client.write(buffer);
                });
                client.on("error", function () {
                    _this.flush(function () {
                        host = _this.hosts[(Math.random() * _this.hosts.length) | 0].split(":");
                        client.connect(Number(host[1]), host[0], function () {
                            client.write(buffer);
                        });
                    });
                });
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
                    heap.length >= bufferLength && client.destroy();
                });
                client.on("close", function (err) {
                    if (!err) {
                        decode(heap, function (err, result) {
                            if (err) {
                                return reject(err);
                            }
                            return resolve(result);
                        });
                    }
                });
            });
        };
        this.getExecutor = function (method) {
            return _this.executors[method];
        };
        this.zookeeper = zookeeperClient;
        this.version = serviceInfo.version;
        this.dubboVer = dubboVer;
        this.group = serviceInfo.group || dubbo.getGroup();
        this._interface = serviceInfo._interface;
        this.methods = Object.assign({}, serviceInfo.methods);
        this.root = dubbo.getRoot();
        this.encodeParam = {
            _dver: this.dubboVer || "2.5.3.6",
            _interface: this._interface,
            _version: this.version,
            _group: this.group || dubbo.getGroup(),
            _timeout: serviceInfo.timeout || dubbo.getTimeout()
        };
        this.find(serviceInfo._interface);
    }
    return ServiceImpl;
}());
exports.default = ServiceImpl;
