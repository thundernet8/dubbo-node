import * as zookeeper from "node-zookeeper-client";
import ServiceImpl from "./Service";
import IServiceInfo from "./IServiceInfo";
import Consumer from "./Consumer";

let SERVICE_LENGTH = 0;
let COUNT = 0;

interface IDubboOptions {
    register: string;
    application: { name: string };
    timeout?: number;
    root?: string;
    group?: string;
    services: { [service: string]: IServiceInfo };
    dubboVer: string;
}

export default class Dubbo {
    private static instance: Dubbo;

    private dubboVer: string;
    private application: { name: string };
    private group?: string;
    private timeout: number = 6000;
    private root: string = "dubbo";
    private services: { [service: string]: IServiceInfo } = {};
    private serviceImpls: { [service: string]: ServiceImpl } = {};

    private client: any;

    public constructor(options: IDubboOptions) {
        Dubbo.instance = this;

        SERVICE_LENGTH = Object.keys(options.services).length;

        this.application = options.application;
        this.group = options.group;
        this.timeout = options.timeout || this.timeout;
        this.root = options.root || this.root;
        this.dubboVer = options.dubboVer;

        this.services = options.services;

        this.client = zookeeper.createClient(options.register, {
            sessionTimeout: 3000,
            spinDelay: 1000,
            retries: 5
        });

        this.client.connect();
        this.client.once("connected", () => {
            this.applyServices();
            this.consumer();
        });
    }

    public getGroup() {
        return this.group;
    }

    public getRoot() {
        return this.root;
    }

    public getTimeout() {
        return this.timeout;
    }

    public getServiceImpl = (service: string) => {
        return this.serviceImpls[service];
    };

    public getClient = () => {
        return this.client;
    };

    public getServices = () => {
        return this.services;
    };

    public getApplication = () => {
        return this.application;
    };

    public getVersion = () => {
        return this.dubboVer;
    };

    private applyServices = () => {
        for (let key in this.services) {
            this.serviceImpls[key] = new ServiceImpl(
                this.client,
                this.dubboVer,
                this.services[key],
                this
            );
            if (++COUNT === SERVICE_LENGTH) {
                console.log(
                    "\x1b[32m%s\x1b[0m",
                    `[${this.application.name}]Dubbo service init done`
                );
            }
        }
    };

    private consumer = () => {
        return new Consumer(this);
    };

    public static exec = function<T>(
        serviceNMethod: string,
        payload: any
    ): Promise<T> {
        if (!Dubbo.instance) {
            throw new Error("Dubbo is not initialized");
        }

        const dubbo = Dubbo.instance;
        const servicePieces = serviceNMethod.split(".");
        const service = servicePieces[0];
        const method = servicePieces[1];
        const serviceImpl = dubbo.getServiceImpl(service);
        return serviceImpl.getExecutor(method)(payload);
    };
}
