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
	}
	
	/**
	 * Initialise le gestionnaire de chat
	 */
	init(game, currentPlayer) {
		this.currentGame = game;
		this.currentPlayer = currentPlayer;
		this.messageHistory = game.messages || [];
		
		// Charger l'historique des messages
		this.refreshChatDisplay();
		
		this.initialized = true;
		console.log('Chat manager initialized with game:', game.title);
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
		this.chatElement.scrollTop = this.chatElement.scrollHeight;
	}
	
	/**
	 * Envoie un message de joueur
	 */
	sendPlayerMessage(content) {
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
		
		// Envoyer le message à l'API pour traitement par le LLM
		apiClient.sendMessage(this.currentGame.id, playerMessage)
			.then(response => {
				// Traiter la réponse du MJ
				this.handleDMResponse(response);
			})
			.catch(error => {
				console.error('Error sending message:', error);
				
				// Ajouter un message d'erreur
				this.addMessage(
					"Il semble y avoir un problème de communication avec le Maître du Jeu...",
					"Système",
					"S",
					CONFIG.ui.messageTypes.SYSTEM
				);
			});
		
		return playerMessage;
	}
	
	/**
	 * Simule une réponse du MJ (pour la démo)
	 */
	simulateDMResponse() {
		// Simuler un jet de dés si nécessaire
		if (Math.random() > 0.7) {
			this.addDiceRollMessage();
		}
		
		// Réponses prédéfinies du MJ pour la démo
		const dmResponses = [
			"Alors que vous avancez plus profondément dans la forêt, les ombres semblent s'allonger et danser autour de vous. Un bruit sourd résonne au loin. Que faites-vous ?",
			"La créature vous regarde avec des yeux brillants, puis s'enfuit rapidement dans les sous-bois. Vous remarquez qu'elle a laissé tomber quelque chose de brillant sur le sol.",
			"La porte de la cabane s'ouvre lentement, révélant une vieille femme aux cheveux argentés. Elle vous sourit et dit : 'Je vous attendais, voyageurs. Entrez, nous avons beaucoup à discuter.'",
			"Le ciel s'assombrit soudainement. Ce n'est pas naturel - vous sentez une présence magique puissante qui approche. Tous vos instincts vous disent de vous mettre à l'abri rapidement.",
			"Vous trouvez un ancien parchemin caché sous une pierre. Les inscriptions sont dans une langue ancienne, mais vous reconnaissez quelques symboles qui indiquent un trésor caché."
		];
		
		// Choisir une réponse aléatoire
		const randomResponse = dmResponses[Math.floor(Math.random() * dmResponses.length)];
		
		// Ajouter la réponse du MJ après un délai
		setTimeout(() => {
			this.addMessage(
				randomResponse,
				CONFIG.dm.name,
				CONFIG.dm.avatar,
				CONFIG.ui.messageTypes.DM
			);
		}, 1500);
	}
	
	/**
	 * Traite la réponse du MJ reçue de l'API
	 */
	handleDMResponse(response) {
		// Si nous sommes en mode démo, utiliser la simulation
		if (!response || !response.content) {
			this.simulateDMResponse();
			return;
		}
		
		// Ajouter la réponse du MJ
		this.addMessage(
			response.content,
			CONFIG.dm.name,
			CONFIG.dm.avatar,
			CONFIG.ui.messageTypes.DM
		);
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
			diceRoll = new DiceRoll(randomDice).roll();
			content = `[Jet de dés : ${diceRoll.getDescription()}]`;
		} else {
			content = `[${this.currentPlayer.name} lance ${diceRoll.getDescription()}]`;
		}
		
		return this.addMessage(
			content,
			"Système",
			"S",
			CONFIG.ui.messageTypes.SYSTEM
		);
	}
}