"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Dubbo_1 = require("../src/Dubbo");
var services_1 = require("./services");
var foo_1 = require("./services/foo");
new Dubbo_1.default({
    application: { name: "demo-provider" },
    register: "127.0.0.1:2181",
    dubboVer: "2.5.7",
    root: "dubbo",
    services: services_1.default
});
setInterval(function () {
    foo_1.sayHello("jack")
        .then(function (data) { return console.log(data); })
        .catch(function (err) { return console.log(err); });
}, 5000);
