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
        this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
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
            json.timestamp ? new Date(json.timestamp) : new Date()
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
            json.isConnected !== undefined ? json.isConnected : true
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
        this.genre = 'fantasy'; // Genre par défaut
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
        const players = (json.players || []).map(player => Player.fromJSON(player));
        const messages = (json.messages || []).map(message => Message.fromJSON(message));
        
        const game = new Game(
            json.id,
            json.title,
            json.description,
            players,
            messages
        );
        
        if (json.genre) {
            game.genre = json.genre;
        }
        
        return game;
    }
    
    /**
     * Convertit la campagne en objet JSON
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            genre: this.genre,
            players: this.players.map(player => player.toJSON()),
            messages: this.messages.map(message => message.toJSON())
        };
    }
}