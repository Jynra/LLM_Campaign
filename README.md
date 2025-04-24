# LLM Campaign - Application de Jeu de Rôle avec IA

Cette application web permet de jouer à des jeux de rôle où un modèle de langage (LLM) tient le rôle du Maître du Jeu. Elle utilise une interface web alimentée par un serveur Python qui fait office de proxy vers des services LLM comme Ollama.

<!-- ![Roleplay avec IA](https://via.placeholder.com/800x400?text=Roleplay+avec+IA) -->

## Fonctionnalités

✨ **Interface immersive** - Chat interactif pour des aventures narratives captivantes  
🎲 **Système de dés intégré** - Lancez des dés virtuels pour résoudre les actions  
🤖 **IA comme Maître du Jeu** - Utilise Ollama pour générer des réponses contextuelles  
💾 **Sauvegarde locale** - Conservation des parties entre les sessions  
📱 **Design adaptatif** - Fonctionne sur ordinateur, tablette ou smartphone  
🌐 **Mode hors-ligne** - Réponses de démonstration si Ollama n'est pas disponible

## Architecture du projet

```
LLM_Campaign/
├── public/               # Fichiers statiques pour l'interface web
│   ├── index.html        # Page principale
│   ├── css/              # Styles CSS
│   │   └── styles.css    # Feuille de style principale
│   └── js/               # Scripts JavaScript
│       ├── config.js     # Configuration globale
│       ├── models.js     # Modèles de données
│       ├── api.js        # Communication avec Ollama
│       ├── chat.js       # Gestion des conversations
│       ├── ui.js         # Interface utilisateur
│       └── main.js       # Point d'entrée
├── proxy.py              # Serveur HTTP Python avec proxy vers Ollama
├── Dockerfile            # Configuration pour l'image Docker
└── docker_install.sh     # Script d'installation automatisée
```

## Configuration requise

- Docker (pour l'installation avec conteneur)
- OU Python 3.x (pour l'installation locale)
- Instance Ollama fonctionnelle (optionnel, mode démo disponible)

## Installation et démarrage

### Avec Docker (recommandé)

1. Clonez le dépôt et accédez au répertoire du projet :
   ```bash
   git clone https://github.com/votre-nom/LLM_Campaign.git
   cd LLM_Campaign
   ```

2. Rendez le script d'installation exécutable :
   ```bash
   chmod +x docker_install.sh
   ```

3. Exécutez le script d'installation :
   ```bash
   ./docker_install.sh
   ```

4. Accédez à l'application dans votre navigateur :
   ```
   http://localhost:9425
   ```

### Sans Docker (développement local)

1. Assurez-vous que Python 3 est installé

2. Installez les dépendances requises :
   ```bash
   pip install requests
   ```

3. Lancez le serveur Python :
   ```bash
   python proxy.py
   ```

4. Accédez à l'application dans votre navigateur :
   ```
   http://localhost:9425
   ```

## Configuration d'Ollama

### Prérequis
- Ollama installé et en cours d'exécution
- Au moins un modèle de langage téléchargé dans Ollama (ex: gemma3:4b, mistral, etc.)

### Configuration réseau
Par défaut, l'application est configurée pour se connecter à Ollama à l'adresse `http://172.17.0.8:11434`. 

Si votre instance Ollama se trouve ailleurs :
1. Modifiez la variable `OLLAMA_URL` dans le fichier `proxy.py`
2. Redémarrez le serveur

## Utilisation de l'application

1. **Démarrage** : Une fenêtre de bienvenue vous explique le fonctionnement de base
2. **Sélection du personnage** : Cliquez sur un nom dans la barre latérale
3. **Sélection du modèle** : Choisissez un modèle Ollama dans le menu déroulant
4. **Interaction** : Écrivez vos actions dans la zone de texte et utilisez les boutons :
   - 🎲 Pour lancer des dés
   - 🗺️ Pour afficher une carte (fonctionnalité future)
   - 🗑️ Pour effacer la conversation
   - ⚙️ Pour les paramètres (fonctionnalité future)

## Personnalisation

### Interface graphique
Modifiez les variables dans `public/css/styles.css` pour changer l'apparence :

```css
:root {
    --primary-color: #4a4e69;
    --secondary-color: #22223b;
    --accent-color: #9a8c98;
    --light-color: #f2e9e4;
    --dark-color: #22223b;
}
```

### Personnages et campagne
Personnalisez les personnages et les informations de campagne dans `public/js/ui.js` et `public/js/api.js`.

### Prompt du Maître du Jeu
Pour ajuster le comportement du LLM comme Maître du Jeu, modifiez la fonction `createDMPrompt` dans `public/js/api.js`.

## Dépannage

### Ollama non détecté
Si Ollama n'est pas détecté :
1. Vérifiez que Ollama est en cours d'exécution
2. Contrôlez l'adresse configurée dans `OLLAMA_URL` (proxy.py)
3. Assurez-vous qu'au moins un modèle est installé dans Ollama

L'application basculera automatiquement en mode démo si Ollama n'est pas accessible.

### Problèmes de proxy
Le serveur Python fait office de proxy pour éviter les problèmes CORS. Si vous rencontrez des difficultés :
1. Vérifiez les logs du serveur Python
2. Assurez-vous que le port 9425 n'est pas bloqué par un pare-feu

## Mode démo

Si Ollama n'est pas disponible, l'application utilise des réponses prédéfinies pour démontrer ses fonctionnalités. Ces réponses se trouvent dans la fonction `generateDemoResponse()` du fichier `public/js/api.js`.

## Développement futur

- [ ] Système de cartes interactif
- [ ] Gestion des personnages non-joueurs
- [ ] Paramètres de jeu configurables
- [ ] Support pour d'autres moteurs LLM
- [ ] Collaboration multi-joueurs en temps réel

## Licence

Ce projet est distribué sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## Contributions

Les contributions sont les bienvenues ! N'hésitez pas à soumettre des pull requests ou à ouvrir des issues pour signaler des bugs ou proposer des améliorations.