interface IServiceInfo {
    _interface: string;
    version: string;
    timeout: number;
    group: string;
    methods: { [method: string]: any };
}

export default IServiceInfo;
