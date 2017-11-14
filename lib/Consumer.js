"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Path = require("path");
var url = require("url");
var ip_1 = require("./utils/ip");
var CREATE_MODES;
(function (CREATE_MODES) {
    /**
   * The znode will not be automatically deleted upon client's disconnect.
   */
    CREATE_MODES[CREATE_MODES["PERSISTENT"] = 0] = "PERSISTENT";
    /**
     * The znode will be deleted upon the client's disconnect.
     */
    CREATE_MODES[CREATE_MODES["EPHEMERAL"] = 1] = "EPHEMERAL";
    /**
     * The znode will not be automatically deleted upon client's disconnect,
     * and its name will be appended with a monotonically increasing number.
     */
    CREATE_MODES[CREATE_MODES["PERSISTENT_SEQUENTIAL"] = 2] = "PERSISTENT_SEQUENTIAL";
    /**
     * The znode will be deleted upon the client's disconnect, and its name
     * will be appended with a monotonically increasing number.
     */
    CREATE_MODES[CREATE_MODES["EPHEMERAL_SEQUENTIAL"] = 3] = "EPHEMERAL_SEQUENTIAL";
})(CREATE_MODES || (CREATE_MODES = {}));
var Consumer = /** @class */ (function () {
    function Consumer(dubbo) {
        var _this = this;
        this.init = function () {
            var dubbo = _this.dubbo;
            var client = dubbo.getClient();
            var paths = [];
            var host = ip_1.getIP();
            var services = _this.dubbo.getServices();
            var urlObj = {
                protocol: "consumer",
                slashes: "true",
                host: "",
                query: {
                    application: dubbo.getApplication().name,
                    category: "consumers",
                    check: "false",
                    dubbo: dubbo.getVersion(),
                    interface: "",
                    revision: "",
                    version: "",
                    side: "consumer",
                    timestamp: new Date().getTime()
                }
            };
            Object.keys(services)
                .filter(function (key) { return services.hasOwnProperty(key); })
                .forEach(function (key) {
                var service = services[key];
                urlObj.host = host + "/" + service.interfac;
                urlObj.query = Object.assign({}, urlObj.query, {
                    interface: service.interfac,
                    revision: service.version,
                    version: service.version,
                    group: service.group
                });
                paths.push("/" + dubbo.getRoot() + "/" + service.interfac + "/consumers/" + encodeURIComponent(url.format(urlObj)));
            });
            paths.forEach(function (path) {
                _this.createConsumersDir(path)
                    .then(function () {
                    client.exists(path, function (err, stat) {
                        if (err) {
                            console.error("Register consumer failed: ", err);
                        }
                        if (stat) {
                            console.log("Node exists");
                            return;
                        }
                        client.create(path, CREATE_MODES.EPHEMERAL, function (err, node) {
                            if (err) {
                                console.error("Register consumer failed: ", err);
                                return;
                            }
                            console.log("Node registered: ", node);
                        });
                    });
                })
                    .catch(function (err) {
                    console.error("Create consumter node failed: ", err);
                });
            });
        };
        this.createConsumersDir = function (path) {
            return new Promise(function (resolve, reject) {
                var cpath = Path.dirname(path);
                var client = _this.dubbo.getClient();
                client.exists(cpath, function (err, stat) {
                    if (err) {
                        return reject(err);
                    }
                    // 已经存在节点
                    if (stat) {
                        return resolve(true);
                    }
                    // 不存在则先创建consumers节点目录
                    client.create(cpath, CREATE_MODES.PERSISTENT, function (err, node) {
                        return err ? reject(err) : resolve(node);
                    });
                });
            });
        };
        this.dubbo = dubbo;
        this.init();
    }
    return Consumer;
}());
exports.default = Consumer;
