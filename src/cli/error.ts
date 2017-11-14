export class JavaInterfaceSyntaxError extends SyntaxError {
    public context: string;
    public line: number;

    constructor(message, context, line) {
        super(message);
        this.context = context;
        this.line = line;
        this.name = "JAVA_INTERFACE_SYNTAX_ERROR";
    }
}
