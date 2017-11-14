import Dubbo from "./Dubbo";
import * as Path from "path";
import * as url from "url";
import { getIP } from "./utils/ip";

enum CREATE_MODES {
    /**
   * The znode will not be automatically deleted upon client's disconnect.
   */
    PERSISTENT,

    /**
     * The znode will be deleted upon the client's disconnect.
     */
    EPHEMERAL,
    /**
     * The znode will not be automatically deleted upon client's disconnect,
     * and its name will be appended with a monotonically increasing number.
     */
    PERSISTENT_SEQUENTIAL,

    /**
     * The znode will be deleted upon the client's disconnect, and its name
     * will be appended with a monotonically increasing number.
     */
    EPHEMERAL_SEQUENTIAL
}

export default class Consumer {
    private dubbo: Dubbo;

    public constructor(dubbo: Dubbo) {
        this.dubbo = dubbo;
        this.init();
    }

    private init = () => {
        const dubbo = this.dubbo;
        const client = dubbo.getClient();

        const paths: string[] = [];
        const host = getIP();
        const services = this.dubbo.getServices();

        const urlObj = {
            protocol: "consumer",
            slashes: "true",
            host: "",
            query: {
                application: dubbo.getApplication().name,
                category: "consumers",
                check: "false",
                dubbo: dubbo.getVersion(),
                interface: "",
                revision: "",
                version: "",
                side: "consumer",
                timestamp: new Date().getTime()
            }
        };

        Object.keys(services)
            .filter(key => services.hasOwnProperty(key))
            .forEach(key => {
                const service = services[key];

                urlObj.host = `${host}/${service.interfac}`;
                urlObj.query = Object.assign({}, urlObj.query, {
                    interface: service.interfac,
                    revision: service.version,
                    version: service.version,
                    group: service.group
                });

                paths.push(
                    `/${dubbo.getRoot()}/${service.interfac}/consumers/${encodeURIComponent(
                        url.format(urlObj as any)
                    )}`
                );
            });

        paths.forEach(path => {
            this.createConsumersDir(path)
                .then(() => {
                    client.exists(path, (err, stat) => {
                        if (err) {
                            console.error("Register consumer failed: ", err);
                        }

                        if (stat) {
                            console.log("Node exists");
                            return;
                        }

                        client.create(
                            path,
                            CREATE_MODES.EPHEMERAL,
                            (err, node) => {
                                if (err) {
                                    console.error(
                                        "Register consumer failed: ",
                                        err
                                    );
                                    return;
                                }

                                console.log("Node registered: ", node);
                            }
                        );
                    });
                })
                .catch(err => {
                    console.error("Create consumter node failed: ", err);
                });
        });
    };

    private createConsumersDir = path => {
        return new Promise((resolve, reject) => {
            let cpath = Path.dirname(path);
            let client = this.dubbo.getClient();
            client.exists(cpath, (err, stat) => {
                if (err) {
                    return reject(err);
                }

                // 已经存在节点
                if (stat) {
                    return resolve(true);
                }

                // 不存在则先创建consumers节点目录
                client.create(cpath, CREATE_MODES.PERSISTENT, (err, node) => {
                    return err ? reject(err) : resolve(node);
                });
            });
        });
    };
}
