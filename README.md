# Bhyra Framework (CLI)

Package npm pour lancer Bhilal et creer rapidement une app Bhyra.

## Ce que fournit ce package

- `bhyra` : CLI framework (init + lancement auto)
- `bhilal` : CLI interpreteur Bhilal
- Runtime frontend Bhyra : `language/tools/bhyra.js`

## Prerequis

- Node.js `>= 14`
- npm
- Go (recommande) pour les outils reseau/securite compiles via le script d'installation

## Installation

```bash
sudo npm install -g bhyra
```

## Commandes principales

### Initialiser un projet

```bash
bhyra init mon-app
```

Tu peux aussi passer un chemin:

```bash
bhyra init apps/mon-app
```

Structure generee:

- `backend/server.bh`
- `frontend/index.html`
- `frontend/style.css`

### Lancer le projet

Depuis le dossier projet:

```bash
bhyra
```

Le CLI cherche automatiquement, dans cet ordre:

1. `app.bh`
2. `index.bh`
3. `backend/server.bh`

Tu peux aussi cibler un fichier:

```bash
bhyra backend/server.bh
```

## Utiliser Bhilal directement

```bash
bhilal mon_script.bh
bhilal --version
```

## Notes importantes

- Le serveur genere sert `frontend/index.html`, `frontend/style.css` et le runtime `/bhyra.js`.
- Si des dependances manquent, lance `npm install` dans ton environnement package.
- Le script d'installation peut compiler des outils Go; sans Go, certaines fonctions reseau/securite peuvent etre indisponibles.

## Fichiers utiles

- `bin/bhyra.js` : CLI framework
- `bin/bhilal-cli.js` : CLI interpreteur
- `language/bhilal.js` : interpreteur principal
- `language/tools/bhyra.js` : runtime frontend
