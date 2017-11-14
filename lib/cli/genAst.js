"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var error_1 = require("./error");
var simplifyDataType = function (type) {
    switch (type.name.toLowerCase()) {
        case "map":
        case "hashmap":
        case "list":
        case "arraylist":
        case "set":
        case "hashset":
            return type;
        default:
            return (type.fullName || type.name).toString();
    }
};
var Primitives = {
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
function default_1(code) {
    var _this = this;
    code = code.toString();
    var nCount = 0; // count of \n
    var rCount = 0; // count of \r
    var offset = 0;
    var stack = [];
    var headCommentQueue = [];
    var tailCommentQueue = [];
    // package
    var _package;
    var genericImports = [];
    var specificImports = [];
    var backup = function () {
        stack.push({
            offset: offset,
            nCount: nCount,
            rCount: rCount
        });
    };
    var restore = function () {
        var saveCase = stack[stack.length - 1];
        offset = saveCase.offset;
        nCount = saveCase.nCount;
        rCount = saveCase.rCount;
    };
    var drop = function () {
        stack.pop();
    };
    var getLineNum = function () {
        return Math.max(rCount, nCount) + 1;
    };
    var throwError = function (message) {
        var line = getLineNum();
        message = message + "\non Line " + line;
        var context = code.slice(offset, offset + 100);
        throw new error_1.JavaInterfaceSyntaxError(message, context, line);
    };
    // record line
    // note \r \n \r\n
    // line = Max(rCount, nCount) + 1
    var recordLineNum = function (char) {
        if (char === "\n") {
            nCount++;
        }
        else if (char === "\r") {
            rCount++;
        }
    };
    // parse single line comment, start with # or //, stop utill line end
    var readSingleLineComment = function () {
        var i = 0;
        if (["#", "/"].indexOf(code[offset + i++]) < 0 ||
            code[offset + i++] !== "/") {
            return false;
        }
        var comment = "";
        while (code[offset] !== "\n" && code[offset] !== "\r") {
            comment += code[offset++];
        }
        return comment;
    };
    // parse multiple lines comment, start with /*, end with */
    var readMultiLinesComment = function () {
        var i = 0;
        if (code[offset + i++] !== "/" || code[offset + i++] !== "*") {
            return false;
        }
        var comment = "/*";
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
    var readCurrentLineSpace = function () {
        while (offset < code.length) {
            var char = code[offset];
            recordLineNum(char);
            if (char === "\n" || char === "\r") {
                offset++;
                break;
            }
            if (char === " " || char === "\t") {
                offset++;
            }
            else {
                // sometimes multiple comment was used as single line comment
                // e.g `/*comment1*/ //comment2`
                var comment1 = readMultiLinesComment();
                if (comment1) {
                    readCurrentLineSpace();
                }
                var comment2 = readSingleLineComment();
                if (!comment1 && !comment2) {
                    break;
                }
                (comment1 || comment2) &&
                    tailCommentQueue.push((comment1 || comment2));
            }
        }
        return;
    };
    // read space from new line
    // to find head comments
    // this method should be used after `readCurrentLineSpace`
    var readNewLineSpace = function () {
        while (offset < code.length) {
            var char = code[offset];
            recordLineNum(char);
            if (char === "\n" ||
                char === "\r" ||
                char === " " ||
                char === "\t") {
                offset++;
            }
            else {
                var comment = readMultiLinesComment() || readSingleLineComment();
                comment && headCommentQueue.push(comment);
                if (!comment) {
                    break;
                }
            }
        }
        return;
    };
    var readSpace = function () {
        readCurrentLineSpace();
        readNewLineSpace();
    };
    var readCommentFromQueue = function (isTail) {
        if (isTail === void 0) { isTail = false; }
        var queue = isTail ? tailCommentQueue : headCommentQueue;
        var comments = [];
        var comment;
        while ((comment = queue.shift())) {
            if (comment.startsWith("#")) {
                comment = "//" + comment.slice(1);
            }
            comments.push(comment);
        }
        return comments.join("\r\n");
    };
    var readUntilThrow = function (transaction, key) {
        var container = key ? {} : [];
        while (true) {
            try {
                backup();
                var result = transaction();
                key
                    ? (container[result[key]] = result)
                    : container.push(result);
            }
            catch (exception) {
                restore();
                return container;
            }
            finally {
                drop();
            }
        }
    };
    var readKeyword = function (word) {
        for (var i = 0; i < word.length; i++) {
            if (code[offset + i] !== word[i]) {
                var token = code.substr(offset, word.length);
                throw new Error("Unexpected token " + token + " (current call: readKeyword)");
            }
        }
        offset += word.length;
        readSpace();
        return word;
    };
    var readChar = function (char) {
        if (code[offset] !== char) {
            throw new Error("Unexpected char " + code[offset] + " (current call: readChar)");
        }
        offset++;
        readSpace();
        return char;
    };
    var readComma = function () {
        var char = code[offset];
        if (/[,|;]/.test(char)) {
            offset++;
            readSpace();
            return char;
        }
    };
    var readExtends = function () {
        try {
            backup();
            readKeyword("extends");
            var name_1 = readRefValue().join(".");
            return name_1;
        }
        catch (exception) {
            restore();
            return;
        }
        finally {
            drop();
        }
    };
    var readArgumentItem = function () {
        var type = simplifyDataType(readType());
        var name = readName();
        readComma();
        var headComment = readCommentFromQueue();
        var tailComment = readCommentFromQueue(true);
        var result = {
            type: type,
            name: name,
            headComment: headComment,
            tailComment: tailComment
        };
        return result;
    };
    var readType = function () {
        return readWith(readMapType, readSetOrListType, readNormalType);
    };
    var readMapType = function () {
        var name = readName();
        var fullName = completeNameSpace(name); // map
        readChar("<");
        var keyType = simplifyDataType(readType());
        readComma();
        var valueType = simplifyDataType(readType());
        readChar(">");
        return { name: name, fullName: fullName, keyType: keyType, valueType: valueType };
    };
    var readSetOrListType = function () {
        var name = readName();
        var fullName = completeNameSpace(name); // list/set
        readChar("<");
        var valueType = simplifyDataType(readType());
        readChar(">");
        return { name: name, fullName: fullName, valueType: valueType };
    };
    var readNormalType = function () {
        var name = readName();
        var fullName = completeNameSpace(name);
        return { name: name, fullName: fullName };
    };
    var readValue = function () {
        return readWith(readHexadecimalValue, readEnotationValue, readNumValue, readBoolValue, readStringValue, readListOrSetValue, readMapValue, readRefValue);
    };
    var readNumValue = function () {
        var value = [];
        if (code[offset] === "-") {
            value.push("-");
            offset++;
        }
        while (true) {
            var char = code[offset];
            if (/[0-9\.]/.test(char)) {
                offset++;
                value.push(char);
            }
            else if (value.length) {
                readSpace();
                return +value.join("");
            }
            else {
                throw new Error("Unexpected token " + char + " (current call: readNumValue)");
            }
        }
    };
    var readBoolValue = function () {
        return JSON.parse(readWith(readKeyword.bind(_this, "true"), readKeyword.bind(_this, "false")));
    };
    var readStringValue = function () {
        var value = [];
        var quote;
        while (true) {
            var char = code[offset++];
            if (!value.length) {
                if (char !== "'" && char !== '"') {
                    throw new Error("Unexpected token (current call: readStringValue)");
                }
                else {
                    quote = char;
                    value.push(char);
                }
            }
            else {
                if (char === "\\") {
                    value.push(char);
                    value.push(code[offset++]);
                }
                else if (char === quote) {
                    value.push(char);
                    readSpace();
                    return new Function("return " + value.join(""))();
                }
                else {
                    value.push(char);
                }
            }
        }
    };
    var readListOrSetValue = function () {
        readChar("[");
        var list = readUntilThrow(function () {
            var value = readValue();
            readComma();
            return value;
        });
        readChar("]");
        return list;
    };
    var readMapValue = function () {
        readChar("{");
        var map = readUntilThrow(function () {
            var key = readValue();
            readChar(":");
            var value = readValue();
            readComma();
            return { key: key, value: value };
        });
        readChar("}");
        return map;
    };
    // e.g read `com.company.service` in `namespace go com.company.service`
    var readRefValue = function () {
        var list = [readName()];
        var others = readUntilThrow(function () {
            readChar(".");
            return readName();
        });
        return list.concat(others);
    };
    // e.g read -1.0e6 2.1e-1
    var readEnotationValue = function () {
        var value = [];
        if (code[offset] === "-") {
            value.push("-");
            offset++;
        }
        while (true) {
            var char = code[offset];
            if (/[0-9\.]/.test(char)) {
                value.push(char);
                offset++;
            }
            else {
                break;
            }
        }
        if (code[offset] !== "e" && code[offset] !== "E") {
            throw new Error("Unexpected token (current call: readEnotationValue)");
        }
        value.push(code[offset++]);
        while (true && offset < code.length) {
            var char = code[offset];
            if (/[0-9]/.test(char)) {
                offset++;
                value.push(char);
            }
            else {
                if (value.length) {
                    readSpace();
                    return +value.join("");
                }
                else {
                    throw new Error("Unexpect token " + char + " (current call: readEnotationValue)");
                }
            }
        }
    };
    // e.g 0x0000ff
    var readHexadecimalValue = function () {
        var value = [];
        if (code[offset] === "-") {
            value.push(code[offset++]);
        }
        if (code[offset] !== "0") {
            throw new Error("Unexpected token " + code[offset] + " (current call: readHexadecimalValue)");
        }
        value.push(code[offset++]);
        while (true) {
            var char = code[offset];
            if (/[0-9a-zA-Z]/.test(char)) {
                offset++;
                value.push(char);
            }
            else {
                if (value.length) {
                    readSpace();
                    return +value.join("");
                }
                else {
                    throw new Error("Unexpected token " + char + " (current call: readHexadecimalValue)");
                }
            }
        }
    };
    var readName = function () {
        var i = 0;
        var char = code[offset];
        while (/[a-zA-Z0-9_\.]/.test(char)) {
            char = code[offset + ++i];
        }
        if (i === 0) {
            throw new Error("Invalid name string (current call: readName)");
        }
        var value = code.slice(offset, (offset += i));
        readSpace();
        return value;
    };
    var completeNameSpace = function (name) {
        var type = Primitives[name];
        if (type) {
            return type;
        }
        var match = specificImports.filter(function (ip) { return ip.endsWith("." + name); });
        if (match.length > 0) {
            return match[0];
        }
        if (genericImports.length > 0) {
            return genericImports[0] + "." + name;
        }
        return _package + "." + name;
    };
    var readAssign = function () {
        try {
            backup();
            readChar("=");
            return readValue();
        }
        catch (exception) {
            restore();
        }
        finally {
            drop();
        }
    };
    // read specified content in the code
    var readWith = function () {
        var readers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            readers[_i] = arguments[_i];
        }
        backup();
        for (var i = 0; i < readers.length; i++) {
            try {
                var result = readers[i]();
                drop();
                return result;
            }
            catch (exception) {
                restore();
                continue;
            }
        }
        drop();
        throw new Error("Unexcepted Token (current call: readWith)");
    };
    var readPackage = function () {
        // e.g -> package com.alibaba.dubbo.demo;
        var subject = readKeyword("package");
        var type = {
            name: "package"
        };
        readSpace();
        // read `com.alibaba.dubbo.demo` in sample
        var packageName = readRefValue().join(".");
        readComma();
        _package = packageName;
        var headComment = readCommentFromQueue();
        var tailComment = readCommentFromQueue(true);
        return {
            subject: subject,
            type: type,
            name: "package",
            value: packageName,
            headComment: headComment,
            tailComment: tailComment
        };
    };
    var readImport = function () {
        var subject = readKeyword("import");
        var type = {
            name: "import"
        };
        readSpace();
        // read `com.alibaba.dubbo.demo.provider` in sample
        var importName = readRefValue().join(".");
        readComma();
        if (importName.endsWith(".*")) {
            genericImports.push(importName.substr(0, importName.length - 2));
        }
        else {
            specificImports.push(importName);
        }
        readSpace();
        var headComment = readCommentFromQueue();
        var tailComment = readCommentFromQueue(true);
        return {
            subject: subject,
            type: type,
            name: "import",
            value: importName,
            headComment: headComment,
            tailComment: tailComment
        };
    };
    var readScopeProp = function () {
        var scopes = ["private", "public", "package", "protected"];
        readSpace();
        backup();
        var scope = "";
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
    var readModifier = function () {
        do {
            var modifier = readWith(readKeyword.bind(_this, "static"), readKeyword.bind(_this, "final"), function () { });
            if (modifier) {
                continue;
            }
            else {
                break;
            }
        } while (true);
    };
    var readInterface = function () {
        readScopeProp();
        var subject = readKeyword("interface");
        var type = {
            name: "interface"
        };
        var name = readName();
        var extend = readExtends();
        var headComment = readCommentFromQueue();
        var tailComment = readCommentFromQueue(true);
        var functions = readInterfaceBlock();
        var result = {
            subject: subject,
            type: type,
            name: name,
            headComment: headComment,
            tailComment: tailComment
        };
        if (extend !== undefined) {
            result.extends = extend;
        }
        if (functions !== undefined) {
            result.functions = functions;
        }
        return result;
    };
    var readInterfaceBlock = function () {
        readChar("{");
        var result = readUntilThrow(readInterfaceItem, "name");
        readChar("}");
        return result;
    };
    var readInterfaceItem = function () {
        readScopeProp();
        readModifier();
        var type = simplifyDataType(readType()); // function return type
        var name = readName();
        var headComment = readCommentFromQueue();
        // 判断是方法还是变量声明
        var nextChar = code[offset];
        if (nextChar === "(") {
            // 方法声明
            var args = readMethodArgs();
            var tailComment = readCommentFromQueue(true);
            var throws = readMethodThrow();
            readComma();
            return { type: type, name: name, args: args, throws: throws, headComment: headComment, tailComment: tailComment };
        }
        else {
            // 变量声明
            var value = readAssign();
            var tailComment = readCommentFromQueue(true);
            readComma();
            return {
                type: type,
                name: name,
                args: value,
                throws: [],
                headComment: headComment,
                tailComment: tailComment
            };
        }
    };
    var readMethodArgs = function () {
        readChar("(");
        var result = readUntilThrow(readArgumentItem);
        readChar(")");
        readSpace();
        return result;
    };
    var readMethodThrow = function () {
        try {
            backup();
            readKeyword("throw");
            return readMethodArgs();
        }
        catch (exception) {
            restore();
            return [];
        }
        finally {
            drop();
        }
    };
    // read a subject block, e.g interface, import, package {}
    var readSubject = function () {
        return readWith(readPackage, readImport, readInterface);
    };
    // main function
    var parseJavaInterface = function () {
        readSpace();
        var ast = {};
        while (true) {
            try {
                var block = readSubject();
                console.log(_package);
                var subject = block.subject, name_2 = block.name;
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
                        ast[subject][name_2] = block["items"];
                        break;
                    default:
                        ast[subject][name_2] = block;
                }
            }
            catch (exception) {
                throwError(exception);
            }
            finally {
                if (code.length === offset)
                    break;
            }
        }
        return ast;
    };
    return parseJavaInterface();
}
exports.default = default_1;
