const fs = require('fs');
const Lexer = require('./lexer');
const Parser = require('./parser');
const Evaluator = require('./evaluator');
let readline = null;
try {
    readline = require('readline-sync');
} catch (e) {}

const evaluator = new Evaluator();

function runCode(code, name = "repl") {
    try {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        evaluator.evaluate(ast);
    } catch (error) {
        console.error("Erreur:", error.message);
    }
}

const filePath = process.argv[2];

// Check version
if (filePath === '--version' || filePath === '-v') {
    const packageJson = require('../package.json');
    console.log(`Bhilal v${packageJson.version}`);
    process.exit(0);
}

// Fallback: Si 'bhyra' est passé comme argument (problème de symlink npm)
if (filePath === 'bhyra') {
    // On passe le relais à bin/bhyra.js
    // On ajuste process.argv pour le script appelé
    process.argv.splice(2, 1); // Enlève 'bhyra'
    const path = require('path');
    const bhyraToolPath = path.resolve(__dirname, '..', 'bin', 'bhyra.js');
    
    if (fs.existsSync(bhyraToolPath)) {
        try {
            require(bhyraToolPath);
            return; 
        } catch (err) {
            console.error("Erreur chargement outil Bhyra (fallback):", err);
            process.exit(1);
        }
    } else {
        console.error("Erreur critique: Outil Bhyra introuvable à:", bhyraToolPath);
        process.exit(1);
    }
}

if (!filePath) {
    if (!readline) {
        console.error("Erreur: le mode REPL nécessite 'readline-sync'.");
        console.error("Exécutez un fichier .bh, ou installez la dépendance manquante.");
        process.exit(1);
    }
    console.log("--- Bhilal Interactive REPL ---");
    console.log("Tapez 'quitter' pour sortir.");
    while (true) {
        const input = readline.question("Bhilal> ");
        if (input.toLowerCase() === 'quitter') break;
        if (input.trim() === '') continue;
        runCode(input);
    }
    process.exit(0);
}

try {
    const code = fs.readFileSync(filePath, 'utf8');
    runCode(code, filePath);
} catch (error) {
    console.error("Erreur critique:", error.message);
}
