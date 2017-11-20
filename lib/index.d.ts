export as namespace Dubbo;

export = Dubbo;

declare class Dubbo {
    constructor(options: internal.IDubboOptions);

    static exec<T>(serviceNMethod: string, ...payload: any[]): Promise<T>;
}

declare namespace internal {
    export interface IDubboOptions {
        register: string;
        application: { name: string };
        timeout?: number;
        root?: string;
        group?: string;
        services: { [service: string]: IServiceInfo };
        dubboVer: string;
    }

    export interface IServiceInfo {
        interfac: string;
        version: string;
        timeout: number;
        group: string;
        methods: { [method: string]: any };
    }
}
