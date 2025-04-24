/**
 * Point d'entrée principal de l'application
 */

// Instancier les gestionnaires
const chatManager = new ChatManager();
const uiManager = new UIManager();

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
	// Initialiser l'application
	initializeApp();
});

/**
 * Initialise l'application
 */
async function initializeApp() {
	try {
		console.log('Initializing application...');
		
		// Récupérer l'ID de la campagne (par défaut pour la démo)
		const gameId = getGameIdFromUrl() || CONFIG.game.defaultGameId;
		
		// Récupérer les informations de la campagne
		const gameInfo = await apiClient.getGame(gameId);
		console.log('Game info loaded:', gameInfo);
		
		// Récupérer les joueurs
		const players = await apiClient.getPlayers(gameId);
		const playerObjects = players.map(player => Player.fromJSON(player));
		console.log('Players loaded:', playerObjects);
		
		// Récupérer l'historique des messages
		const messageHistory = await apiClient.getMessageHistory(gameId);
		const messageObjects = messageHistory.map(message => Message.fromJSON(message));
		console.log('Message history loaded:', messageObjects);
		
		// Créer l'objet Game
		const game = new Game(
			gameInfo.id,
			gameInfo.title,
			gameInfo.description,
			playerObjects,
			messageObjects
		);
		
		// Sélectionner le joueur actuel (premier joueur pour la démo)
		const currentPlayer = playerObjects[0];
		
		// Initialiser le gestionnaire de chat
		chatManager.init(game, currentPlayer);
		
		// Initialiser le gestionnaire d'interface
		uiManager.init(chatManager);
		
		// Mettre à jour l'interface avec les données chargées
		updateInterface(game);
		
		console.log('Application initialized successfully');
	} catch (error) {
		console.error('Error initializing application:', error);
		displayErrorMessage('Impossible de charger l\'application. Veuillez réessayer plus tard.');
	}
}

/**
 * Récupère l'ID de jeu depuis l'URL
 */
function getGameIdFromUrl() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('game');
}

/**
 * Met à jour l'interface avec les données de la campagne
 */
function updateInterface(game) {
	// Mettre à jour le titre de la campagne
	document.querySelector('.chat-header h2').textContent = game.title;
	document.getElementById('current-campaign').textContent = game.title;
	
	// Mettre à jour la liste des joueurs
	uiManager.updatePlayerList(game.players);
	
	// Charger les messages initiaux
	chatManager.refreshChatDisplay();
}

/**
 * Affiche un message d'erreur
 */
function displayErrorMessage(message) {
	const errorDiv = document.createElement('div');
	errorDiv.className = 'error-message';
	errorDiv.textContent = message;
	
	// Ajouter en haut de la page
	document.body.insertBefore(errorDiv, document.body.firstChild);
	
	// Supprimer après quelques secondes
	setTimeout(() => {
		errorDiv.remove();
	}, 5000);
}

/**
 * Fonction pour le déboggage (mode développement)
 */
function debug(message, data) {
	if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
		console.log(`[DEBUG] ${message}`, data);
	}
}