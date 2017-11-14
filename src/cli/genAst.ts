import { JavaInterfaceSyntaxError } from "./error";

interface ISubjectBlock {
    subject: string;
    type: IDataType;
    name: string;
    value?: any;
    headComment?: string;
    tailComment?: string;
}

interface IListSubjectItem {
    name: string;
    type: string | IDataType;
    value?: any;
    option?: string;
    headComment?: string;
    tailComment?: string;
}

// Java Interface
interface IInterfaceSubjectBlock extends ISubjectBlock {
    functions?: IInterfaceSubjectFunction[];
    extends?: string;
}

interface IInterfaceSubjectFunction {
    type: string | IDataType;
    name: string;
    args: IInterfaceSubjectFunctionArg[];
    throws: any[];
    headComment?: string;
    tailComment?: string;
}

interface IInterfaceSubjectFunctionArg {
    index: number;
    type: string | IDataType;
    name: string;
}

// Types
// e.g map<t1, t2> list<t> set<t> i32 string..
interface IDataType {
    name: string;
    fullName?: string;
    keyType?: string; // for map
    valueType?: string; // for map set list
}

let simplifyDataType = (type: IDataType): string | IDataType => {
    switch (type.name.toLowerCase()) {
        case "map":
        case "hashmap":
        //return `map<${type.keyType}, ${type.valueType}>`;
        case "list":
        case "arraylist":
        //return `list<${type.valueType}>`;
        case "set":
        case "hashset":
            //return `set<${type.valueType}>`;
            return type;
        default:
            return (type.fullName || type.name).toString();
    }
};

const Primitives = {
    int: "java.lang.Integer",
    Integer: "java.lang.Integer",
    long: "java.lang.Long",
    Long: "java.lang.Long",
    short: "java.lang.Short",
    Short: "java.lang.Short",
    byte: "java.lang.Byte",
    Byte: "java.lang.Byte",
    String: "java.lang.String",
    boolean: "java.lang.Boolean",
    Boolean: "java.lang.Boolean",
    void: "java.lang.Void",
    Void: "java.lang.Void",
    float: "java.lang.Float",
    Float: "java.lang.Float",
    double: "java.lang.Double",
    Double: "java.lang.Double"
};

export default function(code: string) {
    code = code.toString();

    let nCount = 0; // count of \n
    let rCount = 0; // count of \r
    let offset = 0;
    let stack: { offset: number; nCount: number; rCount: number }[] = [];
    let headCommentQueue: string[] = [];
    let tailCommentQueue: string[] = [];

    // package
    let _package;
    let genericImports: string[] = [];
    let specificImports: string[] = [];

    const backup = () => {
        stack.push({
            offset,
            nCount,
            rCount
        });
    };

    const restore = () => {
        let saveCase = stack[stack.length - 1];
        offset = saveCase.offset;
        nCount = saveCase.nCount;
        rCount = saveCase.rCount;
    };

    const drop = () => {
        stack.pop();
    };

    const getLineNum = () => {
        return Math.max(rCount, nCount) + 1;
    };

    const throwError = (message: string) => {
        const line = getLineNum();
        message = `${message}\non Line ${line}`;
        const context = code.slice(offset, offset + 100);
        throw new JavaInterfaceSyntaxError(message, context, line);
    };

    // record line
    // note \r \n \r\n
    // line = Max(rCount, nCount) + 1
    const recordLineNum = (char: string): void => {
        if (char === "\n") {
            nCount++;
        } else if (char === "\r") {
            rCount++;
        }
    };

    // parse single line comment, start with # or //, stop utill line end
    const readSingleLineComment = (): boolean | string => {
        let i = 0;
        if (
            ["#", "/"].indexOf(code[offset + i++]) < 0 ||
            code[offset + i++] !== "/"
        ) {
            return false;
        }

        let comment = "";
        while (code[offset] !== "\n" && code[offset] !== "\r") {
            comment += code[offset++];
        }
        return comment;
    };

    // parse multiple lines comment, start with /*, end with */
    const readMultiLinesComment = (): boolean | string => {
        let i = 0;
        if (code[offset + i++] !== "/" || code[offset + i++] !== "*") {
            return false;
        }

        let comment = "/*";
        do {
            while (offset + i < code.length && code[offset + i] !== "*") {
                recordLineNum(code[offset + i]);
                comment += code[offset + i++];
            }
            comment += code[offset + i];
            i++;
        } while (offset + i < code.length && code[offset + i] !== "/");

        comment += "/";
        offset += ++i;
        return comment;
    };

    // read space to the end of current line or end of a `/* xx */` comment
    // to find a tail comment
    const readCurrentLineSpace = (): void => {
        while (offset < code.length) {
            let char = code[offset];
            recordLineNum(char);
            if (char === "\n" || char === "\r") {
                offset++;
                break;
            }
            if (char === " " || char === "\t") {
                offset++;
            } else {
                // sometimes multiple comment was used as single line comment
                // e.g `/*comment1*/ //comment2`
                let comment1 = readMultiLinesComment();
                if (comment1) {
                    readCurrentLineSpace();
                }
                let comment2 = readSingleLineComment();
                if (!comment1 && !comment2) {
                    break;
                }
                (comment1 || comment2) &&
                    tailCommentQueue.push(<string>(comment1 || comment2));
            }
        }
        return;
    };

    // read space from new line
    // to find head comments
    // this method should be used after `readCurrentLineSpace`
    const readNewLineSpace = (): void => {
        while (offset < code.length) {
            let char = code[offset];
            recordLineNum(char);
            if (
                char === "\n" ||
                char === "\r" ||
                char === " " ||
                char === "\t"
            ) {
                offset++;
            } else {
                let comment =
                    readMultiLinesComment() || readSingleLineComment();
                comment && headCommentQueue.push(<string>comment);
                if (!comment) {
                    break;
                }
            }
        }
        return;
    };

    const readSpace = (): void => {
        readCurrentLineSpace();
        readNewLineSpace();
    };

    const readCommentFromQueue = (isTail = false): string => {
        let queue = isTail ? tailCommentQueue : headCommentQueue;
        let comments: string[] = [];
        let comment: string | undefined;
        while ((comment = queue.shift())) {
            if (comment.startsWith("#")) {
                comment = "//" + comment.slice(1);
            }
            comments.push(comment);
        }
        return comments.join("\r\n");
    };

    const readUntilThrow = (transaction: () => void, key?: string): any => {
        let container: any = key ? {} : [];
        while (true) {
            try {
                backup();
                let result = transaction();
                key
                    ? (container[result[key]] = result)
                    : container.push(result);
            } catch (exception) {
                restore();
                return container;
            } finally {
                drop();
            }
        }
    };

    const readKeyword = (word: string): string => {
        for (let i = 0; i < word.length; i++) {
            if (code[offset + i] !== word[i]) {
                let token = code.substr(offset, word.length);
                throw new Error(
                    `Unexpected token ${token} (current call: readKeyword)`
                );
            }
        }
        offset += word.length;
        readSpace();
        return word;
    };

    const readChar = (char: string) => {
        if (code[offset] !== char) {
            throw new Error(
                `Unexpected char ${code[offset]} (current call: readChar)`
            );
        }
        offset++;
        readSpace();
        return char;
    };

    const readComma = () => {
        let char = code[offset];
        if (/[,|;]/.test(char)) {
            offset++;
            readSpace();
            return char;
        }
    };

    const readExtends = (): string | undefined => {
        try {
            backup();
            readKeyword("extends");
            let name = readRefValue().join(".");
            return name;
        } catch (exception) {
            restore();
            return;
        } finally {
            drop();
        }
    };

    const readArgumentItem = (): IListSubjectItem => {
        let type = simplifyDataType(readType());
        let name = readName();

        readComma();
        let headComment = readCommentFromQueue();
        let tailComment = readCommentFromQueue(true);
        let result: IListSubjectItem = {
            type,
            name,
            headComment,
            tailComment
        };

        return result;
    };

    const readType = (): IDataType => {
        return readWith(readMapType, readSetOrListType, readNormalType);
    };

    const readMapType = (): IDataType => {
        let name = readName();
        let fullName = completeNameSpace(name); // map
        readChar("<");
        let keyType = simplifyDataType(readType()) as string;
        readComma();
        let valueType = simplifyDataType(readType()) as string;
        readChar(">");
        return { name, fullName, keyType, valueType };
    };

    const readSetOrListType = (): IDataType => {
        let name = readName();
        let fullName = completeNameSpace(name); // list/set
        readChar("<");
        let valueType = simplifyDataType(readType()) as string;
        readChar(">");
        return { name, fullName, valueType };
    };

    const readNormalType = (): IDataType => {
        let name = readName();
        let fullName = completeNameSpace(name);
        return { name, fullName };
    };

    const readValue = (): any => {
        return readWith(
            readHexadecimalValue,
            readEnotationValue,
            readNumValue,
            readBoolValue,
            readStringValue,
            readListOrSetValue,
            readMapValue,
            readRefValue
        );
    };

    const readNumValue = (): number => {
        let value: string[] = [];
        if (code[offset] === "-") {
            value.push("-");
            offset++;
        }

        while (true) {
            let char = code[offset];
            if (/[0-9\.]/.test(char)) {
                offset++;
                value.push(char);
            } else if (value.length) {
                readSpace();
                return +value.join("");
            } else {
                throw new Error(
                    `Unexpected token ${char} (current call: readNumValue)`
                );
            }
        }
    };

    const readBoolValue = (): boolean => {
        return JSON.parse(
            readWith(
                readKeyword.bind(this, "true"),
                readKeyword.bind(this, "false")
            )
        );
    };

    const readStringValue = (): string => {
        let value: string[] = [];
        let quote;
        while (true) {
            let char = code[offset++];
            if (!value.length) {
                if (char !== "'" && char !== '"') {
                    throw new Error(
                        "Unexpected token (current call: readStringValue)"
                    );
                } else {
                    quote = char;
                    value.push(char);
                }
            } else {
                if (char === "\\") {
                    value.push(char);
                    value.push(code[offset++]);
                } else if (char === quote) {
                    value.push(char);
                    readSpace();
                    return new Function("return " + value.join(""))();
                } else {
                    value.push(char);
                }
            }
        }
    };

    const readListOrSetValue = (): any[] => {
        readChar("[");
        let list = readUntilThrow((): any => {
            let value = readValue();
            readComma();
            return value;
        });
        readChar("]");
        return list;
    };

    const readMapValue = (): object => {
        readChar("{");
        let map = readUntilThrow((): { key: string; value: any } => {
            let key = readValue();
            readChar(":");
            let value = readValue();
            readComma();
            return { key, value };
        });
        readChar("}");
        return map;
    };

    // e.g read `com.company.service` in `namespace go com.company.service`
    const readRefValue = (): string[] => {
        let list = [readName()];
        let others = readUntilThrow((): string => {
            readChar(".");
            return readName();
        });
        return list.concat(others);
    };

    // e.g read -1.0e6 2.1e-1
    const readEnotationValue = () => {
        let value: string[] = [];
        if (code[offset] === "-") {
            value.push("-");
            offset++;
        }

        while (true) {
            let char = code[offset];
            if (/[0-9\.]/.test(char)) {
                value.push(char);
                offset++;
            } else {
                break;
            }
        }

        if (code[offset] !== "e" && code[offset] !== "E") {
            throw new Error(
                "Unexpected token (current call: readEnotationValue)"
            );
        }
        value.push(code[offset++]);

        while (true && offset < code.length) {
            let char = code[offset];
            if (/[0-9]/.test(char)) {
                offset++;
                value.push(char);
            } else {
                if (value.length) {
                    readSpace();
                    return +value.join("");
                } else {
                    throw new Error(
                        `Unexpect token ${char} (current call: readEnotationValue)`
                    );
                }
            }
        }
    };

    // e.g 0x0000ff
    const readHexadecimalValue = (): number => {
        let value: string[] = [];
        if (code[offset] === "-") {
            value.push(code[offset++]);
        }

        if (code[offset] !== "0") {
            throw new Error(
                `Unexpected token ${code[
                    offset
                ]} (current call: readHexadecimalValue)`
            );
        }
        value.push(code[offset++]);

        while (true) {
            let char = code[offset];
            if (/[0-9a-zA-Z]/.test(char)) {
                offset++;
                value.push(char);
            } else {
                if (value.length) {
                    readSpace();
                    return +value.join("");
                } else {
                    throw new Error(
                        `Unexpected token ${char} (current call: readHexadecimalValue)`
                    );
                }
            }
        }
    };

    const readName = (): string => {
        let i = 0;
        let char = code[offset];
        while (/[a-zA-Z0-9_\.]/.test(char)) {
            char = code[offset + ++i];
        }

        if (i === 0) {
            throw new Error("Invalid name string (current call: readName)");
        }

        let value = code.slice(offset, (offset += i));
        readSpace();
        return value;
    };

    const completeNameSpace = (name: string): string => {
        const type = Primitives[name];
        if (type) {
            return type;
        }
        const match = specificImports.filter(ip => ip.endsWith("." + name));
        if (match.length > 0) {
            return match[0];
        }
        if (genericImports.length > 0) {
            return genericImports[0] + "." + name;
        }
        return _package + "." + name;
    };

    const readAssign = (): any => {
        try {
            backup();
            readChar("=");
            return readValue();
        } catch (exception) {
            restore();
        } finally {
            drop();
        }
    };

    // read specified content in the code
    const readWith = (...readers): any => {
        backup();
        for (let i = 0; i < readers.length; i++) {
            try {
                let result = readers[i]();
                drop();
                return result;
            } catch (exception) {
                restore();
                continue;
            }
        }
        drop();
        throw new Error("Unexcepted Token (current call: readWith)");
    };

    const readPackage = (): ISubjectBlock => {
        // e.g -> package com.alibaba.dubbo.demo;
        let subject = readKeyword("package");
        let type = {
            name: "package"
        };

        readSpace();
        // read `com.alibaba.dubbo.demo` in sample
        let packageName = readRefValue().join(".");
        readComma();

        _package = packageName;

        let headComment = readCommentFromQueue();
        let tailComment = readCommentFromQueue(true);

        return {
            subject,
            type,
            name: "package",
            value: packageName,
            headComment,
            tailComment
        };
    };

    const readImport = (): ISubjectBlock => {
        let subject = readKeyword("import");
        let type = {
            name: "import"
        };
        readSpace();
        // read `com.alibaba.dubbo.demo.provider` in sample
        let importName = readRefValue().join(".");
        readComma();
        if (importName.endsWith(".*")) {
            genericImports.push(importName.substr(0, importName.length - 2));
        } else {
            specificImports.push(importName);
        }

        readSpace();
        let headComment = readCommentFromQueue();
        let tailComment = readCommentFromQueue(true);
        return {
            subject,
            type,
            name: "import",
            value: importName,
            headComment,
            tailComment
        };
    };

    const readScopeProp = () => {
        const scopes = ["private", "public", "package", "protected"];
        readSpace();

        backup();

        let scope = "";

        while (offset < code.length && code[offset] !== " ") {
            scope += code[offset++];
        }

        if (!scopes.includes(scope)) {
            restore();
        }
        drop();
        readSpace();
    };

    // 读取修饰词 final/static
    const readModifier = () => {
        do {
            const modifier = readWith(
                readKeyword.bind(this, "static"),
                readKeyword.bind(this, "final"),
                () => {}
            );
            if (modifier) {
                continue;
            } else {
                break;
            }
        } while (true);
    };

    const readInterface = (): IInterfaceSubjectBlock => {
        readScopeProp();
        let subject = readKeyword("interface");
        let type = {
            name: "interface"
        };
        let name = readName();
        let extend = readExtends();
        let headComment = readCommentFromQueue();
        let tailComment = readCommentFromQueue(true);
        let functions = readInterfaceBlock();
        let result: IInterfaceSubjectBlock = {
            subject,
            type,
            name,
            headComment,
            tailComment
        };
        if (extend !== undefined) {
            result.extends = extend;
        }
        if (functions !== undefined) {
            result.functions = functions;
        }
        return result;
    };

    const readInterfaceBlock = (): IInterfaceSubjectFunction[] => {
        readChar("{");
        let result = readUntilThrow(readInterfaceItem, "name");
        readChar("}");
        return result;
    };

    const readInterfaceItem = (): IInterfaceSubjectFunction => {
        readScopeProp();
        readModifier();
        let type = simplifyDataType(readType()); // function return type
        let name = readName();
        let headComment = readCommentFromQueue();

        // 判断是方法还是变量声明
        const nextChar = code[offset];
        if (nextChar === "(") {
            // 方法声明
            let args = readMethodArgs();
            let tailComment = readCommentFromQueue(true);
            let throws = readMethodThrow();
            readComma();
            return { type, name, args, throws, headComment, tailComment };
        } else {
            // 变量声明
            let value = readAssign();
            let tailComment = readCommentFromQueue(true);
            readComma();
            return {
                type,
                name,
                args: value,
                throws: [],
                headComment,
                tailComment
            };
        }
    };

    const readMethodArgs = (): any[] => {
        readChar("(");
        let result = readUntilThrow(readArgumentItem);
        readChar(")");
        readSpace();
        return result;
    };

    const readMethodThrow = (): any[] => {
        try {
            backup();
            readKeyword("throw");
            return readMethodArgs();
        } catch (exception) {
            restore();
            return [];
        } finally {
            drop();
        }
    };

    // read a subject block, e.g interface, import, package {}
    const readSubject = (): ISubjectBlock => {
        return readWith(readPackage, readImport, readInterface);
    };

    // main function
    const parseJavaInterface = (): object => {
        readSpace();
        let ast = {};
        while (true) {
            try {
                let block = readSubject();
                console.log(_package);
                let { subject, name } = block;
                if (!ast[subject]) {
                    ast[subject] = subject === "import" ? [] : {};
                }

                delete block.subject;
                delete block.name;
                switch (subject) {
                    case "package":
                        ast[subject] = block;
                        break;
                    case "import":
                        ast[subject].push(block);
                        break;
                    case "union":
                        ast[subject][name] = block["items"];
                        break;
                    default:
                        ast[subject][name] = block;
                }
            } catch (exception) {
                throwError(exception);
            } finally {
                if (code.length === offset) break;
            }
        }
        return ast;
    };

    return parseJavaInterface();
}
