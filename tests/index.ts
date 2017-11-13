import Dubbo from "../src/Dubbo";
import services from "./services";
import { sayHello } from "./services/foo";

new Dubbo({
    application: { name: "demo-provider" },
    register: "127.0.0.1:2181",
    dubboVer: "2.5.7",
    root: "dubbo",
    services
});

setInterval(function() {
    sayHello("jack")
        .then(data => console.log(data))
        .catch(err => console.log(err));
}, 5000);
