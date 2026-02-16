class Lexer {
    constructor(input) {
        this.input = input;
        this.cursor = 0;
        this.line = 1;
        this.column = 1;
    }

    createToken(type, value) {
        return { type, value, line: this.line, column: this.column };
    }

    tokenize() {
        const tokens = [];
        while (this.cursor < this.input.length) {
            let char = this.input[this.cursor];

            if (char === '\n') {
                this.line++;
                this.column = 1;
                this.cursor++;
                continue;
            }

            if (/\s/.test(char)) {
                this.cursor++;
                this.column++;
                continue;
            }

            if (char === '#') {
                while (this.cursor < this.input.length && this.input[this.cursor] !== '\n') {
                    this.cursor++;
                }
                continue;
            }

            const startLine = this.line;
            const startColumn = this.column;

            if (/[a-zA-Z_]/.test(char)) {
                let identifier = "";
                while (this.cursor < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.cursor])) {
                    identifier += this.input[this.cursor];
                    this.cursor++;
                    this.column++;
                }

                const keywords = [
                    "montre", "soit", "si", "sinon", "tantque", "faire", "fonction", "renvoie", 
                    "classe", "nouveau", "herite", "de",
                    "prive", "public", "essaye", "attrape", "enfin", "lance", "abstrait", "interface",
                    "inclure", "pour", "chaque", "dans", "et", "ou", "non", "typeof", "vrai", "faux", "nul"
                ];

                // Alias anglais pour les développeurs Python/anglophones
                const aliases = {
                    "print": "montre",
                    "let": "soit",
                    "if": "si",
                    "else": "sinon",
                    "while": "tantque",
                    "do": "faire",
                    "function": "fonction",
                    "return": "renvoie",
                    "class": "classe",
                    "new": "nouveau",
                    "inherits": "herite",
                    "private": "prive",
                    "public": "public",
                    "try": "essaye",
                    "catch": "attrape",
                    "finally": "enfin",
                    "throw": "lance",
                    "abstract": "abstrait",
                    "interface": "interface",
                    "include": "inclure",
                    "for": "pour",
                    "each": "chaque",
                    "in": "dans",
                    "and": "et",
                    "or": "ou",
                    "not": "non",
                    "typeof": "typeof",
                    "true": "vrai",
                    "false": "faux",
                    "null": "nul",
                    "scan_ports": "scan_ports",
                    "port_scan": "scan_ports",
                    "http_request": "requete_http",
                    "fetch": "requete_http"
                };

                // Si c'est un alias anglais, le remplacer par le mot français
                if (aliases[identifier]) {
                    identifier = aliases[identifier];
                }

                if (keywords.includes(identifier)) {
                    tokens.push({ type: "KEYWORD", value: identifier, line: startLine, column: startColumn });
                } else {
                    tokens.push({ type: "IDENTIFIER", value: identifier, line: startLine, column: startColumn });
                }
                continue;
            }

            if (/[0-9]/.test(char)) {
                let number = "";
                while (this.cursor < this.input.length && /[0-9.]/.test(this.input[this.cursor])) {
                    number += this.input[this.cursor];
                    this.cursor++;
                    this.column++;
                }
                tokens.push({ type: "NUMBER", value: parseFloat(number), line: startLine, column: startColumn });
                continue;
            }

            if (char === '"') {
                let string = "";
                this.cursor++; // Skip opening quote
                this.column++;
                while (this.cursor < this.input.length && this.input[this.cursor] !== '"') {
                    if (this.input[this.cursor] === '\\') {
                        this.cursor++;
                        this.column++;
                        const escaped = this.input[this.cursor];
                        if (escaped === '"') string += '"';
                        else if (escaped === 'n') string += '\n';
                        else if (escaped === 't') string += '\t';
                        else if (escaped === '\\') string += '\\';
                        else string += escaped;
                    } else {
                        string += this.input[this.cursor];
                    }
                    this.cursor++;
                    this.column++;
                }
                this.cursor++; // Skip closing quote
                this.column++;
                tokens.push({ type: "STRING", value: string, line: startLine, column: startColumn });
                continue;
            }

            if (char === '=') {
                if (this.input[this.cursor + 1] === '=') {
                    tokens.push({ type: "OPERATOR", value: "==", line: startLine, column: startColumn });
                    this.cursor += 2;
                    this.column += 2;
                } else {
                    tokens.push({ type: "OPERATOR", value: "=", line: startLine, column: startColumn });
                    this.cursor++;
                    this.column++;
                }
                continue;
            }

            if (char === '!') {
                if (this.input[this.cursor + 1] === '=') {
                    tokens.push({ type: "OPERATOR", value: "!=", line: startLine, column: startColumn });
                    this.cursor += 2;
                    this.column += 2;
                } else {
                    throw new Error(`[Ligne ${this.line}, Col ${this.column}] '!' inattendu, attendu '!='`);
                }
                continue;
            }

            if (char === ',') {
                tokens.push({ type: "PUNCTUATION", value: ",", line: startLine, column: startColumn });
                this.cursor++;
                this.column++;
                continue;
            }

            if (char === ':') {
                tokens.push({ type: "PUNCTUATION", value: ":", line: startLine, column: startColumn });
                this.cursor++;
                this.column++;
                continue;
            }

            if (char === '.') {
                tokens.push({ type: "PUNCTUATION", value: ".", line: startLine, column: startColumn });
                this.cursor++;
                this.column++;
                continue;
            }

            if (char === '[') {
                tokens.push({ type: "PUNCTUATION", value: "[", line: startLine, column: startColumn });
                this.cursor++;
                this.column++;
                continue;
            }

            if (char === ']') {
                tokens.push({ type: "PUNCTUATION", value: "]", line: startLine, column: startColumn });
                this.cursor++;
                this.column++;
                continue;
            }

            if (char === '{') {
                tokens.push({ type: "PUNCTUATION", value: "{", line: startLine, column: startColumn });
                this.cursor++;
                this.column++;
                continue;
            }

            if (char === '}') {
                tokens.push({ type: "PUNCTUATION", value: "}", line: startLine, column: startColumn });
                this.cursor++;
                this.column++;
                continue;
            }

            if (char === '<') {
                if (this.input[this.cursor + 1] === '=') {
                    tokens.push({ type: "OPERATOR", value: "<=", line: startLine, column: startColumn });
                    this.cursor += 2;
                    this.column += 2;
                } else {
                    tokens.push({ type: "OPERATOR", value: "<", line: startLine, column: startColumn });
                    this.cursor++;
                    this.column++;
                }
                continue;
            }

            if (char === '>') {
                if (this.input[this.cursor + 1] === '=') {
                    tokens.push({ type: "OPERATOR", value: ">=", line: startLine, column: startColumn });
                    this.cursor += 2;
                    this.column += 2;
                } else {
                    tokens.push({ type: "OPERATOR", value: ">", line: startLine, column: startColumn });
                    this.cursor++;
                    this.column++;
                }
                continue;
            }

            if (/[+*/()-]/.test(char)) {
                tokens.push({ type: "OPERATOR", value: char, line: startLine, column: startColumn });
                this.cursor++;
                this.column++;
                continue;
            }

            throw new Error(`[Ligne ${this.line}, Col ${this.column}] Caractère inattendu: ${char}`);
        }
        return tokens;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lexer;
}
