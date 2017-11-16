"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WrappedSocket_1 = require("./WrappedSocket");
var Utils_1 = require("./Utils");
var schedule = require("node-schedule");
var ResourceRequest = /** @class */ (function() {
    function ResourceRequest(timeout, cb) {
        var _this = this;
        this.expired = false;
        this.resolved = false;
        this.cb = cb;
        var startTime = new Date(Date.now() + timeout);
        var endTime = new Date(startTime.getTime() + 1000);
        schedule.scheduleJob(
            { start: startTime, end: endTime, rule: "*/1 * * * *" },
            function() {
                _this.expired = true;
                if (!_this.resolved) {
                    Utils_1.TimeLogger(
                        "Acquire socket connection failed as waiting for more than %s milliseconds",
                        timeout
                    );
                    _this.cb(new Error("Request socket connection failed"));
                }
            }
        );
    }
    ResourceRequest.prototype.isExpired = function() {
        return this.expired;
    };
    ResourceRequest.prototype.resolve = function(resource) {
        this.resolved = true;
        resource.toggleIdle(false);
        this.cb(null, resource);
    };
    return ResourceRequest;
})();
var SocketPool = /** @class */ (function() {
    function SocketPool(options) {
        this.resources = [];
        this.resourceRequestList = [];
        var host = options.host,
            port = options.port,
            maxActive = options.maxActive,
            maxIdle = options.maxIdle,
            maxIdleTime = options.maxIdleTime,
            maxWait = options.maxWait;
        this.host = host;
        this.port = port;
        this.maxIdle = maxIdle || 5;
        this.maxIdleTime = maxIdleTime || 5 * 60000; // 最长5min空闲连接
        this.maxActive = Math.max(maxActive || 10, this.maxIdle);
        this.maxWait = maxWait || 3000;
        this.createResources(maxIdle);
    }
    SocketPool.prototype.createResources = function(count) {
        var _this = this;
        if (count === void 0) {
            count = 1;
        }
        var _a = this,
            maxActive = _a.maxActive,
            maxIdleTime = _a.maxIdleTime,
            host = _a.host,
            port = _a.port;
        var currentCount = this.getResourceCount();
        if (count + currentCount > maxActive) {
            count = Math.max(maxActive - currentCount, 0);
        }
        var _loop_1 = function(i) {
            Utils_1.TimeLogger("Creating socket connection");
            var client = new WrappedSocket_1.default(
                host,
                port,
                maxIdleTime,
                this_1.returnResource.bind(this_1)
            );
            this_1.resources.push(client);
            client.on("connect", function() {
                Utils_1.TimeLogger(
                    "Socket server connectted, remote address is: %s:%s",
                    host,
                    port
                );
                _this.notifyResourceAvailable(client);
            });
            client.on("timeout", function() {
                Utils_1.TimeLogger(
                    "Socket connection resource return back to idle pool as no data sending for a time up to timeout"
                );
                _this.notifyResourceAvailable(client);
            });
            client.on("close", function() {
                Utils_1.TimeLogger("Socket server closed");
            });
            client.on("error", function(err) {
                Utils_1.TimeLogger("Socket error:", err);
                _this.removeResource(client.getId());
            });
        };
        var this_1 = this;
        for (var i = 0; i < count; i++) {
            _loop_1(i);
        }
    };
    SocketPool.prototype.removeResource = function(id) {
        console.log("remove resource");
        var resources = this.resources;
        var newResources = resources.filter(function(res) {
            return res.getId() !== id;
        });
        this.resources = newResources;
    };
    SocketPool.prototype.notifyResourceAvailable = function(res) {
        var _a = this,
            resourceRequestList = _a.resourceRequestList,
            resources = _a.resources,
            maxIdle = _a.maxIdle;
        res.toggleIdle(true);
        if (resourceRequestList.length > 0) {
            var req = resourceRequestList.shift();
            req.resolve(res);
        } else {
            // 如果超过最大闲置数量，释放
            if (resources.length > maxIdle) {
                Utils_1.TimeLogger("Close redundant connection resource");
                this.removeResource(res.getId());
                res.destroy();
            }
        }
    };
    SocketPool.prototype.getResource = function() {
        console.log("-----------1. get resource");
        console.log(
            "-------------2. total resources, %s",
            this.resources.length
        );
        var _this = this;
        var _a = this,
            resources = _a.resources,
            maxWait = _a.maxWait;
        var idleResources = resources.filter(function(res) {
            return res.isIdle() && !res.destroyed && !res.connecting;
        });
        resources.forEach(x => {
            console.log(
                "idle: %s, destroyed: %s, connecting: %s",
                x.isIdle(),
                x.destroyed,
                x.connecting
            );
        });
        console.log(idleResources.map(x => x.isIdle()));
        return new Promise(function(resolve, reject) {
            if (idleResources.length > 0) {
                for (var i = 0; i < idleResources.length; i++) {
                    var res = idleResources[i];
                    if (res.isIdle()) {
                        res.toggleIdle(false);
                        return resolve(res);
                    }
                }
            } else {
                if (resources.length < _this.maxActive) {
                    _this.createResources();
                }
                _this.resourceRequestList.push(
                    new ResourceRequest(maxWait, function(err, resource) {
                        if (err || !resource) {
                            return reject(err);
                        } else {
                            return resolve(resource);
                        }
                    })
                );
            }
        });
    };
    SocketPool.prototype.getResourceCount = function() {
        var resources = this.resources;
        var validResources = resources.filter(function(res) {
            return !res.destroyed;
        });
        this.resources = validResources;
        console.log("getResourceCount %s", validResources.length);
        return validResources.length;
    };
    SocketPool.prototype.returnResource = function(res) {
        console.log("returnResource");
        if (!res.destroyed) {
            console.log(this.resources.length);
            console.log("client destroyed?: %s", res.destroyed);
            //res.end();
            res.emit("close");
            console.log("client destroyed?: %s", res.destroyed);
            res.toggleIdle(true);
            console.log(this.resources.map(x => x.isIdle()));
        } else {
            console.log("remove resource");
            this.removeResource(res.getId());
        }
    };
    return SocketPool;
})();
exports.default = SocketPool;
