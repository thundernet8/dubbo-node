import SocketPool from "node-socket-pool";

export interface PoolManagerOptions {
    // 最多维持连接数
    maxActive?: number;
    // 最多保留空闲连接数
    maxIdle?: number;
    // Socket连接最长空闲时间(毫秒)(超过时间后将返回资源池)
    maxIdleTime?: number;
    // pool中没有资源返回时，最大等待时间(毫秒)
    maxWait?: number;
}

export default class PoolManager {
    private pools: { [url: string]: SocketPool } = {};
    private maxActive?: number;
    private maxIdle?: number;
    private maxIdleTime?: number;
    private maxWait?: number;

    public constructor(options: PoolManagerOptions) {
        const { maxActive, maxIdle, maxIdleTime, maxWait } = options;
        this.maxActive = maxActive;
        this.maxIdle = maxIdle;
        this.maxIdleTime = maxIdleTime;
        this.maxWait = maxWait;
    }

    public createPool = (url: string) => {
        if (!this.pools[url]) {
            const urlPieces = url.split(":");
            const { maxActive, maxIdle, maxIdleTime, maxWait } = this;
            this.pools[url] = new SocketPool({
                host: urlPieces[0],
                port: Number(urlPieces[1]),
                maxActive,
                maxIdle,
                maxIdleTime,
                maxWait
            });
        }
    };

    public getPool = (url: string) => {
        if (!this.pools[url]) {
            this.createPool(url);
        }
        return this.pools[url];
    };
}
