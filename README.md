## dubbo-node-zookeeper

NodeJS与dubbo RPC通信, zookeeper协同，提供了CLI从Java Interface一键生成services并引用。

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
dubbo2ts -i DemoService.java -o services -sg dubbo -sv LATEST -st 6000
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

## Alternatives
[node-zookeeper-dubbo](https://www.npmjs.com/package/node-zookeeper-dubbo)