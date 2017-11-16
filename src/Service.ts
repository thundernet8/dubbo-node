import IServiceInfo from "./IServiceInfo";
import Dubbo from "./Dubbo";
import * as qs from "querystring";
import * as url from "url";
import Java from "js-to-java";
import Decode from "./protocol/Decode";
import Encode, { IEncodeOption } from "./protocol/Encode";
import PoolManager from "./PoolManager";

export default class ServiceImpl {
    private zookeeper: any;
    private version: string;
    private dubboVer: string;
    private group: string;
    private interfac: string;
    private methods: { [method: string]: any };
    private root: string;

    private hosts: string[] = [];

    private executors: { [method: string]: any } = {};

    private encodeParam: IEncodeOption;

    private poolManager: PoolManager;

    public constructor(
        zookeeperClient: any,
        poolManager: PoolManager,
        dubboVer: string,
        serviceInfo: IServiceInfo,
        dubbo: Dubbo
    ) {
        this.zookeeper = zookeeperClient;
        this.poolManager = poolManager;
        this.version = serviceInfo.version;
        this.dubboVer = dubboVer;
        this.group = serviceInfo.group || (dubbo.getGroup() as string);
        this.interfac = serviceInfo.interfac;
        this.methods = Object.assign({}, serviceInfo.methods);
        this.root = dubbo.getRoot();

        this.encodeParam = {
            dubboVer: this.dubboVer || "2.5.3.6",
            interfac: this.interfac,
            version: this.version,
            group: this.group || dubbo.getGroup(),
            timeout: serviceInfo.timeout || dubbo.getTimeout()
        } as IEncodeOption;

        this.find(serviceInfo.interfac);
    }

    private find = (path: string, cb?) => {
        this.hosts = [];
        this.zookeeper.getChildren(
            `/${this.root}/${path}/providers`,
            this.find.bind(path),
            (err, children) => {
                let zoo;
                if (err) {
                    if (err.code === -4) {
                        console.log(err);
                    }
                    return;
                }
                if (children && !children.length) {
                    console.log(
                        `Service ${path} on group ${this.group} cannot be found`
                    );
                    return;
                }

                for (let i = 0, l = children.length; i < l; i++) {
                    zoo = qs.parse(decodeURIComponent(children[i]));
                    if (
                        zoo.version === this.version &&
                        zoo.group === this.group
                    ) {
                        const host = url.parse(Object.keys(zoo)[0])
                            .host as string;
                        this.poolManager.createPool(host);
                        this.hosts.push(host);
                        const methods = zoo.methods.split(",");
                        for (let j = 0, k = methods.length; j < k; j++) {
                            this.executors[methods[j]] = (method => {
                                const self = this;
                                return function() {
                                    let args = Array.from(arguments);
                                    if (args.length && self.methods[method]) {
                                        args = self.methods[method].apply(
                                            self,
                                            args
                                        );
                                        if (typeof args === "function") {
                                            args = args(Java);
                                        }
                                    }
                                    return self.execute(method, args);
                                };
                            })(methods[j]);
                        }
                    }
                }

                if (this.hosts.length === 0) {
                    console.log(
                        `Service ${path} on group ${this.group} cannot be found`
                    );
                    return;
                }

                if (typeof cb === "function") {
                    return cb();
                }
            }
        );
    };

    private execute = (method: string, args) => {
        this.encodeParam.method = method;
        this.encodeParam.args = args;
        const buffer = new Encode(this.encodeParam).getBuffer();

        return new Promise(async (resolve, reject) => {
            let client;
            const untriedHosts: string[] = [].concat(this.hosts as any);
            const tryOnce = async () => {
                const host = untriedHosts.splice(
                    (Math.random() * this.hosts.length) | 0,
                    1
                )[0];
                const pool = this.poolManager.getPool(host);

                try {
                    client = await pool.getResource();
                } catch (err) {
                    return reject(err);
                }
            };

            await tryOnce();

            const chunks: any[] = [];
            let heap;
            let bufferLength = 16;
            client.write(buffer);
            client.on("error", async err => {
                if (untriedHosts.length < 1) {
                    return reject(err);
                }
                await tryOnce();
                client.write(buffer);
            });

            client.on("data", chunk => {
                if (chunks.length < 1) {
                    let arr = Array.prototype.slice.call(chunk.slice(0, 16));
                    let i = 0;
                    while (i < 3) {
                        bufferLength += arr.pop() * Math.pow(256, i++);
                    }
                }

                chunks.push(chunk);
                heap = Buffer.concat(chunks);
                if (heap.length >= bufferLength) {
                    client.release();
                    Decode(heap, (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(result);
                    });
                }
            });
        });
    };

    public getExecutor = (method: string) => {
        return this.executors[method];
    };

    // 获取hosts用于初始化必要的socket connection pool
    public getHosts = () => {
        return this.hosts;
    };
}
