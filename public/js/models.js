/**
 * Classes modèles pour représenter les données de l'application
 */

/**
 * Représente un message dans le chat
 */
class Message {
	constructor(content, sender, avatar, type, timestamp = new Date()) {
		this.content = content;
		this.sender = sender;
		this.avatar = avatar;
		this.type = type;
		this.timestamp = timestamp;
	}
	
	/**
	 * Formatte le timestamp pour l'affichage
	 */
	getFormattedTime() {
		return `${this.timestamp.getHours()}:${this.timestamp.getMinutes().toString().padStart(2, '0')}`;
	}
	
	/**
	 * Crée un message à partir d'un objet JSON
	 */
	static fromJSON(json) {
		return new Message(
			json.content,
			json.sender,
			json.avatar,
			json.type,
			new Date(json.timestamp)
		);
	}
	
	/**
	 * Convertit le message en objet JSON
	 */
	toJSON() {
		return {
			content: this.content,
			sender: this.sender,
			avatar: this.avatar,
			type: this.type,
			timestamp: this.timestamp.toISOString()
		};
	}
}

/**
 * Représente un joueur dans le jeu
 */
class Player {
	constructor(id, name, character, avatar, isConnected = true) {
		this.id = id;
		this.name = name;
		this.character = character;
		this.avatar = avatar;
		this.isConnected = isConnected;
	}
	
	/**
	 * Crée un joueur à partir d'un objet JSON
	 */
	static fromJSON(json) {
		return new Player(
			json.id,
			json.name,
			json.character,
			json.avatar,
			json.isConnected
		);
	}
	
	/**
	 * Convertit le joueur en objet JSON
	 */
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			character: this.character,
			avatar: this.avatar,
			isConnected: this.isConnected
		};
	}
	
	/**
	 * Retourne le nom d'affichage complet du joueur
	 */
	getDisplayName() {
		return `${this.name} (${this.character})`;
	}
}

/**
 * Représente une campagne de jeu
 */
class Game {
	constructor(id, title, description, players = [], messages = []) {
		this.id = id;
		this.title = title;
		this.description = description;
		this.players = players;
		this.messages = messages;
	}
	
	/**
	 * Ajoute un message à la campagne
	 */
	addMessage(message) {
		this.messages.push(message);
		
		// Limite le nombre de messages stockés
		if (this.messages.length > CONFIG.game.maxHistoryMessages) {
			this.messages.shift();
		}
		
		return message;
	}
	
	/**
	 * Ajoute un joueur à la campagne
	 */
	addPlayer(player) {
		this.players.push(player);
		return player;
	}
	
	/**
	 * Crée une campagne à partir d'un objet JSON
	 */
	static fromJSON(json) {
		const players = json.players.map(player => Player.fromJSON(player));
		const messages = json.messages.map(message => Message.fromJSON(message));
		
		return new Game(
			json.id,
			json.title,
			json.description,
			players,
			messages
		);
	}
	
	/**
	 * Convertit la campagne en objet JSON
	 */
	toJSON() {
		return {
			id: this.id,
			title: this.title,
			description: this.description,
			players: this.players.map(player => player.toJSON()),
			messages: this.messages.map(message => message.toJSON())
		};
	}
}

/**
 * Représente un jet de dés
 */
class DiceRoll {
	constructor(diceType, numberOfDice = 1, modifier = 0) {
		this.diceType = diceType;
		this.numberOfDice = numberOfDice;
		this.modifier = modifier;
		this.results = [];
		this.total = 0;
	}
	
	/**
	 * Exécute le jet de dés
	 */
	roll() {
		this.results = [];
		this.total = 0;
		
		for (let i = 0; i < this.numberOfDice; i++) {
			const result = Math.floor(Math.random() * this.diceType) + 1;
			this.results.push(result);
			this.total += result;
		}
		
		// Ajout du modificateur
		this.total += this.modifier;
		
		return this;
	}
	
	/**
	 * Retourne une description du jet de dés
	 */
	getDescription() {
		let description = `${this.numberOfDice}d${this.diceType}`;
		
		if (this.modifier !== 0) {
			description += this.modifier > 0 ? `+${this.modifier}` : `${this.modifier}`;
		}
		
		if (this.results.length > 0) {
			description += ` = ${this.total} (${this.results.join(', ')})`;
			if (this.modifier !== 0) {
				description += this.modifier > 0 ? ` + ${this.modifier}` : ` - ${Math.abs(this.modifier)}`;
			}
		}
		
		return description;
	}
}