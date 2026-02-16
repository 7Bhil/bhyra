# Bhyra ⚡️

> Le framework web fullstack en langage **Bhilal**.

**Bhyra** est un framework moderne conçu pour créer des applications web complètes (Frontend + Backend) en utilisant uniquement le langage [Bhilal](https://github.com/bhilal-lang/bhilal).

## 🚀 Installation

Installez Bhyra globalement via NPM :

```bash
npm install -g bhilal
```

*(Note: Bhyra est inclus dans le paquet principal Bhilal)*

## 🎮 Démarrage Rapide

Créez un nouveau projet en **2 secondes** :

```bash
bhyra init
```

Cela génère un fichier `app.bh` prêt à l'emploi. Lancez-le ensuite avec :

```bash
bhyra
```

Ouvrez votre navigateur sur `http://localhost:3000` et profitez ! ✨

## 💡 Fonctionnalités

### 1. Serveur Web Intégré
Plus besoin d'Express ou d'Apache. Créez un serveur en 3 lignes :

```bhilal
soit srv = creer_serveur()

srv.route("GET", "/", fonction(req, res) {
    res.envoyer("<h1>Bonjour le monde !</h1>")
})

srv.ecouter(3000)
```

### 2. Frontend en Bhilal
Écrivez du code interactif directement dans vos pages HTML via `<script type="text/bhilal">`.

- `selectionne(selecteur)` : Comme `document.querySelector`
- `ecouter(element, event, callback)` : Gestion des événements
- `contenu(element, texte)` : Modifie le HTML
- `css(element, prop, valeur)` : Modifie le style

### 3. Port Intelligent
Si le port 3000 est pris, Bhyra passe automatiquement au 3001, 3002, etc. fini les erreurs `EADDRINUSE` !

## 📦 Structure du Projet

```text
mon-projet/
├── app.bh          # Votre application (Serveur + Logique Client)
└── bhyra.js        # (Généré par le serveur) Runtime client
```

## 🤝 Contribuer

Bhyra est open-source. Les contributions sont les bienvenues !

Licence MIT. Créé avec ❤️ par l'équipe Bhilal.
