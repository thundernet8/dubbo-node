import Dubbo from "dubbo-node-zookeeper";
import services from "./services";
import { sayHello2 } from "./services/DemoService";

new Dubbo({
  application: { name: "demo-provider" },
  register: "127.0.0.1:2181",
  dubboVer: "2.5.7",
  root: "dubbo",
  services
});

setInterval(function() {
  sayHello2({ name: "jack", age: 10 })
    .then(data => console.log(data))
    .catch(err => console.log(err));
}, 5000);
