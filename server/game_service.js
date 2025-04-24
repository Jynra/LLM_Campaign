/**
 * Service de gestion des jeux
 * Ce module gère les campagnes, joueurs et messages
 */

const { v4: uuidv4 } = require('uuid');
const llmClient = require('./llm_client');

class GameService {
	constructor() {
		// Base de données en mémoire pour la démo (à remplacer par une vraie DB en production)
		this.games = {};
		this.players = {};
		this.messages = {};
		
		// Initialiser des données de démo
		this.initializeDemoData();
	}
	
	/**
	 * Récupère les informations d'une campagne
	 */
	getGame(gameId) {
		return this.games[gameId] || null;
	}
	
	/**
	 * Récupère toutes les campagnes
	 */
	getAllGames() {
		return Object.values(this.games);
	}
	
	/**
	 * Crée une nouvelle campagne
	 */
	createGame(title, description, genre = 'fantasy') {
		const gameId = uuidv4();
		
		const game = {
			id: gameId,
			title: title || 'Nouvelle Aventure',
			description: description || 'Une nouvelle aventure commence...',
			genre: genre,
			createdAt: new Date().toISOString()
		};
		
		// Enregistrer la campagne
		this.games[gameId] = game;
		this.players[gameId] = [];
		this.messages[gameId] = [];
		
		// Ajouter un message initial du MJ
		this.addMessage(gameId, {
			content: 'Bienvenue dans votre nouvelle aventure ! Que voulez-vous faire ?',
			sender: 'Maître du Jeu',
			avatar: 'M',
			type: 'dm',
			timestamp: new Date().toISOString()
		});
		
		return game;
	}
	
	/**
	 * Ajoute un joueur à une campagne
	 */
	addPlayer(gameId, playerData) {
		// Vérifier si la campagne existe
		if (!this.games[gameId]) {
			throw new Error('Campagne non trouvée');
		}
		
		// Générer un ID pour le joueur s'il n'en a pas
		if (!playerData.id) {
			playerData.id = uuidv4();
		}
		
		// S'assurer que le joueur a un avatar
		if (!playerData.avatar) {
			playerData.avatar = playerData.name.charAt(0).toUpperCase();
		}
		
		// Ajouter le joueur à la campagne
		if (!this.players[gameId]) {
			this.players[gameId] = [];
		}
		
		this.players[gameId].push(playerData);
		
		return playerData;
	}
	
	/**
	 * Récupère les joueurs d'une campagne
	 */
	getPlayers(gameId) {
		return this.players[gameId] || [];
	}
	
	/**
	 * Ajoute un message à une campagne
	 */
	addMessage(gameId, message) {
		// Vérifier si la campagne existe
		if (!this.games[gameId]) {
			throw new Error('Campagne non trouvée');
		}
		
		// Créer le tableau des messages si nécessaire
		if (!this.messages[gameId]) {
			this.messages[gameId] = [];
		}
		
		// Ajouter le message
		this.messages[gameId].push(message);
		
		// Limiter le nombre de messages stockés (pour éviter de saturer la mémoire)
		const maxMessages = 100;
		if (this.messages[gameId].length > maxMessages) {
			this.messages[gameId] = this.messages[gameId].slice(-maxMessages);
		}
		
		return message;
	}
	
	/**
	 * Récupère les messages d'une campagne
	 */
	getMessages(gameId) {
		return this.messages[gameId] || [];
	}
	
	/**
	 * Traite un message de joueur et génère une réponse du MJ via le LLM
	 */
	async processPlayerMessage(gameId, message) {
		// Vérifier si la campagne existe
		if (!this.games[gameId]) {
			throw new Error('Campagne non trouvée');
		}
		
		// Enregistrer le message du joueur
		this.addMessage(gameId, message);
		
		// Récupérer l'historique des messages
		const messageHistory = this.getMessages(gameId);
		
		// Récupérer les informations de la campagne
		const gameInfo = this.getGame(gameId);
		
		// Préparer le prompt pour le LLM
		const prompt = llmClient.createDMPrompt(messageHistory, message, gameInfo);
		
		// Envoyer la requête au LLM
		const dmResponse = await llmClient.sendPrompt(prompt, 1000);
		
		// Créer le message du MJ
		const dmMessage = {
			content: dmResponse,
			sender: 'Maître du Jeu',
			avatar: 'M',
			type: 'dm',
			timestamp: new Date().toISOString()
		};
		
		// Enregistrer la réponse du MJ
		this.addMessage(gameId, dmMessage);
		
		return dmMessage;
	}
	
	/**
	 * Initialise des données de démo pour le développement
	 */
	initializeDemoData() {
		// Créer une campagne de démo
		const demoGameId = 'terres-oubliees-01';
		
		this.games[demoGameId] = {
			id: demoGameId,
			title: 'Aventure dans les Terres Oubliées',
			description: 'Une aventure épique dans un monde fantastique peuplé de créatures mystérieuses et de magie ancienne.',
			genre: 'fantasy',
			createdAt: new Date().toISOString()
		};
		
		// Ajouter des joueurs de démo
		this.players[demoGameId] = [
			{
				id: '1',
				name: 'Galadriel',
				character: 'Elfe Mage',
				avatar: 'G',
				isConnected: true
			},
			{
				id: '2',
				name: 'Thorin',
				character: 'Nain Guerrier',
				avatar: 'T',
				isConnected: true
			},
			{
				id: '3',
				name: 'Aragorn',
				character: 'Humain Rôdeur',
				avatar: 'A',
				isConnected: true
			},
			{
				id: '4',
				name: 'Legolas',
				character: 'Elfe Archer',
				avatar: 'L',
				isConnected: true
			}
		];
		
		// Ajouter des messages de démo
		this.messages[demoGameId] = [
			{
				content: 'Bienvenue dans les Terres Oubliées, aventuriers ! Vous vous trouvez actuellement à l\'entrée d\'une sombre forêt. Les arbres semblent vivants, se tordant légèrement avec le vent. Au loin, vous pouvez apercevoir une faible lueur entre les arbres. Que souhaitez-vous faire ?',
				sender: 'Maître du Jeu',
				avatar: 'M',
				type: 'dm',
				timestamp: new Date(Date.now() - 500000).toISOString()
			},
			{
				content: 'Je suggère qu\'on avance prudemment vers cette lueur. Je dégaine ma hache au cas où.',
				sender: 'Thorin',
				avatar: 'T',
				type: 'player',
				timestamp: new Date(Date.now() - 400000).toISOString()
			},
			{
				content: 'Je prépare un sort de détection de la magie pour voir si cette lueur a une origine arcanique.',
				sender: 'Galadriel',
				avatar: 'G',
				type: 'player',
				timestamp: new Date(Date.now() - 390000).toISOString()
			},
			{
				content: '[Galadriel lance Détection de la magie - Jet d\'intelligence : 15]',
				sender: 'Système',
				avatar: 'S',
				type: 'system',
				timestamp: new Date(Date.now() - 380000).toISOString()
			},
			{
				content: 'Le groupe s\'avance prudemment dans la forêt, Thorin en tête avec sa hache prête à l\'action. Galadriel, vos sens magiques s\'éveillent et vous détectez une aura magique provenant de la lumière - c\'est une magie ancienne, mais vous ne pouvez pas encore en déterminer la nature exacte.\n\nAlors que vous avancez, le sentier devient de plus en plus étroit. Les arbres semblent se rapprocher, comme s\'ils observaient votre progression. Après quelques minutes de marche, vous arrivez dans une petite clairière. La source de lumière est maintenant visible : une lanterne suspendue devant l\'entrée d\'une cabane en bois. La porte est entrouverte.',
				sender: 'Maître du Jeu',
				avatar: 'M',
				type: 'dm',
				timestamp: new Date(Date.now() - 370000).toISOString()
			},
			{
				content: 'Je fais signe aux autres de rester sur leurs gardes et je m\'approche silencieusement de la cabane. J\'essaie d\'écouter s\'il y a des bruits à l\'intérieur.',
				sender: 'Aragorn',
				avatar: 'A',
				type: 'player',
				timestamp: new Date(Date.now() - 360000).toISOString()
			},
			{
				content: '[Aragorn effectue un jet de Discrétion : 18]',
				sender: 'Système',
				avatar: 'S',
				type: 'system',
				timestamp: new Date(Date.now() - 350000).toISOString()
			},
			{
				content: 'Aragorn, vous vous approchez avec l\'agilité d\'un chat. Personne ne vous entendrait, pas même un elfe. En vous approchant de la cabane, vous entendez un léger fredonnement venant de l\'intérieur. Une voix âgée, mais pas menaçante, semble chanter une mélodie ancienne dans une langue que vous ne reconnaissez pas immédiatement. Il y a aussi l\'odeur d\'un ragoût qui mijote et des herbes séchées.',
				sender: 'Maître du Jeu',
				avatar: 'M',
				type: 'dm',
				timestamp: new Date(Date.now() - 340000).toISOString()
			}
		];
	}
}

module.exports = new GameService();