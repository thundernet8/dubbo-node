import * as os from "os";

export function isLoopbackAddr(addr: string) {
    return (
        /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/.test(addr) ||
        /^fe80::1$/.test(addr) ||
        /^::1$/.test(addr) ||
        /^::$/.test(addr)
    );
}

export function getIP() {
    const interfaces = os.networkInterfaces();
    return Object.keys(interfaces)
        .map(key => {
            const addrs = interfaces[key].filter(infos => {
                return (
                    infos.family.toLowerCase() === "ipv4" &&
                    !isLoopbackAddr(infos.address)
                );
            });
            return addrs.length ? addrs[0].address : "";
        })
        .filter(addr => !!addr)[0];
}
