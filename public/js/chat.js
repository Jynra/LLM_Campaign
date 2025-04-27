/**
 * Gestion du chat et des messages
 */

class ChatManager {
    constructor() {
        this.chatElement = document.getElementById('chat-messages');
        this.currentGame = null;
        this.currentPlayer = null;
        this.messageHistory = [];
        this.initialized = false;
        
        // Stockage local pour persister les messages
        this.localStorageKey = 'roleplay_messages';
    }
    
    /**
     * Initialise le gestionnaire de chat
     */
    init(game, currentPlayer) {
        this.currentGame = game;
        this.currentPlayer = currentPlayer;
        
        // Charger les messages depuis le stockage local ou utiliser ceux fournis
        this.loadMessageHistory();
        
        // Charger l'historique des messages
        this.refreshChatDisplay();
        
        this.initialized = true;
        console.log('Chat manager initialized with game:', game.title);
    }
    
    /**
     * Charge l'historique des messages depuis le stockage local
     */
    loadMessageHistory() {
        try {
            const storedMessages = localStorage.getItem(`${this.localStorageKey}_${this.currentGame.id}`);
            
            if (storedMessages) {
                // Utiliser les messages stockés localement
                this.messageHistory = JSON.parse(storedMessages).map(msg => Message.fromJSON(msg));
                console.log('Loaded message history from local storage:', this.messageHistory.length, 'messages');
            } else {
                // Aucun message stocké, utiliser ceux de l'API
                this.messageHistory = this.currentGame.messages || [];
                this.saveMessageHistory();
            }
        } catch (error) {
            console.error('Error loading message history from local storage:', error);
            this.messageHistory = this.currentGame.messages || [];
        }
    }
    
    /**
     * Sauvegarde l'historique des messages dans le stockage local
     */
    saveMessageHistory() {
        try {
            localStorage.setItem(
                `${this.localStorageKey}_${this.currentGame.id}`,
                JSON.stringify(this.messageHistory.map(msg => msg.toJSON ? msg.toJSON() : msg))
            );
        } catch (error) {
            console.error('Error saving message history to local storage:', error);
        }
    }
    
    /**
     * Ajoute un message au chat
     */
    addMessage(content, sender, avatar, type) {
        if (!this.initialized) {
            console.error('Chat manager not initialized');
            return null;
        }
        
        const message = new Message(content, sender, avatar, type);
        this.messageHistory.push(message);
        
        // Limiter la taille de l'historique
        if (this.messageHistory.length > CONFIG.game.maxHistoryMessages) {
            this.messageHistory.shift();
        }
        
        // Ajouter le message à l'interface
        this.appendMessageToUI(message);
        
        // Sauvegarder les messages
        this.saveMessageHistory();
        
        return message;
    }
    
    /**
     * Ajoute un message au DOM
     */
    appendMessageToUI(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${message.type}`;
        
        const metadataDiv = document.createElement('div');
        metadataDiv.className = 'message-metadata';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = message.avatar;
        
        const senderDiv = document.createElement('div');
        senderDiv.className = 'message-sender';
        senderDiv.textContent = message.sender;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = message.getFormattedTime();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = message.content.replace(/\n/g, '<br>');
        
        metadataDiv.appendChild(avatarDiv);
        metadataDiv.appendChild(senderDiv);
        metadataDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(metadataDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatElement.appendChild(messageDiv);
        
        // Faire défiler vers le bas
        this.scrollToBottom();
    }
    
    /**
     * Actualise l'affichage du chat avec tous les messages
     */
    refreshChatDisplay() {
        // Vider le conteneur de messages
        this.chatElement.innerHTML = '';
        
        // Ajouter tous les messages de l'historique
        this.messageHistory.forEach(message => {
            this.appendMessageToUI(message);
        });
        
        // Faire défiler vers le bas
        this.scrollToBottom();
    }
    
    /**
     * Fait défiler la fenêtre de chat vers le bas
     */
    scrollToBottom() {
		// Assurez-vous que le scroll fonctionne correctement
		if (this.chatElement) {
			// Option 1 : scroll standard
			this.chatElement.scrollTop = this.chatElement.scrollHeight;
			
			// Option 2 : forcer le scroll avec un délai (utile sur mobile)
			setTimeout(() => {
				this.chatElement.scrollTop = this.chatElement.scrollHeight;
			}, 100);
		}
	}
    
    /**
     * Envoie un message de joueur
     */
    async sendPlayerMessage(content) {
        if (!content.trim()) {
            return null;
        }
        
        // Ajouter le message du joueur à l'interface
        const playerMessage = this.addMessage(
            content,
            this.currentPlayer.name,
            this.currentPlayer.avatar,
            CONFIG.ui.messageTypes.PLAYER
        );
        
        try {
            // Afficher un indicateur de chargement
            this.showTypingIndicator();
            
            // Envoyer le message à l'API pour traitement par le LLM
            const response = await apiClient.sendMessage(this.currentGame.id, playerMessage);
            
            // Supprimer l'indicateur de chargement
            this.removeTypingIndicator();
            
            // Ajouter la réponse du MJ
            this.addMessage(
                response.content,
                CONFIG.dm.name,
                CONFIG.dm.avatar,
                CONFIG.ui.messageTypes.DM
            );
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Supprimer l'indicateur de chargement
            this.removeTypingIndicator();
            
            // Ajouter un message d'erreur
            this.addMessage(
                "Il semble y avoir un problème de communication avec le Maître du Jeu...",
                "Système",
                "S",
                CONFIG.ui.messageTypes.SYSTEM
            );
        }
        
        return playerMessage;
    }
    
    /**
     * Affiche un indicateur de "MJ est en train d'écrire..."
     */
    showTypingIndicator() {
        // Vérifier si l'indicateur existe déjà
        if (document.getElementById('typing-indicator')) {
            return;
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'message message-system';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<em>${CONFIG.dm.name} est en train d'écrire...</em>`;
        
        indicator.appendChild(content);
        this.chatElement.appendChild(indicator);
        
        // Faire défiler vers le bas
        this.scrollToBottom();
    }
    
    /**
     * Supprime l'indicateur de frappe
     */
    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Ajoute un message de jet de dés
     */
    addDiceRollMessage(diceRoll) {
        let content;
        
        if (!diceRoll) {
            // Créer un jet de dés aléatoire pour la démo
            const diceTypes = CONFIG.dice.types;
            const randomDice = diceTypes[Math.floor(Math.random() * diceTypes.length)];
            diceRoll = apiClient.rollDice(randomDice, 1, 0);
            content = `[Jet de dés : ${diceRoll.numberOfDice}d${diceRoll.diceType} = ${diceRoll.total} (${diceRoll.results.join(', ')})]`;
        } else {
            content = `[${this.currentPlayer.name} lance ${diceRoll.numberOfDice}d${diceRoll.diceType}${diceRoll.modifier !== 0 ? (diceRoll.modifier > 0 ? ` + ${diceRoll.modifier}` : ` ${diceRoll.modifier}`) : ''} = ${diceRoll.total} (${diceRoll.results.join(', ')})]`;
        }
        
        return this.addMessage(
            content,
            "Système",
            "S",
            CONFIG.ui.messageTypes.SYSTEM
        );
    }
    
    /**
	 * Efface tous les messages et réinitialise complètement le jeu
	 */
	clearChat() {
	    if (confirm('Êtes-vous sûr de vouloir effacer toute la conversation et réinitialiser le jeu ? Cette action est irréversible.')) {
	        // 1. Effacer l'historique des messages
	        this.messageHistory = [];
		
	        // 2. Supprimer toutes les données sauvegardées
	        const gameId = this.currentGame.id;
		
	        // Supprimer les messages spécifiques à ce jeu
	        localStorage.removeItem(`${this.localStorageKey}_${gameId}`);
		
	        // 3. Réinitialiser le jeu
	        // Récupérer un nouveau jeu "vierge" à partir de l'API
	        const newGameInfo = apiClient.getGameInfo(gameId);
	        const newPlayers = apiClient.getPlayersList(gameId).map(player => Player.fromJSON(player));
		
	        // Créer un nouvel objet de jeu
	        const newGame = new Game(
	            newGameInfo.id,
	            newGameInfo.title,
	            newGameInfo.description,
	            newPlayers,
	            [] // Pas de messages initiaux
	        );
		
	        // Mettre à jour le jeu actuel
	        this.currentGame = newGame;
		
	        // 4. Réinitialiser le joueur actuel (prendre le premier joueur par défaut)
	        this.currentPlayer = newPlayers[0];
		
	        // 5. Mettre à jour l'interface
	        this.refreshChatDisplay();
		
	        // 6. Ajouter un message initial du MJ pour démarrer une nouvelle aventure
	        this.addMessage(
	            "Bienvenue dans une nouvelle aventure ! Que souhaitez-vous faire pour commencer ?",
	            CONFIG.dm.name,
	            CONFIG.dm.avatar,
	            CONFIG.ui.messageTypes.DM
	        );
		
	        // 7. Déclencher un événement personnalisé pour informer les autres composants
	        const resetEvent = new CustomEvent('game:reset', { 
	            detail: { game: newGame, player: this.currentPlayer } 
	        });
	        document.dispatchEvent(resetEvent);
		
	        console.log("Jeu réinitialisé avec succès");
	    }
	}
}