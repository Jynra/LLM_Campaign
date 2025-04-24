# Site de Jeu de Rôle avec LLM comme Maître du Jeu

Ce projet est une application web permettant de jouer à des jeux de rôle où un modèle de langage (LLM) agit comme Maître du Jeu. L'application offre une interface de chat interactive où les joueurs peuvent communiquer entre eux et avec le Maître du Jeu IA.

## Fonctionnalités

- Interface de chat en temps réel pour les interactions entre joueurs et le MJ
- Intégration avec un LLM (Claude, GPT, etc.) qui joue le rôle de Maître du Jeu
- Système de jets de dés intégré
- Gestion de plusieurs joueurs et personnages
- Campagnes persistantes avec historique des messages
- Communication en temps réel via WebSockets

## Structure du Projet

```
roleplay-llm-site/
├── public/               # Fichiers statiques
│   ├── index.html        # Page principale
│   ├── css/              # Feuilles de style
│   │   └── styles.css    # Styles principaux
│   └── js/               # Scripts côté client
│       ├── config.js     # Configuration
│       ├── models.js     # Classes de données
│       ├── chat.js       # Gestion du chat
│       ├── ui.js         # Interface utilisateur
│       ├── api.js        # Communication avec l'API
│       ├── socket.js     # WebSockets
│       └── main.js       # Point d'entrée
├── server/               # Backend
│   ├── app.js            # Serveur Express
│   ├── llm_client.js     # Client pour l'API LLM
│   └── game_service.js   # Gestion des jeux
├── package.json          # Dépendances
├── .env.example          # Variables d'environnement (exemple)
└── README.md             # Documentation
```

## Installation

1. Clonez ce dépôt :
   ```
   git clone https://github.com/votre-username/roleplay-llm-site.git
   cd roleplay-llm-site
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Configurez l'environnement :
   ```
   cp .env.example .env
   ```
   Modifiez le fichier `.env` pour configurer votre clé API LLM et autres paramètres.

4. Lancez l'application :
   ```
   npm start
   ```

5. Accédez à l'application dans votre navigateur :
   ```
   http://localhost:3000
   ```

## Configuration du LLM

Par défaut, l'application est configurée pour utiliser l'API Claude d'Anthropic. Vous pouvez changer cette configuration pour utiliser d'autres modèles en modifiant les paramètres dans le fichier `.env` :

```
LLM_API_URL=https://api.anthropic.com/v1/messages
LLM_API_KEY=your_api_key_here
LLM_MODEL=claude-3-opus-20240229
```

## Mode de développement

Pour lancer l'application en mode développement avec rechargement automatique :

```
npm run dev
```

## Personnalisation

### Thèmes et styles

Les styles peuvent être modifiés dans le fichier `public/css/styles.css`. L'application utilise des variables CSS pour faciliter la personnalisation des couleurs et autres propriétés visuelles.

### Prompts du Maître du Jeu

Vous pouvez personnaliser la façon dont le Maître du Jeu répond en modifiant la fonction `createDMPrompt` dans le fichier `server/llm_client.js`.

## Licence
