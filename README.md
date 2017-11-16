## dubbo-node-zookeeper
[![Build Status](https://travis-ci.org/thundernet8/dubbo-node.svg?branch=master)](https://travis-ci.org/thundernet8/dubbo-node)

NodeJS与dubbo RPC通信, zookeeper协同，提供了CLI从Java Interface一键生成services并引用。

内部使用了Socket连接池重用连接，以提高性能。

## Install

```
npm install dubbo-node-zookeeper -g
```
或
```
yarn global add dubbo-node-zookeeper
```

## Usage

### CLI生成services
```
dubbo2ts -i DemoService.java -o services -g dubbo -r LATEST -t 6000
```

use `dubbo2ts -h` for more details.

生成示例 - DemoService.ts(CLI generated)
```
import Dubbo from "dubbo-node-zookeeper";

export const ServiceHead = {
    interfac: "com.alibaba.dubbo.demo.DemoService",
    version: "LATEST",
    timeout: 6000,
    group: "dubbo",
    methods: {
        sayHello: name => [{ $class: "java.lang.String", $: name }],
        sayHello2: req => [{ $class: "com.alibaba.dubbo.demo.DemoReq", $: req }]
    }
};

export function sayHello(name: string) {
    return Dubbo.exec<string>("DemoService.sayHello", name);
}

export function sayHello2(req: any) {
    return Dubbo.exec<string>("DemoService.sayHello2", req);
}

export default {
    sayHello,
    sayHello2
};
```

生成示例 - index.ts(引入所有的Services)(CLI generated)
```
import { ServiceHead as DemoService } from "./DemoService";

export default {
    DemoService
};
```


### 使用services
```
import Dubbo from "dubbo-node-zookeeper";
import services from "./services";
import { sayHello } from "./services/DemoService";
import express from "express";

new Dubbo({
    application: { name: "demo-provider" },
    register: "127.0.0.1:2181",
    dubboVer: "2.5.7",
    root: "dubbo",
    services
});

setInterval(function() {
    sayHello("Jack")
        .then(data => console.log(data))
        .catch(err => console.log(err));
}, 5000);

//或者中转http请求至RPC
const app = express();
app.get("/hello", (req, res) => {
    sayHello("Jack")
    .then(data => res.send(data))
    .catch(err => res.send(err))
})
```

## Demo
查看[Demo](./demo)工程
