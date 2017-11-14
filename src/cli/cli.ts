import { resolve, dirname, basename, extname } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import genServices from "./genServices";
import * as mkdirp from "mkdirp";
import * as yargs from "yargs";

const argv = yargs
    .version(function() {
        return require("../package.json").version;
    })
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
