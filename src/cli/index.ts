import { resolve, dirname, extname } from "path";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import genServices from "./genServices";
import * as mkdirp from "mkdirp";
import * as yargs from "yargs";

const version = require("../../package.json").version;

const argv = yargs
    .version(version)
    .alias("v", "version")
    .alias("i", "input")
    .alias("o", "output")
    .alias("sg", "serviceGroup")
    .alias("sv", "serviceVer")
    .alias("st", "serviceTimeout")
    .alias("h", "help")
    .usage("Usage: $0 <command> [options]")
    .example(
        "$0 -i ./DemoService.java -o ./services -sg dubbo -sv LATEST -st 6000",
        ""
    )
    .demandOption(["i"])
    .default("o", "./services")
    .default("sg", "dubbo")
    .default("sv", "LATEST")
    .default("st", 6000)
    .describe("i", "Input Java file(s) path(directory)")
    .describe("o", "Ouput typescript file folder")
    .describe("sg", "Service group in zookeeper/dubbo")
    .describe("sv", "Service version in zookeeper/dubbo")
    .describe("st", "Service timeout in zookeeper/dubbo")
    .epilog("Copyright " + new Date().getFullYear())
    .help().argv;

try {
    const outputFoloder = resolve(argv.o);
    mkdirp(outputFoloder);

    const files: string[] = [];
    if (extname(argv.i).toLowerCase() === ".java") {
        files.push(resolve(argv.i));
    } else {
        const inputFolder = dirname(resolve(argv.i + "/x.x"));
        readdirSync(inputFolder).forEach(f => {
            if (f.toLowerCase().endsWith(".java")) {
                files.push(resolve(inputFolder, f));
            }
        });
    }

    files.forEach(f => {
        const code = readFileSync(f).toString();
        console.log("\r\n");
        genServices(code).forEach(s => {
            const outputFile = resolve(outputFoloder, `${s.name}.ts`);
            console.log(outputFile);
            writeFileSync(outputFile, s.code);
        });
    });
    console.log("\r\n");
} catch (err) {
    throw err;
}
