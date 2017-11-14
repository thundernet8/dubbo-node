"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Dubbo_1 = require("../../lib/Dubbo");
exports.ServiceHead = {
    interfac: "com.alibaba.dubbo.demo.DemoService",
    version: "LATEST",
    timeout: 6000,
    group: "dubbo",
    methods: {
        sayHello: function(name) {
            return [{ $class: "java.lang.String", $: name }];
        }
    }
};
function sayHello(name) {
    return Dubbo_1.default.exec("DemoService.sayHello", name);
}
exports.sayHello = sayHello;
exports.default = {
    sayHello: sayHello
};
