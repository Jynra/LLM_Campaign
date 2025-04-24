# Site de Jeu de Rôle avec Ollama

Ce projet est une application web pour jouer à des jeux de rôle avec un modèle de langage (LLM) comme Maître du Jeu. Cette version utilise un serveur HTTP Python simple qui fait également office de proxy vers Ollama.

## Caractéristiques principales

- Interface de chat interactive pour jouer à des jeux de rôle
- Communication avec Ollama pour générer les réponses du Maître du Jeu
- Système de jets de dés intégré
- Stockage local des conversations pour ne pas perdre vos parties
- Mode hors ligne avec réponses prédéfinies si Ollama n'est pas disponible
- Responsive design pour utilisation sur ordinateur, tablette ou mobile

## Structure du projet

```
roleplay-llm-site/
├── public/               # Fichiers statiques servis par le serveur Python
│   ├── index.html        # Page principale
│   ├── css/              # Feuilles de style
│   │   └── styles.css    # Styles CSS
│   └── js/               # Scripts JavaScript
│       ├── config.js     # Configuration globale
│       ├── models.js     # Classes de données
│       ├── api.js        # Communication avec Ollama
│       ├── chat.js       # Gestion du chat
│       ├── ui.js         # Interface utilisateur
│       └── main.js       # Point d'entrée
├── Dockerfile            # Configuration Docker pour Python
├── proxy.py              # Serveur Python avec proxy vers Ollama
└── docker_install.sh     # Script d'installation
```

## Installation avec Docker

1. Assurez-vous que Docker est installé sur votre machine
2. Clonez ce dépôt :
   ```
   git clone https://github.com/votre-nom/roleplay-llm-site.git
   cd roleplay-llm-site
   ```
3. Rendez le script d'installation exécutable :
   ```
   chmod +x docker_install.sh
   ```
4. Lancez le script d'installation :
   ```
   ./docker_install.sh
   ```
5. Accédez à l'application dans votre navigateur :
   ```
   http://localhost:9428
   ```

## Installation sans Docker (développement local)

1. Assurez-vous que Python 3 est installé sur votre machine
2. Installez les dépendances Python :
   ```
   pip install requests
   ```
3. Lancez le serveur Python :
   ```
   python proxy.py
   ```
4. Accédez à l'application dans votre navigateur :
   ```
   http://localhost:9428
   ```

## Configuration d'Ollama

### Prérequis
- Ollama doit être installé et en cours d'exécution sur votre machine ou dans un conteneur Docker accessible
- Un modèle de langage (par défaut "mistral") doit être téléchargé dans Ollama

### Où doit s'exécuter Ollama
Cette application est configurée pour accéder à Ollama via l'URL `http://host.docker.internal:11434` depuis le conteneur Docker. Cela signifie qu'Ollama doit être exécuté :
- Sur votre machine locale (l'hôte Docker) au port 11434 (port par défaut)
- OU dans un autre conteneur Docker accessible via réseau

Si Ollama s'exécute ailleurs, vous devrez modifier l'URL dans le fichier `proxy.py`.

### Modèles Ollama supportés
Tous les modèles disponibles dans votre instance Ollama sont supportés. Vous pouvez sélectionner le modèle à utiliser directement dans l'interface utilisateur.

## Utilisation

1. Lancez votre instance Ollama (si ce n'est pas déjà fait)
2. Démarrez l'application avec Docker ou en lançant `proxy.py`
3. Sélectionnez un personnage en cliquant sur son nom dans la barre latérale
4. Commencez à jouer en envoyant des messages dans le chat
5. Utilisez le bouton de dés pour lancer des jets de dés quand nécessaire

## Mode hors ligne

Si Ollama n'est pas disponible, l'application passe automatiquement en mode démo avec des réponses prédéfinies. Cela vous permet de tester l'interface sans avoir Ollama installé.

## Personnalisation

### Changer les couleurs et le style
Vous pouvez modifier les variables CSS dans le fichier `public/css/styles.css` pour changer les couleurs et l'apparence de l'application.

### Ajouter des personnages
Modifiez la liste des joueurs dans le fichier `public/js/ui.js` pour ajouter ou modifier les personnages disponibles.

### Changer les réponses de démo
Les réponses prédéfinies utilisées en mode démo peuvent être modifiées dans le fichier `public/js/api.js`.

## Structure des fichiers

### proxy.py
Ce fichier contient le serveur HTTP Python qui :
1. Sert les fichiers statiques de l'application
2. Agit comme un proxy pour les requêtes vers Ollama
3. Gère les problèmes de CORS

### Dockerfile
Configure une image Docker basée sur Python Alpine qui :
1. Copie les fichiers nécessaires dans l'image
2. Installe les dépendances requises
3. Expose le port 9428
4. Lance le serveur Python

### docker_install.sh
Script shell qui automatise le processus de construction et d'exécution du conteneur Docker.