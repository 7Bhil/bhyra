#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
console.log("DEBUG ARGS:", args);

// Fonction pour trouver le chemin correct (support dev local vs npm install)
function findPath(relativePath) {
    let p = path.join(__dirname, relativePath);
    if (fs.existsSync(p)) return p;
    // Fallback: peut-être installé différemment ou structure modifiée
    return p;
}

// Commande: bhilal bhyra ...
if (args[0] === 'bhyra') {
    // Délègue à l'outil CLI Bhyra
    // En global (npm install -g), bhyra.js est dans le même dossier 'bin'
    let bhyraPath = path.join(__dirname, 'bhyra.js');
    
    // En dev local, c'est parfois différent
    if (!fs.existsSync(bhyraPath)) {
         bhyraPath = path.join(__dirname, '..', 'bin', 'bhyra.js');
    }

    if (!fs.existsSync(bhyraPath)) {
        console.error(`\x1b[31m[Bhilal]\x1b[0m Erreur critique: Impossible de trouver bhyra.js dans ${__dirname}`);
        process.exit(1);
    }
    const bhyraArgs = args.slice(1); // Enlève 'bhyra'
    
    const proc = spawn('node', [bhyraPath, ...bhyraArgs], {
        stdio: 'inherit',
        env: process.env
    });
    
    proc.on('close', (code) => {
        process.exit(code);
    });
} else {
    // Lance l'interpréteur Bhilal standard
    // On suppose que bhilal.js est dans ../language/bhilal.js par rapport à bin/
    const bhilalPath = path.join(__dirname, '..', 'language', 'bhilal.js');
    
    const proc = spawn('node', [bhilalPath, ...args], {
        stdio: 'inherit',
        env: process.env
    });
    
    proc.on('close', (code) => {
        process.exit(code);
    });
}
