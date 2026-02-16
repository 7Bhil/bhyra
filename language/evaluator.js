let readline;
if (typeof require !== 'undefined') {
    try {
        readline = require('readline-sync');
    } catch (e) {}
}

class Environment {
    // ... logic continues ...
    constructor(parent = null) {
        this.variables = {};
        this.parent = parent;
    }

    define(name, value) {
        this.variables[name] = value;
    }

    get(name, node) {
        if (name in this.variables) return this.variables[name];
        if (this.parent) return this.parent.get(name, node);
        throw new Error(`[Ligne ${node.line}, Col ${node.column}] Variable non définie: ${name}`);
    }

    assign(name, value, node) {
        if (name in this.variables) {
            this.variables[name] = value;
            return;
        }
        if (this.parent) {
            this.parent.assign(name, value, node);
            return;
        }
        throw new Error(`[Ligne ${node.line}, Col ${node.column}] Variable non définie: ${name}`);
    }
}

class ReturnValue {
    constructor(value) {
        this.value = value;
    }
}

class Evaluator {
    constructor() {
        this.globalEnv = new Environment();
        this.env = this.globalEnv;
        this.functions = {};
        this.classes = {};

        // Built-in functions
        this.setupBuiltIns();
    }

    setupBuiltIns() {
        this.functions["longueur"] = {
            type: "BuiltIn",
            fn: (args) => {
                if (Array.isArray(args[0]) || typeof args[0] === 'string') return args[0].length;
                return 0;
            }
        };
        this.functions["aleatoire"] = {
            type: "BuiltIn",
            fn: (args) => {
                const min = args[0] || 0;
                const max = args[1] || 100;
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        };
        this.functions["entre"] = {
            type: "BuiltIn",
            fn: (args) => {
                if (readline) return readline.question(args[0] || "");
                return prompt(args[0] || "");
            }
        };
// ... further down ...
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Evaluator;
}
        this.functions["min"] = {
            type: "BuiltIn",
            fn: (args) => {
                if (!Array.isArray(args[0]) || args[0].length === 0) return null;
                return Math.min(...args[0]);
            }
        };
        this.functions["max"] = {
            type: "BuiltIn",
            fn: (args) => {
                if (!Array.isArray(args[0]) || args[0].length === 0) return null;
                return Math.max(...args[0]);
            }
        };
        this.functions["croissant"] = {
            type: "BuiltIn",
            fn: (args) => {
                if (!Array.isArray(args[0])) return args[0];
                return [...args[0]].sort((a, b) => a - b);
            }
        };
        this.functions["decroissant"] = {
            type: "BuiltIn",
            fn: (args) => {
                if (!Array.isArray(args[0])) return args[0];
                return [...args[0]].sort((a, b) => b - a);
            }
        };
        this.functions["lire"] = {
            type: "BuiltIn",
            fn: (args) => {
                const fs = require('fs');
                return fs.readFileSync(args[0], 'utf8');
            }
        };
        this.functions["ecrire"] = {
            type: "BuiltIn",
            fn: (args) => {
                const fs = require('fs');
                fs.writeFileSync(args[0], args[1]);
                return true;
            }
        };
        this.functions["existe"] = {
            type: "BuiltIn",
            fn: (args) => {
                const fs = require('fs');
                return fs.existsSync(args[0]);
            }
        };
        this.functions["supprimer"] = {
            type: "BuiltIn",
            fn: (args) => {
                const fs = require('fs');
                if (fs.existsSync(args[0])) {
                    if (fs.lstatSync(args[0]).isDirectory()) {
                        fs.rmdirSync(args[0]);
                    } else {
                        fs.unlinkSync(args[0]);
                    }
                    return true;
                }
                return false;
            }
        };
        this.functions["lister"] = {
            type: "BuiltIn",
            fn: (args) => {
                const fs = require('fs');
                return fs.readdirSync(args[0]);
            }
        };
        this.functions["est_dossier"] = {
            type: "BuiltIn",
            fn: (args) => {
                const fs = require('fs');
                return fs.lstatSync(args[0]).isDirectory();
            }
        };
        this.functions["creer_dossier"] = {
            type: "BuiltIn",
            fn: (args) => {
                const fs = require('fs');
                fs.mkdirSync(args[0], { recursive: true });
                return true;
            }
        };
        this.functions["renommer"] = {
            type: "BuiltIn",
            fn: (args) => {
                const fs = require('fs');
                fs.renameSync(args[0], args[1]);
                return true;
            }
        };
        this.functions["date"] = {
            type: "BuiltIn",
            fn: () => new Date().toLocaleString()
        };
        this.functions["execute"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                try {
                    return execSync(args[0]).toString();
                } catch (e) {
                    return e.message;
                }
            }
        };
        // === Fonctions Réseau (via outils Go) ===
        this.functions["scan_ports"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const host = args[0];
                let portArg = "";
                if (args[1] && Array.isArray(args[1])) {
                    portArg = args[1].join(",");
                }
                
                const toolPath = path.join(__dirname, 'tools', 'portscanner');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil portscanner non compilé. Lancez: cd tools && go build -o portscanner portscanner.go" };
                }
                
                try {
                    const cmd = portArg ? `"${toolPath}" "${host}" "${portArg}"` : `"${toolPath}" "${host}"`;
                    const output = execSync(cmd).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["requete_http"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const targetUrl = args[0];
                const optionsArg = args[1] || {};
                
                const method = (optionsArg.methode || 'GET').toUpperCase();
                const headers = JSON.stringify(optionsArg.entetes || {});
                const body = optionsArg.corps ? (typeof optionsArg.corps === 'string' ? optionsArg.corps : JSON.stringify(optionsArg.corps)) : "";
                
                const toolPath = path.join(__dirname, 'tools', 'http_client');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil http_client non compilé" };
                }
                
                try {
                    // Utiliser un shell pour passer les arguments proprement, ou un tableau d'arguments pour execFileSync
                    const { execFileSync } = require('child_process');
                    const output = execFileSync(toolPath, [method, targetUrl, headers, body]).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["requete_post"] = {
            type: "BuiltIn",
            fn: (args) => {
                const url = args[0];
                const donnees = args[1];
                const entetes = args[2] || {};
                
                return this.functions["requete_http"].fn([url, {
                    methode: "POST",
                    corps: donnees,
                    entetes: {
                        'Content-Type': 'application/json',
                        ...entetes
                    }
                }]);
            }
        };
        this.functions["mon_ip"] = {
            type: "BuiltIn",
            fn: () => {
                const res = this.functions["requete_http"].fn(["https://api.ipify.org?format=json"]);
                if (res.error) return res;
                try {
                    const data = JSON.parse(res.body);
                    return data.ip;
                } catch (e) {
                    return res.body;
                }
            }
        };
        this.functions["analyse_en_tetes"] = {
            type: "BuiltIn",
            fn: (args) => {
                const res = this.functions["requete_http"].fn([args[0]]);
                if (res.error) return res;
                const h = {};
                // Normaliser les clés de headers (elles peuvent être des tableaux en Go JSON)
                for (const key in res.headers) {
                    h[key.toLowerCase()] = res.headers[key][0];
                }
                
                return {
                    "HSTS": !!h['strict-transport-security'],
                    "CSP": !!h['content-security-policy'],
                    "X-Frame-Options": !!h['x-frame-options'],
                    "X-XSS-Protection": !!h['x-xss-protection'],
                    "Server": h['server'] || "Inconnu"
                };
            }
        };
        this.functions["scan_vulnerabilites"] = {
            type: "BuiltIn",
            fn: (args) => {
                const url = args[0];
                const headers = this.functions["analyse_en_tetes"].fn([url]);
                if (headers.error) return headers;
                
                const vulns = [];
                if (!headers.HSTS) vulns.push("HSTS Manquant");
                if (!headers.CSP) vulns.push("CSP Manquant");
                if (headers.Server && headers.Server.includes("/")) vulns.push("Version du serveur exposée");
                
                return { 
                    url, 
                    score_securite: 100 - (vulns.length * 20), 
                    vulnerabilites: vulns 
                };
            }
        };
        this.functions["test_xss_basique"] = {
            type: "BuiltIn",
            fn: (args) => {
                const url = args[0];
                const payload = "<script>alert(1)</script>";
                const testUrl = url.includes("?") ? `${url}&xss=${payload}` : `${url}?xss=${payload}`;
                const res = this.functions["requete_http"].fn([testUrl]);
                if (res.error) return res;
                
                const reflected = res.body.includes(payload);
                return {
                    url: url,
                    vulnerable: reflected,
                    detail: reflected ? "Le payload XSS a été retrouvé dans la réponse" : "Pas de réflexion détectée"
                };
            }
        };
        // === Outil: DirBuster (brute force répertoires) ===
        this.functions["dirbuster"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const url = args[0];
                const wordlist = args[1] || "";
                
                const toolPath = path.join(__dirname, 'tools', 'dirbuster');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil dirbuster non compilé" };
                }
                
                try {
                    const cmd = wordlist ? `"${toolPath}" "${url}" "${wordlist}"` : `"${toolPath}" "${url}"`;
                    const output = execSync(cmd, { timeout: 60000 }).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        // === Outil: DNS Resolver ===
        this.functions["dns_resolve"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const hostname = args[0];
                
                const toolPath = path.join(__dirname, 'tools', 'dns_resolver');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil dns_resolver non compilé" };
                }
                
                try {
                    const output = execSync(`"${toolPath}" "${hostname}"`).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["dns_bruteforce"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const domain = args[0];
                
                const toolPath = path.join(__dirname, 'tools', 'dns_resolver');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil dns_resolver non compilé" };
                }
                
                try {
                    const output = execSync(`"${toolPath}" --bruteforce "${domain}"`, { timeout: 60000 }).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        // === Outil: Subnet Scanner ===
        this.functions["subnet_scan"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const cidr = args[0];
                const timeout = args[1] || 2;
                const workers = args[2] || 100;
                
                const toolPath = path.join(__dirname, 'tools', 'subnet_scanner');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil subnet_scanner non compilé" };
                }
                
                try {
                    const cmd = `"${toolPath}" "${cidr}" --timeout=${timeout} --workers=${workers}`;
                    const output = execSync(cmd, { timeout: 120000 }).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        // === Outil: Crypto Tool (hash/chiffrement) ===
        this.functions["hash"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const algo = args[0]; // md5, sha1, sha256, sha512
                const data = args[1];
                
                const toolPath = path.join(__dirname, 'tools', 'crypto_tool');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil crypto_tool non compilé" };
                }
                
                try {
                    const cmd = `"${toolPath}" hash "${algo}" "${data}"`;
                    const output = execSync(cmd).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["encrypt"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const data = args[0];
                const key = args[1];
                
                const toolPath = path.join(__dirname, 'tools', 'crypto_tool');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil crypto_tool non compilé" };
                }
                
                try {
                    const cmd = `"${toolPath}" encrypt "${data}" "${key}"`;
                    const output = execSync(cmd).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["decrypt"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const ciphertext = args[0];
                const key = args[1];
                
                const toolPath = path.join(__dirname, 'tools', 'crypto_tool');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil crypto_tool non compilé" };
                }
                
                try {
                    const cmd = `"${toolPath}" decrypt "${ciphertext}" "${key}"`;
                    const output = execSync(cmd).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["crypto_benchmark"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const algo = args[0];
                const iterations = args[1] || 10000;
                
                const toolPath = path.join(__dirname, 'tools', 'crypto_tool');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil crypto_tool non compilé" };
                }
                
                try {
                    const cmd = `"${toolPath}" benchmark "${algo}" "${iterations}"`;
                    const output = execSync(cmd).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["generate_key"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const length = args[0] || 32;
                
                const toolPath = path.join(__dirname, 'tools', 'crypto_tool');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil crypto_tool non compilé" };
                }
                
                try {
                    const cmd = `"${toolPath}" generate_key "${length}"`;
                    const output = execSync(cmd).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        // === Outil: Fast Ping (ICMP/TCP) ===
        this.functions["fast_ping"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const host = args[0];
                const port = args[1] || 80;
                
                const toolPath = path.join(__dirname, 'tools', 'fast_ping');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil fast_ping non compilé" };
                }
                
                try {
                    const cmd = `"${toolPath}" ping "${host}" "${port}"`;
                    const output = execSync(cmd).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["ping_sweep"] = {
            type: "BuiltIn",
            fn: (args) => {
                const { execSync } = require('child_process');
                const path = require('path');
                const fs = require('fs');
                
                const network = args[0];
                const workers = args[1] || 50;
                
                const toolPath = path.join(__dirname, 'tools', 'fast_ping');
                if (!fs.existsSync(toolPath)) {
                    return { error: "Outil fast_ping non compilé" };
                }
                
                try {
                    const cmd = `"${toolPath}" sweep "${network}" "${workers}"`;
                    const output = execSync(cmd).toString();
                    return JSON.parse(output);
                } catch (e) {
                    return { error: e.message };
                }
            }
        };
        this.functions["croissant"] = {
            type: "BuiltIn",
            fn: (args) => {
                if (!Array.isArray(args[0])) return args[0];
                return [...args[0]].sort((a, b) => a - b);
            }
        };

        this.setupBhyra();
    }

    setupBhyra() {
        this.functions["creer_serveur"] = {
            type: "BuiltIn",
            fn: (args) => {
                const http = require('http');
                const routes = [];
                const evaluator = this;

                const serverObj = {
                    route: (method, path, callback) => {
                        routes.push({ method: method.toUpperCase(), path, callback });
                        return null;
                    },
                    ecouter: (port) => {
                        const startServer = (p) => {
                            const server = http.createServer((req, res) => {
                                const matchingRoute = routes.find(r => r.method === req.method && r.path === req.url);
                                if (matchingRoute) {
                                    const bReq = { methode: req.method, url: req.url };
                                    const bRes = {
                                        envoyer: (data, type = "text/html") => {
                                            res.setHeader("Content-Type", `${type}; charset=utf-8`);
                                            res.end(data ? data.toString() : "");
                                            return null;
                                        },
                                        statut: (code) => {
                                            res.statusCode = code;
                                            return bRes;
                                        },
                                        entete: (cle, valeur) => {
                                            res.setHeader(cle, valeur);
                                            return bRes;
                                        },
                                        rendre: (viewPath, data) => {
                                            const fs = require('fs');
                                            const path = require('path');
                                            try {
                                                let content = fs.readFileSync(viewPath, 'utf8');
                                                const ext = path.extname(viewPath).toLowerCase();
                                                const mimes = { ".js": "application/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".bh": "text/plain" };
                                                res.setHeader("Content-Type", (mimes[ext] || "text/html") + "; charset=utf-8");
                                                if (data) {
                                                    for (const key in data) {
                                                        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                                                        content = content.replace(regex, data[key]);
                                                    }
                                                }
                                                res.end(content);
                                            } catch (e) {
                                                res.statusCode = 500;
                                                res.end(`Erreur de rendu (Bhyra): ${e.message}`);
                                            }
                                            return null;
                                        }
                                    };
                                    evaluator.callBhyraCallback(matchingRoute.callback, [bReq, bRes]);
                                } else {
                                    res.statusCode = 404;
                                    res.end("Not Found (Bhyra)");
                                }
                            });

                            server.on('error', (err) => {
                                if (err.code === 'EADDRINUSE') {
                                    console.log(`\x1b[33m[Bhyra]\x1b[0m Port ${p} occupé, tentative sur ${p + 1}...`);
                                    startServer(p + 1);
                                } else {
                                    console.error(`\x1b[31m[Bhyra]\x1b[0m Erreur: ${err.message}`);
                                }
                            });

                            server.listen(p, () => {
                                console.log(`\x1b[32m[Bhyra]\x1b[0m Serveur prêt sur \x1b[1mhttp://localhost:${p}\x1b[0m`);
                            });
                        };

                        startServer(port || 3000);
                        return null;
                    }
                };

                return {
                    "route": (m, p, cb) => serverObj.route(m, p, cb),
                    "ecouter": (p) => serverObj.ecouter(p)
                };
            }
        };
    }

    callBhyraCallback(func, args) {
        if (!func) return null;
        if (func.type === "BuiltIn") return func.fn(args);
        
        const previousEnv = this.env;
        const newEnv = new Environment(this.globalEnv);
        
        if (func.params) {
            func.params.forEach((param, i) => {
                newEnv.define(param, args[i]);
            });
        }

        this.env = newEnv;
        let result = null;
        try {
            for (const stmt of func.body) {
                this.evaluate(stmt);
            }
        } catch (e) {
            if (e instanceof ReturnValue) {
                result = e.value;
            } else {
                console.error("[Bhyra Callback Error]", e);
            }
        }
        this.env = previousEnv;
        return result;
    }

    evaluate(node) {
        try {
            switch (node.type) {
                case "Program":
                    for (const stmt of node.body) {
                        this.evaluate(stmt);
                    }
                    break;
                case "VariableDeclaration":
                    this.env.define(node.name, this.evaluate(node.value));
                    break;
                case "ExpressionStatement":
                    return this.evaluate(node.expression);
                case "PrintStatement":
                    const values = node.args.map(arg => this.evaluate(arg));
                    console.log(...values);
                    break;
                case "IfStatement":
                    if (this.evaluate(node.condition)) {
                        for (const stmt of node.consequent) {
                            this.evaluate(stmt);
                        }
                    } else if (node.alternate) {
                        for (const stmt of node.alternate) {
                            this.evaluate(stmt);
                        }
                    }
                    break;
                case "WhileStatement":
                    while (this.evaluate(node.condition)) {
                        for (const stmt of node.body) {
                            this.evaluate(stmt);
                        }
                    }
                    break;
                case "FunctionDeclaration":
                    if (node.name) {
                        this.functions[node.name] = node;
                    }
                    return node; // Return node for anonymous functions
                case "ReturnStatement":
                    throw new ReturnValue(this.evaluate(node.argument));
                case "CallExpression":
                    return this.callFunction(node.callee, node.args, node);
                case "BinaryExpression":
                    if (node.operator === ".") {
                        return this.evaluateMember(node);
                    }
                    return this.evaluateBinary(node);
                case "Literal":
                    return node.value;
                case "Identifier":
                    return this.env.get(node.name, node);
                case "ListLiteral":
                    return node.elements.map(el => this.evaluate(el));
                case "ObjectLiteral": {
                    const obj = {};
                    for (const pair of node.pairs) {
                        obj[pair.key] = this.evaluate(pair.value);
                    }
                    return obj;
                }
                case "MemberExpression": {
                    const obj = this.evaluate(node.object);
                    const idx = this.evaluate(node.property);
                    if (obj === undefined || obj === null) throw new Error(`[Ligne ${node.line}] Impossible d'accéder à une propriété de null/undefined`);
                    return obj[idx];
                }
                case "ClassDeclaration":
                    this.classes[node.name] = node;
                    break;
                case "NewExpression":
                    return this.instantiateClass(node.className, node);
                case "AssignmentExpression": {
                    const value = this.evaluate(node.right);
                    if (node.left.type === "Identifier") {
                        this.env.assign(node.left.name, value, node);
                    } else if (node.left.type === "MemberExpression") {
                        const obj = this.evaluate(node.left.object);
                        const property = this.evaluate(node.left.property);
                        if (obj === null || obj === undefined) throw new Error(`[Ligne ${node.line}] Impossible d'assigner à une propriété de null/undefined`);
                        obj[property] = value;
                    } else {
                        throw new Error(`[Ligne ${node.line}] Cible d'assignation invalide`);
                    }
                    return value;
                }
                case "ThrowStatement":
                    throw { type: "BhilalError", value: this.evaluate(node.argument), line: node.line };
                case "TryStatement": {
                    const previousEnv = this.env;
                    try {
                        for (const stmt of node.block) {
                            this.evaluate(stmt);
                        }
                    } catch (e) {
                        if (e instanceof ReturnValue) throw e;
                        if (node.handler) {
                            this.env = new Environment(previousEnv);
                            const errorValue = e.type === "BhilalError" ? e.value : e.message;
                            this.env.define(node.handler.param, errorValue);
                            for (const stmt of node.handler.body) {
                                this.evaluate(stmt);
                            }
                        } else if (!node.finalizer) {
                            throw e;
                        }
                    } finally {
                        if (node.finalizer) {
                            this.env = previousEnv;
                            for (const stmt of node.finalizer) {
                                this.evaluate(stmt);
                            }
                        }
                        this.env = previousEnv;
                    }
                    break;
                }
                case "UnaryExpression": {
                    const argument = this.evaluate(node.argument);
                    switch (node.operator) {
                        case "non": return !argument;
                        case "-": return -argument;
                        case "typeof": return typeof argument;
                        default: throw new Error(`[Ligne ${node.line}] Opérateur unaire inconnu: ${node.operator}`);
                    }
                }
                case "PourChaqueStatement": {
                    const iterable = this.evaluate(node.iterable);
                    const previousEnv = this.env;
                    
                    if (Array.isArray(iterable)) {
                        for (const item of iterable) {
                            this.env = new Environment(previousEnv);
                            this.env.define(node.variable, item);
                            for (const stmt of node.body) {
                                this.evaluate(stmt);
                            }
                        }
                    } else if (typeof iterable === 'object' && iterable !== null) {
                        for (const key in iterable) {
                            if (key.startsWith("__")) continue; // Skip internal properties
                            this.env = new Environment(previousEnv);
                            this.env.define(node.variable, key);
                            for (const stmt of node.body) {
                                this.evaluate(stmt);
                            }
                        }
                    }
                    this.env = previousEnv;
                    break;
                }
                case "IncludeStatement": {
                    const fs = require('fs');
                    const path = node.path;
                    const Lexer = require('./lexer');
                    const Parser = require('./parser');
                    try {
                        const code = fs.readFileSync(path, 'utf8');
                        const lexer = new Lexer(code);
                        const tokens = lexer.tokenize();
                        const parser = new Parser(tokens);
                        const ast = parser.parse();
                        this.evaluate(ast);
                    } catch (e) {
                        throw new Error(`[Ligne ${node.line}] Erreur lors de l'inclusion de '${path}': ${e.message}`);
                    }
                    break;
                }
            }
        } catch (e) {
            if (e instanceof ReturnValue || e.type === "BhilalError") throw e;
            if (e.message && !e.message.startsWith("[")) {
                e.message = `[Ligne ${node.line}, Col ${node.column}] ${e.message}`;
            }
            throw e;
        }
    }

    callFunction(name, args, node) {
        const func = this.functions[name];
        if (!func) throw new Error(`[Ligne ${node.line}] Fonction non définie: ${name}`);

        const evaluatedArgs = args.map(arg => this.evaluate(arg));

        if (func.type === "BuiltIn") {
            return func.fn(evaluatedArgs);
        }

        const previousEnv = this.env;
        const newEnv = new Environment(this.globalEnv);
        
        args.forEach((arg, i) => {
            newEnv.define(func.params[i], evaluatedArgs[i]);
        });

        this.env = newEnv;
        let result = null;
        try {
            for (const stmt of func.body) {
                this.evaluate(stmt);
            }
        } catch (e) {
            if (e instanceof ReturnValue) {
                result = e.value;
            } else {
                throw e;
            }
        }
        this.env = previousEnv;
        return result;
    }

    instantiateClass(name, node) {
        const cls = this.classes[name];
        if (!cls) throw new Error(`[Ligne ${node.line}] Classe non définie: ${name}`);
        if (cls.isAbstract) throw new Error(`[Ligne ${node.line}] Impossible d'instancier la classe abstraite: ${name}`);
        
        const instance = { 
            __class__: name,
            __privateMethods__: []
        };
        const methods = this.getAllMethods(name);
        
        methods.forEach(method => {
            if (method.visibility === "prive") {
                instance.__privateMethods__.push(method.name);
            }
            instance[method.name] = (...args) => {
                return this.callMethod(method, args, instance);
            };
        });
        return instance;
    }

    getAllMethods(className) {
        const cls = this.classes[className];
        if (!cls) return [];
        
        let methods = [];
        if (cls.superClassName) {
            methods = this.getAllMethods(cls.superClassName);
        }
        
        // Add or override with current class methods
        cls.methods.forEach(method => {
            if (method.type === "FunctionDeclaration") {
                // Find and replace if exists, otherwise push
                const existingIndex = methods.findIndex(m => m.name === method.name);
                if (existingIndex !== -1) {
                    methods[existingIndex] = method;
                } else {
                    methods.push(method);
                }
            }
        });
        
        return methods;
    }

    callMethod(methodNode, args, instance) {
        const previousEnv = this.env;
        const newEnv = new Environment(this.globalEnv);
        newEnv.define("ceci", instance);
        methodNode.params.forEach((param, i) => {
            newEnv.define(param, args[i]);
        });
        this.env = newEnv;
        let result = null;
        try {
            for (const stmt of methodNode.body) {
                this.evaluate(stmt);
            }
        } catch (e) {
            if (e instanceof ReturnValue) {
                result = e.value;
            } else {
                throw e;
            }
        }
        this.env = previousEnv;
        return result;
    }

    evaluateMember(node) {
        const left = this.evaluate(node.left);
        const rightLabel = node.right.name || node.right.callee;
        
        if (left === undefined || left === null) throw new Error(`[Ligne ${node.line}] Impossible d'accéder à '${rightLabel}' de null/undefined`);

        // Encapsulation check
        if (left.__privateMethods__ && left.__privateMethods__.includes(rightLabel)) {
            let currentCeci = null;
            try { currentCeci = this.env.get("ceci", node); } catch (e) {}
            if (currentCeci !== left) {
                throw new Error(`[Ligne ${node.line}] La méthode '${rightLabel}' est privée et ne peut être accédée de l'extérieur.`);
            }
        }

        if (typeof left[rightLabel] === 'function') {
            if (node.right.type === "CallExpression") {
                const args = node.right.args.map(arg => this.evaluate(arg));
                return left[rightLabel](...args);
            }
        }
        return left[rightLabel];
    }

    evaluateBinary(node) {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        switch (node.operator) {
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            case "/": 
                if (right === 0) throw new Error(`[Ligne ${node.line}] Division par zéro`);
                return left / right;
            case "==": return left === right;
            case "!=": return left !== right;
            case "<": return left < right;
            case ">": return left > right;
            case "<=": return left <= right;
            case ">=": return left >= right;
            case "et": return left && right;
            case "ou": return left || right;
        }
    }
}

module.exports = Evaluator;
