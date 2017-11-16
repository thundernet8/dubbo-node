"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zookeeper = require("node-zookeeper-client");
var Service_1 = require("./Service");
var Consumer_1 = require("./Consumer");
var PoolManager_1 = require("./PoolManager");
var SERVICE_LENGTH = 0;
var COUNT = 0;
var Dubbo = /** @class */ (function () {
    function Dubbo(options) {
        var _this = this;
        this.timeout = 6000;
        this.root = "dubbo";
        this.services = {};
        this.serviceImpls = {};
        this.getServiceImpl = function (service) {
            return _this.serviceImpls[service];
        };
        this.getClient = function () {
            return _this.client;
        };
        this.getServices = function () {
            return _this.services;
        };
        this.getApplication = function () {
            return _this.application;
        };
        this.getVersion = function () {
            return _this.dubboVer;
        };
        this.applyServices = function () {
            for (var key in _this.services) {
                _this.serviceImpls[key] = new Service_1.default(_this.client, _this.poolManager, _this.dubboVer, _this.services[key], _this);
                if (++COUNT === SERVICE_LENGTH) {
                    console.log("\x1b[32m%s\x1b[0m", "[" + _this.application.name + "]Dubbo service init done");
                }
            }
        };
        this.consumer = function () {
            return new Consumer_1.default(_this);
        };
        Dubbo.instance = this;
        SERVICE_LENGTH = Object.keys(options.services).length;
        this.application = options.application;
        this.group = options.group;
        this.timeout = options.timeout || this.timeout;
        this.root = options.root || this.root;
        this.dubboVer = options.dubboVer;
        this.services = options.services;
        this.poolManager = new PoolManager_1.default({
            maxActive: Math.max(SERVICE_LENGTH * 2, 10),
            maxIdle: Math.max(SERVICE_LENGTH, 2),
            maxIdleTime: 60000,
            maxWait: 20000
        });
        this.client = zookeeper.createClient(options.register, {
            sessionTimeout: 3000,
            spinDelay: 1000,
            retries: 5
        });
        this.client.connect();
        this.client.once("connected", function () {
            _this.applyServices();
            _this.consumer();
        });
    }
    Dubbo.prototype.getGroup = function () {
        return this.group;
    };
    Dubbo.prototype.getRoot = function () {
        return this.root;
    };
    Dubbo.prototype.getTimeout = function () {
        return this.timeout;
    };
    Dubbo.exec = function (serviceNMethod) {
        var payload = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            payload[_i - 1] = arguments[_i];
        }
        if (!Dubbo.instance) {
            throw new Error("Dubbo is not initialized");
        }
        var dubbo = Dubbo.instance;
        var servicePieces = serviceNMethod.split(".");
        var service = servicePieces[0];
        var method = servicePieces[1];
        var serviceImpl = dubbo.getServiceImpl(service);
        return serviceImpl.getExecutor(method).apply(void 0, payload);
    };
    return Dubbo;
}());
exports.default = Dubbo;
