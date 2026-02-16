#!/usr/bin/env node

/**
 * Bhilal Auto-Installer
 * Vérifie et installe automatiquement Node.js et Go si nécessaire
 * Compile les outils de cybersécurité Go
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  
  switch(type) {
    case 'success':
      console.log(`${colors.green}${prefix} ✓ ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}${prefix} ⚠ ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}${prefix} ✗ ${message}${colors.reset}`);
      break;
    case 'info':
    default:
      console.log(`${colors.blue}${prefix} ℹ ${message}${colors.reset}`);
  }
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getNodeVersion() {
  try {
    return execSync('node --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

function getGoVersion() {
  try {
    return execSync('go version', { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

function installGo() {
  const platform = os.platform();
  
  log('Installation de Go...', 'warning');
  
  try {
    if (platform === 'linux') {
      // Détection de la distribution
      let installCmd;
      
      if (fs.existsSync('/etc/debian_version') || fs.existsSync('/etc/ubuntu-release')) {
        // Debian/Ubuntu
        log('Distribution détectée: Debian/Ubuntu', 'info');
        installCmd = 'sudo apt update && sudo apt install -y golang-go';
      } else if (fs.existsSync('/etc/fedora-release') || fs.existsSync('/etc/redhat-release')) {
        // Fedora/RHEL/CentOS
        log('Distribution détectée: Fedora/RHEL', 'info');
        installCmd = 'sudo dnf install -y golang';
      } else if (fs.existsSync('/etc/arch-release')) {
        // Arch Linux
        log('Distribution détectée: Arch Linux', 'info');
        installCmd = 'sudo pacman -S --noconfirm go';
      } else {
        // Fallback: téléchargement direct
        log('Distribution non reconnue, tentative d\'installation via snap...', 'warning');
        installCmd = 'sudo snap install go --classic';
      }
      
      log(`Exécution: ${installCmd}`, 'info');
      execSync(installCmd, { stdio: 'inherit' });
      
    } else if (platform === 'darwin') {
      // macOS
      if (checkCommand('brew')) {
        log('Installation via Homebrew...', 'info');
        execSync('brew install go', { stdio: 'inherit' });
      } else {
        log('Homebrew non trouvé. Veuillez installer Go manuellement:', 'error');
        log('https://golang.org/doc/install', 'info');
        process.exit(1);
      }
      
    } else if (platform === 'win32') {
      // Windows
      log('Windows détecté.', 'warning');
      log('Veuillez installer Go depuis: https://golang.org/dl/', 'info');
      log('Puis relancez: npm install', 'info');
      process.exit(1);
    }
    
    log('Go installé avec succès!', 'success');
    return true;
    
  } catch (error) {
    log(`Erreur lors de l'installation de Go: ${error.message}`, 'error');
    return false;
  }
}

function compileGoTools() {
  const toolsDir = path.join(__dirname, '..', 'tools');
  const tools = ['portscanner', 'dirbuster', 'dns_resolver', 'subnet_scanner', 'http_client'];
  
  log('Compilation des outils de cybersécurité Go...', 'info');
  
  let compiled = 0;
  let failed = 0;
  
  for (const tool of tools) {
    const goFile = path.join(toolsDir, `${tool}.go`);
    const binaryFile = path.join(toolsDir, tool);
    
    // Vérifier si le binaire existe déjà et est à jour
    if (fs.existsSync(binaryFile) && fs.existsSync(goFile)) {
      const binaryStat = fs.statSync(binaryFile);
      const goStat = fs.statSync(goFile);
      
      if (binaryStat.mtime > goStat.mtime) {
        log(`${tool}: Binaire existant à jour ✓`, 'success');
        compiled++;
        continue;
      }
    }
    
    if (!fs.existsSync(goFile)) {
      log(`${tool}: Fichier source manquant`, 'error');
      failed++;
      continue;
    }
    
    try {
      log(`${tool}: Compilation...`, 'info');
      execSync(`go build -o ${tool} ${tool}.go`, {
        cwd: toolsDir,
        stdio: 'pipe'
      });
      log(`${tool}: Compilé avec succès ✓`, 'success');
      compiled++;
    } catch (error) {
      log(`${tool}: Échec de la compilation ✗`, 'error');
      failed++;
    }
  }
  
  log(`Compilation terminée: ${compiled}/${tools.length} outils prêts`, compiled === tools.length ? 'success' : 'warning');
  
  return failed === 0;
}

function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  log(`Node.js version détectée: ${version}`, 'info');
  
  if (majorVersion < 14) {
    log('Node.js 14+ requis. Version actuelle trop ancienne.', 'error');
    log('Veuillez mettre à jour Node.js: https://nodejs.org/', 'warning');
    return false;
  }
  
  log('Node.js version OK ✓', 'success');
  return true;
}

function printBanner() {
  console.log(`
${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   💎 BHILAL LANGUAGE - Installation Automatique              ║
║                                                               ║
║   Langage de programmation français + Outils de sécurité     ║
║   Architecture hybride: Node.js + Go                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
`);
}

function printSuccess() {
  console.log(`
${colors.green}${colors.bright}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✓ BHILAL est prêt à l'emploi !                             ║
║                                                               ║
║   Commandes disponibles:                                      ║
║     bhilal mon_script.bh    → Exécuter un script            ║
║     bhilal                    → Mode interactif (REPL)         ║
║                                                               ║
║   Fonctions de sécurité disponibles:                          ║
║     scan_ports(host, ports)   → Scan de ports TCP              ║
║     dirbuster(url)            → Brute force répertoires web    ║
║     dns_resolve(hostname)     → Résolution DNS               ║
║     dns_bruteforce(domain)    → Brute force sous-domaines      ║
║     subnet_scan(cidr)         → Scan réseau CIDR             ║
║     requete_http(url)         → Requêtes HTTP/HTTPS          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
`);
}

async function main() {
  printBanner();
  
  // Vérifier Node.js
  log('Vérification de Node.js...', 'info');
  if (!checkNodeVersion()) {
    process.exit(1);
  }
  
  // Vérifier Go
  log('Vérification de Go...', 'info');
  let goVersion = getGoVersion();
  
  if (!goVersion) {
    log('Go non trouvé', 'warning');
    const installed = installGo();
    if (!installed) {
      log('Impossible d\'installer Go automatiquement', 'error');
      log('Veuillez installer Go manuellement: https://golang.org/doc/install', 'info');
      process.exit(1);
    }
    goVersion = getGoVersion();
  }
  
  log(`Go version: ${goVersion}`, 'success');
  
  // Compiler les outils Go
  const toolsReady = compileGoTools();
  
  if (!toolsReady) {
    log('Certains outils n\'ont pas pu être compilés', 'warning');
    log('Bhilal fonctionnera mais certaines fonctions de sécurité seront indisponibles', 'warning');
  }
  
  // Vérifier readline-sync
  log('Vérification des dépendances npm...', 'info');
  try {
    require('readline-sync');
    log('readline-sync OK ✓', 'success');
  } catch {
    log('Installation de readline-sync...', 'info');
    try {
      execSync('npm install readline-sync', { stdio: 'inherit' });
      log('readline-sync installé ✓', 'success');
    } catch {
      log('Impossible d\'installer readline-sync', 'warning');
    }
  }
  
  printSuccess();
  
  // Créer un fichier .bhilal-installed pour marquer l'installation
  const installMarker = path.join(__dirname, '..', '.bhilal-installed');
  fs.writeFileSync(installMarker, new Date().toISOString());
  
  log('Installation terminée!', 'success');
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { main, checkCommand, compileGoTools };
