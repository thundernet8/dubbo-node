"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dubbo_node_zookeeper_1 = require("dubbo-node-zookeeper");
var services_1 = require("./services");
var DemoService_1 = require("./services/DemoService");
new dubbo_node_zookeeper_1.default({
    application: { name: "demo-provider" },
    register: "127.0.0.1:2181",
    dubboVer: "2.5.7",
    root: "dubbo",
    services: services_1.default
});
setInterval(function () {
    DemoService_1.sayHello2({ name: "jack", age: 10 })
        .then(function (data) { return console.log(data); })
        .catch(function (err) { return console.log(err); });
}, 5000);
