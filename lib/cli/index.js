"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var genServices_1 = require("./genServices");
var fs = require("fs");
var code = "package com.alibaba.dubbo.demo;\n\nimport com.alibaba.dubbo.demo.provider;\n\npublic interface DemoService {\n    String sayHello(String name);\n\n    String sayHello2(DemoReq req);\n}";
var ss = genServices_1.default(code);
console.log(ss);
ss.forEach(function (s) {
    fs.writeFileSync("./tests/cli/ts/" + s.name + ".ts", s.code);
});
