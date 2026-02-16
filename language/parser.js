class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.cursor = 0;
    }

    peek() {
        return this.tokens[this.cursor];
    }

    eat() {
        return this.tokens[this.cursor++];
    }

    createNode(type, props, token) {
        return { type, ...props, line: token.line, column: token.column };
    }

    parse() {
        const body = [];
        while (this.cursor < this.tokens.length) {
            body.push(this.parseStatement());
        }
        return { type: "Program", body };
    }

    parseStatement() {
        const token = this.peek();
        if (token.type === "KEYWORD") {
            if (token.value === "soit") return this.parseVariableDeclaration();
            if (token.value === "montre") return this.parsePrintStatement();
            if (token.value === "si") return this.parseIfStatement();
            if (token.value === "tantque") return this.parseWhileStatement();
            if (token.value === "fonction") return this.parseFunctionDeclaration();
            if (token.value === "renvoie") return this.parseReturnStatement();
            if (token.value === "classe") return this.parseClassDeclaration();
            if (token.value === "abstrait") {
                this.eat(); // eat 'abstrait'
                if (this.peek().value !== "classe") throw new Error(`[Ligne ${this.peek().line}] 'classe' attendu après 'abstrait'`);
                const cls = this.parseClassDeclaration();
                cls.isAbstract = true;
                return cls;
            }
            if (token.value === "interface") return this.parseInterfaceDeclaration();
            if (token.value === "essaye") return this.parseTryStatement();
            if (token.value === "lance") return this.parseThrowStatement();
            if (token.value === "inclure") return this.parseIncludeStatement();
            if (token.value === "pour") return this.parsePourChaqueStatement();
        }
        
        const expr = this.parseExpression();
        return this.createNode("ExpressionStatement", { expression: expr }, token);
    }

    parseVariableDeclaration() {
        const startToken = this.eat(); // eat 'soit'
        const identifier = this.eat();
        if (identifier.type !== "IDENTIFIER") throw new Error(`[Ligne ${identifier.line}] Nom de variable attendu`);
        
        const operator = this.eat();
        if (operator.value !== "=") throw new Error(`[Ligne ${operator.line}] '=' attendu`);

        const value = this.parseExpression();
        return this.createNode("VariableDeclaration", { name: identifier.value, value }, startToken);
    }

    parsePrintStatement() {
        const startToken = this.eat(); // eat 'montre'
        let hasParenthesis = false;
        if (this.peek() && this.peek().value === "(") {
            this.eat();
            hasParenthesis = true;
        }

        const args = [];
        args.push(this.parseExpression());

        while (this.peek() && this.peek().type === "PUNCTUATION" && this.peek().value === ",") {
            this.eat(); // eat ','
            args.push(this.parseExpression());
        }

        if (hasParenthesis && this.peek() && this.peek().value === ")") {
            this.eat();
        }
        return this.createNode("PrintStatement", { args }, startToken);
    }

    parseIfStatement() {
        const startToken = this.eat(); // eat 'si'
        const condition = this.parseExpression();
        
        let consequent = [];
        if (this.peek() && this.peek().value === "{") {
            this.eat(); // eat '{'
            while (this.peek() && this.peek().value !== "}") {
                consequent.push(this.parseStatement());
            }
            if (!this.peek() || this.eat().value !== "}") throw new Error(`[Ligne ${startToken.line}] '}' attendu après le bloc si`);
        } else {
            consequent.push(this.parseStatement());
        }

        let alternate = null;
        if (this.peek() && this.peek().value === "sinon") {
            this.eat(); // eat 'sinon'
            if (this.peek() && this.peek().value === "{") {
                this.eat(); // eat '{'
                alternate = [];
                while (this.peek() && this.peek().value !== "}") {
                    alternate.push(this.parseStatement());
                }
                if (!this.peek() || this.eat().value !== "}") throw new Error(`[Ligne ${this.line}] '}' attendu après le bloc sinon`);
            } else {
                alternate = [this.parseStatement()];
            }
        }

        return this.createNode("IfStatement", { condition, consequent, alternate }, startToken);
    }

    parseWhileStatement() {
        const startToken = this.eat(); // eat 'tantque'
        const condition = this.parseExpression();

        let body = [];
        if (this.peek() && this.peek().value === "{") {
            this.eat(); // eat '{'
            while (this.peek() && this.peek().value !== "}") {
                body.push(this.parseStatement());
            }
            if (!this.peek() || this.eat().value !== "}") throw new Error(`[Ligne ${startToken.line}] '}' attendu à la fin du bloc tantque`);
        } else {
            body.push(this.parseStatement());
        }

        return this.createNode("WhileStatement", { condition, body }, startToken);
    }

    parseFunctionDeclaration() {
        const startToken = this.eat(); // eat 'fonction'
        let name = null;
        if (this.peek().type === "IDENTIFIER") {
            name = this.eat().value;
        }

        if (this.peek().value !== "(") throw new Error(`[Ligne ${this.peek().line}] '(' attendu`);
        this.eat(); // eat '('
        
        const params = [];
        if (this.peek().value !== ")") {
            params.push(this.eat().value);
            while (this.peek().value === ",") {
                this.eat();
                params.push(this.eat().value);
            }
        }
        if (this.eat().value !== ")") throw new Error(`[Ligne ${this.peek().line}] ')' attendu`);

        if (this.peek().value !== "{") throw new Error(`[Ligne ${this.peek().line}] '{' attendu pour le corps de la fonction`);
        this.eat(); // eat '{'

        const body = [];
        while (this.peek() && this.peek().value !== "}") {
            body.push(this.parseStatement());
        }
        if (!this.peek() || this.eat().value !== "}") throw new Error(`[Ligne ${this.peek().line}] '}' attendu à la fin de la fonction`);

        return this.createNode("FunctionDeclaration", { name, params, body }, startToken);
    }

    parseReturnStatement() {
        const startToken = this.eat(); // eat 'renvoie'
        const argument = this.parseExpression();
        return this.createNode("ReturnStatement", { argument }, startToken);
    }

    parseClassDeclaration() {
        const startToken = this.eat(); // eat 'classe'
        const nameToken = this.eat();
        if (nameToken.type !== "IDENTIFIER") throw new Error(`[Ligne ${nameToken.line}] Nom de classe attendu`);

        let superClassName = null;
        if (this.peek() && this.peek().value === "herite") {
            this.eat(); // eat 'herite'
            if (this.eat().value !== "de") throw new Error(`[Ligne ${this.line}] 'de' attendu après 'herite'`);
            superClassName = this.eat().value;
        }

        if (this.peek().value !== "{") throw new Error(`[Ligne ${this.line}] '{' attendu pour la classe`);
        this.eat(); // eat '{'

        const methods = [];
        while (this.peek() && this.peek().value !== "}") {
            let visibility = "public";
            if (this.peek().value === "prive" || this.peek().value === "public") {
                visibility = this.eat().value;
            }
            
            const member = this.parseStatement();
            if (member.type !== "FunctionDeclaration") {
                throw new Error(`[Ligne ${this.peek().line}] Seules les fonctions sont autorisées dans les classes pour le moment`);
            }
            member.visibility = visibility;
            methods.push(member);
        }
        if (!this.peek() || this.eat().value !== "}") throw new Error(`[Ligne ${this.line}] '}' attendu à la fin de la classe`);

        return this.createNode("ClassDeclaration", { name: nameToken.value, superClassName, methods }, startToken);
    }

    parseTryStatement() {
        const startToken = this.eat(); // eat 'essaye'
        const block = this.parseBlock();
        
        let handler = null;
        if (this.peek() && this.peek().value === "attrape") {
            const catchToken = this.eat();
            if (this.eat().value !== "(") throw new Error(`[Ligne ${this.line}] '(' attendu après attrape`);
            const param = this.eat().value;
            if (this.eat().value !== ")") throw new Error(`[Ligne ${this.line}] ')' attendu`);
            const body = this.parseBlock();
            handler = { param, body };
        }

        let finalizer = null;
        if (this.peek() && this.peek().value === "enfin") {
            this.eat();
            finalizer = this.parseBlock();
        }

        return this.createNode("TryStatement", { block, handler, finalizer }, startToken);
    }

    parseThrowStatement() {
        const startToken = this.eat(); // eat 'lance'
        const argument = this.parseExpression();
        return this.createNode("ThrowStatement", { argument }, startToken);
    }

    parseIncludeStatement() {
        const startToken = this.eat(); // eat 'inclure'
        const pathToken = this.eat();
        if (pathToken.type !== "STRING") throw new Error(`[Ligne ${pathToken.line}] Chemin de fichier attendu (chaîne de caractères) après inclure`);
        return this.createNode("IncludeStatement", { path: pathToken.value }, startToken);
    }

    parseBlock() {
        if (this.peek().value !== "{") throw new Error(`[Ligne ${this.line}] '{' attendu`);
        this.eat();
        const body = [];
        while (this.peek() && this.peek().value !== "}") {
            body.push(this.parseStatement());
        }
        if (!this.peek() || this.eat().value !== "}") throw new Error(`[Ligne ${this.line}] '}' attendu`);
        return body;
    }

    parseExpression() {
        return this.parseAssignment();
    }

    parseAssignment() {
        let left = this.parseOr();

        if (this.peek() && this.peek().value === "=") {
            const operatorToken = this.eat();
            const right = this.parseAssignment(); // Right-associative
            return this.createNode("AssignmentExpression", { left, right }, operatorToken);
        }

        return left;
    }

    parseOr() {
        let left = this.parseAnd();
        while (this.peek() && this.peek().value === "ou") {
            const operator = this.eat();
            const right = this.parseAnd();
            left = this.createNode("BinaryExpression", { operator: operator.value, left, right }, operator);
        }
        return left;
    }

    parseAnd() {
        let left = this.parseEquality();
        while (this.peek() && this.peek().value === "et") {
            const operator = this.eat();
            const right = this.parseEquality();
            left = this.createNode("BinaryExpression", { operator: operator.value, left, right }, operator);
        }
        return left;
    }

    parseEquality() {
        let left = this.parseComparison();
        while (this.peek() && (this.peek().value === "==" || this.peek().value === "!=")) {
            const operator = this.eat();
            const right = this.parseComparison();
            left = this.createNode("BinaryExpression", { operator: operator.value, left, right }, operator);
        }
        return left;
    }

    parseComparison() {
        let left = this.parseAddition();
        while (this.peek() && (
            this.peek().value === "<" || this.peek().value === ">" ||
            this.peek().value === "<=" || this.peek().value === ">="
        )) {
            const operator = this.eat();
            const right = this.parseAddition();
            left = this.createNode("BinaryExpression", { operator: operator.value, left, right }, operator);
        }
        return left;
    }

    parseAddition() {
        let left = this.parseMultiplication();
        while (this.peek() && (this.peek().value === "+" || this.peek().value === "-")) {
            const operator = this.eat();
            const right = this.parseMultiplication();
            left = this.createNode("BinaryExpression", { operator: operator.value, left, right }, operator);
        }
        return left;
    }

    parseMultiplication() {
        let left = this.parseUnary();
        while (this.peek() && (this.peek().value === "*" || this.peek().value === "/" || this.peek().value === ".")) {
            const operator = this.eat();
            const right = this.parseUnary();
            left = this.createNode("BinaryExpression", { operator: operator.value, left, right }, operator);
        }
        return left;
    }

    parseUnary() {
        if (this.peek() && (this.peek().value === "non" || this.peek().value === "typeof" || this.peek().value === "-")) {
            const operator = this.eat();
            const argument = this.parseUnary();
            return this.createNode("UnaryExpression", { operator: operator.value, argument }, operator);
        }
        return this.parsePrimary();
    }

    parsePrimary() {
        const token = this.peek();

        if (token.value === "(") {
            this.eat(); // eat '('
            const expr = this.parseExpression();
            if (this.eat().value !== ")") throw new Error(`[Ligne ${token.line}] ')' attendu`);
            return expr;
        }

        if (token.type === "NUMBER") return this.createNode("Literal", { value: this.eat().value }, token);
        if (token.type === "STRING") return this.createNode("Literal", { value: this.eat().value }, token);
        if (token.type === "KEYWORD") {
            if (token.value === "vrai") return this.createNode("Literal", { value: true }, this.eat());
            if (token.value === "faux") return this.createNode("Literal", { value: false }, this.eat());
            if (token.value === "nul") return this.createNode("Literal", { value: null }, this.eat());
        }

        if (token.type === "KEYWORD" && token.value === "nouveau") {
            const startToken = this.eat(); // eat 'nouveau'
            const name = this.eat().value;
            if (this.eat().value !== "(") throw new Error(`[Ligne ${this.line}] '(' attendu`);
            if (this.eat().value !== ")") throw new Error(`[Ligne ${this.line}] ')' attendu`);
            return this.createNode("NewExpression", { className: name }, startToken);
        }
        
        if (token.type === "IDENTIFIER") {
            const identifierToken = this.eat();
            if (this.peek() && this.peek().value === "(") {
                return this.parseCallExpression(identifierToken);
            }
            if (this.peek() && this.peek().value === "[") {
                this.eat(); // eat '['
                const index = this.parseExpression();
                if (this.eat().value !== "]") throw new Error(`[Ligne ${this.line}] ']' attendu`);
                return this.createNode("MemberExpression", { 
                    object: this.createNode("Identifier", { name: identifierToken.value }, identifierToken), 
                    property: index 
                }, identifierToken);
            }
            return this.createNode("Identifier", { name: identifierToken.value }, identifierToken);
        }

        if (token.value === "[") {
            return this.parseListLiteral();
        }

        if (token.value === "{") {
            return this.parseObjectLiteral();
        }

        if (token.type === "KEYWORD" && token.value === "fonction") {
            return this.parseFunctionDeclaration();
        }

        throw new Error(`[Ligne ${token.line}] Expression inattendue: ${token.value}`);
    }

    parseObjectLiteral() {
        const startToken = this.eat(); // eat '{'
        const pairs = [];
        if (this.peek().value !== "}") {
            pairs.push(this.parseObjectPair());
            while (this.peek().value === ",") {
                this.eat(); // eat ','
                pairs.push(this.parseObjectPair());
            }
        }
        if (this.eat().value !== "}") throw new Error(`[Ligne ${startToken.line}] '}' attendu à la fin de l'objet`);
        return this.createNode("ObjectLiteral", { pairs }, startToken);
    }

    parseObjectPair() {
        const keyToken = this.eat();
        // Allow identifiers or strings as keys
        if (keyToken.type !== "IDENTIFIER" && keyToken.type !== "STRING") {
            throw new Error(`[Ligne ${keyToken.line}] Clé d'objet attendue`);
        }
        
        if (this.eat().value !== ":") throw new Error(`[Ligne ${keyToken.line}] ':' attendu après la clé`);
        
        const value = this.parseExpression();
        return { key: keyToken.value, value };
    }

    parseCallExpression(calleeToken) {
        this.eat(); // eat '('
        const args = [];
        if (this.peek().value !== ")") {
            args.push(this.parseExpression());
            while (this.peek().value === ",") {
                this.eat();
                args.push(this.parseExpression());
            }
        }
        if (this.eat().value !== ")") throw new Error(`[Ligne ${calleeToken.line}] ')' attendu`);
        return this.createNode("CallExpression", { callee: calleeToken.value, args }, calleeToken);
    }

    parseListLiteral() {
        const startToken = this.eat(); // eat '['
        const elements = [];
        if (this.peek().value !== "]") {
            elements.push(this.parseExpression());
            while (this.peek().value === ",") {
                this.eat();
                elements.push(this.parseExpression());
            }
        }
        if (this.eat().value !== "]") throw new Error(`[Ligne ${startToken.line}] ']' attendu`);
        return this.createNode("ListLiteral", { elements }, startToken);
    }

    parseInterfaceDeclaration() {
        const startToken = this.eat(); // eat 'interface'
        const nameToken = this.eat();
        if (nameToken.type !== "IDENTIFIER") throw new Error(`[Ligne ${nameToken.line}] Nom d'interface attendu`);

        if (this.peek().value !== "{") throw new Error(`[Ligne ${this.line}] '{' attendu`);
        this.eat(); // eat '{'

        const methods = [];
        while (this.peek() && this.peek().value !== "}") {
            // An interface method is just a function declaration without a body (or empty body)
            const method = this.parseStatement();
            if (method.type !== "FunctionDeclaration") {
                throw new Error(`[Ligne ${this.line}] Seules les déclarations de fonctions sont autorisées dans une interface`);
            }
            methods.push(method);
        }
        this.eat(); // eat '}'
        return this.createNode("InterfaceDeclaration", { name: nameToken.value, methods }, startToken);
    }

    parsePourChaqueStatement() {
        const startToken = this.eat(); // eat 'pour'
        if (this.eat().value !== "chaque") throw new Error(`[Ligne ${this.line}] 'chaque' attendu après 'pour'`);
        
        const variable = this.eat();
        if (variable.type !== "IDENTIFIER") throw new Error(`[Ligne ${this.line}] Nom de variable attendu dans la boucle pour chaque`);
        
        if (this.eat().value !== "dans") throw new Error(`[Ligne ${this.line}] 'dans' attendu`);
        
        const iterable = this.parseExpression();
        const body = this.parseBlock();
        
        return this.createNode("PourChaqueStatement", { 
            variable: variable.value, 
            iterable, 
            body 
        }, startToken);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Parser;
}
