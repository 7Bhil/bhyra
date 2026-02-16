#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Détermine le chemin vers l'interpréteur Bhilal
// On suppose que ce script est dans bin/ et que bhilal.js est dans language/
// Structure NPM : node_modules/bhyra/bin/bhyra.js -> node_modules/bhyra/language/bhilal.js
let bhilalPath = path.join(__dirname, '..', 'language', 'bhilal.js');

// Fallback pour le développement local si le chemin diffère
if (!fs.existsSync(bhilalPath)) {
    bhilalPath = path.join(__dirname, '..', 'bhilal.js');
}

const args = process.argv.slice(2);

// Commande: bhyra init [nom_projet]
if (args[0] === 'init') {
    const projectName = args[1];
    
    if (!projectName) {
        console.error(`\x1b[31m[Bhyra CLI]\x1b[0m Erreur: Veuillez spécifier un nom de projet.`);
        console.log(`\x1b[36mUsage:\x1b[0m bhyra init \x1b[1mmon-super-projet\x1b[0m`);
        process.exit(1);
    }

    const projectPath = path.join(process.cwd(), projectName);
    
    if (fs.existsSync(projectPath)) {
        console.error(`\x1b[31m[Bhyra CLI]\x1b[0m Erreur: Le dossier '${projectName}' existe déjà.`);
        process.exit(1);
    }

    // Création de l'architecture
    console.log(`\x1b[36m[Bhyra CLI]\x1b[0m Création du projet \x1b[1m${projectName}\x1b[0m...`);
    fs.mkdirSync(projectPath);
    fs.mkdirSync(path.join(projectPath, 'backend'));
    fs.mkdirSync(path.join(projectPath, 'frontend'));

    // --- Backend: server.bh ---
    const serverCode = `# Serveur Bhyra pour ${projectName}

soit srv = creer_serveur()

# Route principale: Sert la page d'accueil
srv.route("GET", "/", fonction(req, res) {
    res.rendre("../frontend/index.html")
})

# Route CSS
srv.route("GET", "/style.css", fonction(req, res) {
    res.rendre("../frontend/style.css")
})

# Route Runtime Bhyra (Nécessaire pour le frontend)
srv.route("GET", "/bhyra.js", fonction(req, res) {
    # Astuce: On sert le runtime inclus avec le framework
    res.rendre("${path.join(__dirname, '..', 'language', 'tools', 'bhyra.js')}")
})

# Favicon (pour éviter 404)
srv.route("GET", "/favicon.ico", fonction(req, res) { res.statut(204).envoyer("") })

# Démarrage
srv.ecouter(3000)
`;
    fs.writeFileSync(path.join(projectPath, 'backend', 'server.bh'), serverCode);

    // --- Frontend: index.html ---
    const htmlCode = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - Bhyra App</title>
    <link rel="stylesheet" href="/style.css">
    <script src="/bhyra.js"></script>
</head>
<body>
    <div class="container">
        <h1>Bienvenue sur ${projectName} 🚀</h1>
        <p>Propulsé par <span class="highlight">Bhyra Framework</span></p>
        
        <div class="card">
            <button id="btn-action">Clique-moi !</button>
            <p id="feedback"></p>
        </div>
        
        <footer>
            Modifiez <code class="path">backend/server.bh</code> ou <code class="path">frontend/index.html</code>
        </footer>
    </div>

    <!-- Logique Client en Bhilal -->
    <script type="text/bhilal">
        soit btn = selectionne('#btn-action')
        soit feedback = selectionne('#feedback')
        soit compte = 0

        ecouter(btn, 'click', fonction() {
            compte = compte + 1
            contenu(feedback, 'Bravo ! Tu as cliqué ' + compte + ' fois.')
            css(feedback, 'color', '#6c5ce7')
            css(feedback, 'font-weight', 'bold')
        })
    </script>
</body>
</html>`;
    fs.writeFileSync(path.join(projectPath, 'frontend', 'index.html'), htmlCode);

    // --- Frontend: style.css ---
    const cssCode = `body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f8f9fa;
    color: #2d3436;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}
.container {
    text-align: center;
}
h1 {
    color: #2d3436;
    margin-bottom: 0.5rem;
}
.highlight {
    color: #6c5ce7;
    font-weight: bold;
}
.card {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    margin: 2rem 0;
}
button {
    background: #6c5ce7;
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}
button:hover {
    background: #5649c0;
    transform: translateY(-2px);
}
button:active {
    transform: translateY(0);
}
.path {
    background: #dfe6e9;
    padding: 2px 5px;
    border-radius: 4px;
    font-family: monospace;
}
footer {
    color: #636e72;
    font-size: 0.9rem;
}
`;
    fs.writeFileSync(path.join(projectPath, 'frontend', 'style.css'), cssCode);

    console.log(`\x1b[32m[Bhyra CLI]\x1b[0m ✨ Projet initialisé avec succès dans \x1b[1m${projectName}/\x1b[0m`);
    console.log(`\x1b[36m[Bhyra CLI]\x1b[0m Pour démarrer :`);
    console.log(`  cd ${projectName}`);
    console.log(`  bhilal bhyra`); // Ou juste 'bhyra'
    process.exit(0);
}

let targetFile = args[0];

// Mode par défaut : recherche automatique intelligente
if (!targetFile) {
    // 1. Cherche dans le dossier courant
    if (fs.existsSync('app.bh')) targetFile = 'app.bh';
    else if (fs.existsSync('index.bh')) targetFile = 'index.bh';
    
    // 2. Cherche dans backend/server.bh (structure recommandée)
    else if (fs.existsSync(path.join('backend', 'server.bh'))) {
        targetFile = path.join('backend', 'server.bh');
    }
}

if (!targetFile) {
    console.error(`\x1b[31m[Bhyra CLI]\x1b[0m Erreur: Aucun fichier .bh trouvé.`);
    console.log(`\x1b[34m[Aide]\x1b[0m Utilisez \x1b[1mbhyra init\x1b[0m pour créer un projet, ou spécifiez un fichier : \x1b[1mbhyra mon_script.bh\x1b[0m`);
    process.exit(1);
}

if (!fs.existsSync(targetFile)) {
    console.error(`\x1b[31m[Bhyra CLI]\x1b[0m Erreur: Fichier '${targetFile}' non trouvé.`);
    process.exit(1);
}

console.log(`\x1b[36m[Bhyra CLI]\x1b[0m Lancement de \x1b[1m${targetFile}\x1b[0m...`);

const proc = spawn('node', [bhilalPath, targetFile], {
    stdio: 'inherit',
    env: process.env
});

proc.on('close', (code) => {
    process.exit(code);
});
