/**
 * Gestion des WebSockets pour la communication en temps réel
 */

class SocketManager {
	constructor() {
		this.socket = null;
		this.connected = false;
		this.gameId = null;
		this.callbacks = {
			onNewMessage: null,
			onPlayerJoined: null,
			onPlayerLeft: null,
			onDiceRoll: null
		};
	}
	
	/**
	 * Initialise la connexion WebSocket
	 */
	init(gameId) {
		if (!window.io) {
			console.error('Socket.io not loaded');
			return false;
		}
		
		this.gameId = gameId;
		
		// Connexion au serveur
		this.socket = io();
		
		// Gestion des événements
		this.socket.on('connect', () => {
			console.log('Socket connected');
			this.connected = true;
			
			// Rejoindre la salle de jeu
			this.socket.emit('join-game', this.gameId);
		});
		
		this.socket.on('disconnect', () => {
			console.log('Socket disconnected');
			this.connected = false;
		});
		
		// Écouter les nouveaux messages
		this.socket.on('new-message', (message) => {
			if (this.callbacks.onNewMessage) {
				this.callbacks.onNewMessage(Message.fromJSON(message));
			}
		});
		
		// Écouter les nouveaux joueurs
		this.socket.on('player-joined', (player) => {
			if (this.callbacks.onPlayerJoined) {
				this.callbacks.onPlayerJoined(Player.fromJSON(player));
			}
		});
		
		// Écouter les joueurs qui partent
		this.socket.on('player-left', (player) => {
			if (this.callbacks.onPlayerLeft) {
				this.callbacks.onPlayerLeft(Player.fromJSON(player));
			}
		});
		
		// Écouter les jets de dés
		this.socket.on('dice-roll', (diceRoll) => {
			if (this.callbacks.onDiceRoll) {
				this.callbacks.onDiceRoll(diceRoll);
			}
		});
		
		return true;
	}
	
	/**
	 * Définit un callback pour un événement
	 */
	on(event, callback) {
		if (this.callbacks.hasOwnProperty(event)) {
			this.callbacks[event] = callback;
		}
	}
	
	/**
	 * Envoie un message au serveur
	 */
	sendMessage(messageData) {
		if (!this.connected) {
			console.error('Socket not connected');
			return false;
		}
		
		this.socket.emit('send-message', messageData);
		return true;
	}
	
	/**
	 * Envoie un jet de dés au serveur
	 */
	sendDiceRoll(diceRoll) {
		if (!this.connected) {
			console.error('Socket not connected');
			return false;
		}
		
		this.socket.emit('roll-dice', diceRoll);
		return true;
	}
	
	/**
	 * Déconnecte le socket
	 */
	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			this.connected = false;
		}
	}
}