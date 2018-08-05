import { resolve, dirname, extname } from 'path';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import gen from './genServices';
import * as mkdirp from 'mkdirp';
import * as yargs from 'yargs';

const version = require('../../package.json').version;

const argv = yargs
    .version(version)
    .alias('v', 'version')
    .alias('i', 'input')
    .alias('o', 'output')
    .alias('g', 'serviceGroup')
    .alias('r', 'serviceVerison')
    .alias('t', 'serviceTimeout')
    .alias('h', 'help')
    .usage('Usage: $0 <command> [options]')
    .example('$0 -i ./DemoService.java -o ./services -g dubbo -r LATEST -t 6000', '')
    .demandOption(['i'])
    .default('o', './services')
    .default('g', 'dubbo')
    .default('r', 'LATEST')
    .default('t', 6000)
    .describe('i', 'Input Java file(s) path(directory)')
    .describe('o', 'Ouput typescript file folder')
    .describe('g', 'Service group in zookeeper/dubbo')
    .describe('r', 'Service version/revision in zookeeper/dubbo')
    .describe('t', 'Service timeout in zookeeper/dubbo')
    .epilog('Copyright ' + new Date().getFullYear())
    .help().argv;

try {
    const outputFoloder = resolve(argv.o);
    mkdirp(outputFoloder);

    const files: string[] = [];
    if (extname(argv.i).toLowerCase() === '.java') {
        files.push(resolve(argv.i));
    } else {
        const inputFolder = dirname(resolve(argv.i + '/x.x'));
        readdirSync(inputFolder).forEach(f => {
            if (f.toLowerCase().endsWith('.java')) {
                files.push(resolve(inputFolder, f));
            }
        });
    }

    files.forEach(f => {
        const code = readFileSync(f).toString();
        console.log('\r\n');
        gen.genServices(code, argv.g, argv.r, argv.t).forEach(s => {
            const outputFile = resolve(outputFoloder, `${s.name}.ts`);
            console.log(outputFile);
            writeFileSync(outputFile, s.code);
        });
    });
    console.log('\r\n');

    const index = gen.genIndexFile();
    const indexOutputFile = resolve(outputFoloder, `${index.name}.ts`);
    console.log(indexOutputFile);
    writeFileSync(indexOutputFile, index.code);
    console.log('\r\n');
} catch (err) {
    throw err;
}
