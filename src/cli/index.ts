import gen from "./genServices";
import * as fs from "fs";

const code = `package com.alibaba.dubbo.demo;

import com.alibaba.dubbo.demo.provider;

public interface DemoService {
    String sayHello(String name);

    String sayHello2(DemoReq req);
}`;

var ss = gen(code);
console.log(ss);
ss.forEach(s => {
    fs.writeFileSync(`./tests/cli/ts/${s.name}.ts`, s.code);
});
