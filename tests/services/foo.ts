import Dubbo from "../../src/Dubbo";

export const ServiceHead = {
    _interface: "com.alibaba.dubbo.demo.DemoService",
    version: "LATEST",
    timeout: 6000,
    group: "dubbo",
    methods: {
        sayHello: name => [{ $class: "java.lang.String", $: name }]
    }
};

export function sayHello(name: string) {
    return Dubbo.exec("DemoService.sayHello", name);
}

export default {
    sayHello
};
