package com.alibaba.dubbo.demo;

public interface DemoService {
    String sayHello(String name);

    String sayHello2(DemoReq req);
}