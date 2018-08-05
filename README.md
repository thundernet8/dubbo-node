## dubbo-node-zookeeper

[![Build Status](https://travis-ci.org/thundernet8/dubbo-node.svg?branch=master)](https://travis-ci.org/thundernet8/dubbo-node)

NodeJS 与 dubbo RPC 通信 , zookeeper 协同，提供了 CLI 从 Java Interface 一键生成 services 并引用。

内部使用了 Socket 连接池重用连接，以提高性能。

## Install

```javascript
npm install dubbo-node-zookeeper -g
```

或

```javascript
yarn global add dubbo-node-zookeeper
```

## Usage

### CLI 生成 services

从 java 文件生成

```typescript
dubbo2ts -i DemoService.java -o services -g dubbo -r LATEST -t 6000
```

或者从包含 java 文件的文件夹生成

```typescript
dubbo2ts -i src -o services -g dubbo -r LATEST -t 6000
```

use `dubbo2ts -h` for more details.

生成示例 - DemoService.ts(CLI generated)

```typescript
import Dubbo from 'dubbo-node-zookeeper';

export const ServiceHead = {
    interfac: 'com.alibaba.dubbo.demo.DemoService',
    version: 'LATEST',
    timeout: 6000,
    group: 'dubbo',
    methods: {
        sayHello: name => [{ $class: 'java.lang.String', $: name }],
        sayHello2: req => [{ $class: 'com.alibaba.dubbo.demo.DemoReq', $: req }]
    }
};

export function sayHello(name: string) {
    return Dubbo.exec<string>('DemoService.sayHello', name);
}

export function sayHello2(req: any) {
    return Dubbo.exec<string>('DemoService.sayHello2', req);
}

export default {
    sayHello,
    sayHello2
};
```

生成示例 - index.ts( 引入所有的 Services)(CLI generated)

```typescript
import { ServiceHead as DemoService } from './DemoService';

export default {
    DemoService
};
```

### 使用 services

```typescript
import Dubbo from 'dubbo-node-zookeeper';
import services from './services';
import { sayHello } from './services/DemoService';
import express from 'express';

new Dubbo({
    application: { name: 'demo-provider' },
    register: '127.0.0.1:2181',
    dubboVer: '2.5.7',
    root: 'dubbo',
    services
});

setInterval(function() {
    sayHello('Jack')
        .then(data => console.log(data))
        .catch(err => console.log(err));
}, 5000);

//或者中转http请求至RPC
const app = express();
app.get('/hello', (req, res) => {
    sayHello('Jack')
        .then(data => res.send(data))
        .catch(err => res.send(err));
});
```

## Demo

查看[Demo](./demo)工程

## License

Dubbo-node-zookeeper is freely distributable under the terms of the
[MIT license](https://github.com/thundernet8/dubbo-node/blob/master/LICENSE).

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fthundernet8%2Fdubbo-node.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fthundernet8%2Fdubbo-node?ref=badge_large)
