import genAst from "./genAst";
import prettierConfig from "./prettier-config";
import * as prettier from "prettier";

const NEW_LINE = "\r\n";
const NEW_LINE_2 = "\r\n\r\n";

const header = `/**${NEW_LINE} * Auto generated by Dubbo2Ts.${NEW_LINE} *${
    NEW_LINE
} * ${new Date().toString()}${NEW_LINE} */${NEW_LINE_2}`;

interface IServiceCode {
    name: string;
    code: string;
}

const mapType = (javaType: string) => {
    // 将java类型映射为ts类型
    switch (javaType) {
        case "java.lang.Integer":
        case "java.lang.Long":
        case "java.lang.Short":
        case "java.lang.Byte":
        case "java.lang.Float":
        case "java.lang.Double":
            return "number";
        case "java.lang.Boolean":
            return "boolean";
        case "java.lang.String":
            return "string";
        case "java.lang.Void":
            return "void";
        default:
            return "any"; // TODO 将自定义Java类装换为TS接口
    }
};

const genServices = (
    code: string,
    group: string = "dubbo",
    version: string = "LATEST",
    timeout: number = 6000
): IServiceCode[] => {
    const ast = genAst(code) as any;
    const pkg = ast.package.value;

    const serviceNames = Object.keys(ast.interface);
    const codes = serviceNames.map(key => {
        const serviceAst = ast.interface[key];
        return genService(pkg, key, serviceAst, group, version, timeout);
    });
    codes.push(genIndexFile(serviceNames));
    return codes;
};

const genService = (
    pkg,
    serviceName,
    serviceAst,
    group: string,
    version: string,
    timeout: number
): IServiceCode => {
    const serviceHeadHandler = () => {
        const heads: string[] = [];
        heads.push(`export const ServiceHead = {${NEW_LINE}`);
        heads.push(`interfac: "${pkg}.${serviceName}",${NEW_LINE}`);
        heads.push(`version: "${version}",${NEW_LINE}`);
        heads.push(`timeout: ${timeout.toString()},${NEW_LINE}`);
        heads.push(`group: "${group}",${NEW_LINE}`);
        heads.push(`methods: {${NEW_LINE}`);

        const functions = serviceAst.functions;
        Object.keys(functions).forEach(key => {
            const func = functions[key];
            const args = func.args;
            const argsSignature = args.map(arg => {
                return `{$class: "${arg.type}", $: ${arg.name}}`;
            });
            heads.push(`${key}: (${args.map(arg => arg.name).join(",")}) => [
                ${argsSignature}
            ],`);
        });

        heads.push(`}${NEW_LINE}`);
        heads.push(`};${NEW_LINE_2}`);

        return heads.join("") + NEW_LINE_2;
    };

    const methodHandler = (name, func) => {
        const methodCode: string[] = [];
        const { args } = func;
        const argNames = args.map(arg => arg.name);
        methodCode.push(
            `export function ${name}(${args
                .map(arg => arg.name + ": " + mapType(arg.type))
                .join(",")}) {${NEW_LINE}`
        );

        methodCode.push(
            `return Dubbo.exec<${mapType(func.type)}>("${serviceName}.${
                name
            }", ${argNames.join(",")})`
        );

        methodCode.push(`}${NEW_LINE_2}`);
        return methodCode.join("");
    };

    let code: string[] = [];
    code.push(header);

    code.push(`import Dubbo from "dubbo-node-zookeeper";${NEW_LINE_2}`);

    code.push(serviceHeadHandler());

    const functionNames = Object.keys(serviceAst.functions);
    functionNames.forEach(key => {
        code.push(methodHandler(key, serviceAst.functions[key]));
    });

    code.push(`export default {${NEW_LINE}${functionNames.join(",")}};`);

    return {
        name: serviceName,
        code: prettier.format(code.join(""), prettierConfig)
    };
};

const genIndexFile = (serviceNames: string[]) => {
    let code: string[] = [];
    code.push(header);
    serviceNames.forEach(name => {
        code.push(
            `import {ServiceHead as ${name}} from "./${name}";${NEW_LINE}`
        );
    });

    code.push(
        `${NEW_LINE_2}export default {${NEW_LINE}${serviceNames.join(",")}${
            NEW_LINE
        }};`
    );

    return {
        name: "index",
        code: prettier.format(code.join(""), prettierConfig)
    };
};

export default genServices;
