"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_socket_pool_1 = require("node-socket-pool");
var PoolManager = /** @class */ (function () {
    function PoolManager(options) {
        var _this = this;
        this.pools = {};
        this.createPool = function (url) {
            if (!_this.pools[url]) {
                var urlPieces = url.split(":");
                var _a = _this, maxActive = _a.maxActive, maxIdle = _a.maxIdle, maxIdleTime = _a.maxIdleTime, maxWait = _a.maxWait;
                _this.pools[url] = new node_socket_pool_1.default({
                    host: urlPieces[0],
                    port: Number(urlPieces[1]),
                    maxActive: maxActive,
                    maxIdle: maxIdle,
                    maxIdleTime: maxIdleTime,
                    maxWait: maxWait
                });
            }
        };
        this.getPool = function (url) {
            if (!_this.pools[url]) {
                _this.createPool(url);
            }
            return _this.pools[url];
        };
        var maxActive = options.maxActive, maxIdle = options.maxIdle, maxIdleTime = options.maxIdleTime, maxWait = options.maxWait;
        this.maxActive = maxActive;
        this.maxIdle = maxIdle;
        this.maxIdleTime = maxIdleTime;
        this.maxWait = maxWait;
    }
    return PoolManager;
}());
exports.default = PoolManager;
