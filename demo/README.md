## 生成 Services

```
dubbo2ts -i ../dubbo-demo/dubbo-demo-provider/src/main/java/com/alibaba/dubbo/demo/DemoService.java -o services
```

## 启动 Zookeeper

参
考[Dubbo Zookeeper Registry](https://dubbo.gitbooks.io/dubbo-admin-book/content/install/zookeeper.html)

或者直接进入`zookeeper-3.3.6`目录，执行`./bin/zkServer.sh start`

注意 : 需要编辑`conf/zoo.cfg`的`dataDir`作为数据目录

## 启动 Java Provider

可使用 IntelliJ IDEA 加载 dubbo-demo 目录为 Java 工程，`Provider`启动入口
为`dubbo-demo/dubbo-demo-provider/src/main/java/com.alibaba.dubbo.demo/provider/Provider`

## 启动 Node Consumer

```
cd node-consumer
yarn
yarn build
yarn start
```
