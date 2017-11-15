package com.alibaba.dubbo.demo.provider;

import com.alibaba.dubbo.demo.DemoReq;
import com.alibaba.dubbo.demo.DemoService;
import com.alibaba.dubbo.rpc.RpcContext;

import java.text.SimpleDateFormat;
import java.util.Date;

public class DemoServiceImpl implements DemoService {

    @Override
    public String sayHello(String name) {
        System.out.println("[" + new SimpleDateFormat("HH:mm:ss").format(new Date()) + "] Hello " + name
                + ", request from consumer: " + RpcContext.getContext().getRemoteAddress());
        return "[sayHello]Hello " + name + ", response form provider: " + RpcContext.getContext().getLocalAddress();
    }

    @Override
    public String sayHello2(DemoReq req) {
        return "[sayHello2]Hello " + req.name + ", your age is " + Integer.toString(req.age)
                + ", response form provider: " + RpcContext.getContext().getLocalAddress();
    }

    @Override
    public String sayHello3(String name, int age) {
        return "[sayHello3]Hello " + name + ", your age is " + Integer.toString(age) + ", response form provider: "
                + RpcContext.getContext().getLocalAddress();
    }
}