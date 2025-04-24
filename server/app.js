/**
 * Backend Node.js pour le site de jeu de rôle
 * 
 * Ce serveur permet de :
 * 1. Gérer les sessions de jeu
 * 2. Communiquer avec le LLM pour obtenir les réponses du Maître du Jeu
 * 3. Gérer les joueurs et leurs interactions
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const socketIO = require('socket.io');
const http = require('http');

// Charger les variables d'environnement
dotenv.config();

// Initialiser l'application Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Base de données en mémoire pour la démo (à remplacer par une vraie DB dans un environnement de production)
const inMemoryDB = {
	games: {},
	players: {},
	messages: {}
};

// Configuration du LLM
const LLM_API_URL = process.env.LLM_API_URL || 'https://api.anthropic.com/v1/messages';
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'claude-3-opus-20240229';

// Initialiser quelques données de démo
initializeDemoData();

// Routes API

/**
 * Récupérer les informations d'une campagne
 */
app.get('/api/roleplay/game/:gameId', (req, res) => {
	const { gameId } = req.params;
	
	// Vérifier si la campagne existe
	if (!inMemoryDB.games[gameId]) {
		return res.status(404).json({ error: 'Campagne non trouvée' });
	}
	
	res.json(inMemoryDB.games[gameId]);
});

/**
 * Récupérer l'historique des messages d'une campagne
 */
app.get('/api/roleplay/history/:gameId', (req, res) => {
	const { gameId } = req.params;
	
	// Vérifier si la campagne existe
	if (!inMemoryDB.games[gameId]) {
		return res.status(404).json({ error: 'Campagne non trouvée' });
	}
	
	// Récupérer les messages de la campagne
	const messages = inMemoryDB.messages[gameId] || [];
	
	res.json(messages);
});

/**
 * Envoyer un message au LLM (Maître du Jeu)
 */
app.post('/api/roleplay/message/:gameId', async (req, res) => {
	const { gameId } = req.params;
	const { message } = req.body;
	
	// Vérifier si la campagne existe
	if (!inMemoryDB.games[gameId]) {
		return res.status(404).json({ error: 'Campagne non trouvée' });
	}
	
	try {
		// Enregistrer le message du joueur
		if (!inMemoryDB.messages[gameId]) {
			inMemoryDB.messages[gameId] = [];
		}
		
		inMemoryDB.messages[gameId].push(message);
		
		// Préparer le contexte pour le LLM
		const context = prepareContextForLLM(gameId, message);
		
		// Envoyer la requête au LLM
		const dmResponse = await sendToLLM(context);
		
		// Enregistrer la réponse du MJ
		const dmMessage = {
			content: dmResponse,
			sender: 'Maître du Jeu',
			avatar: 'M',
			type: 'dm',
			timestamp: new Date().toISOString()
		};
		
		inMemoryDB.messages[gameId].push(dmMessage);
		
		// Notifier tous les clients connectés de la nouvelle réponse
		io.to(gameId).emit('new-message', dmMessage);
		
		res.json(dmMessage);
	} catch (error) {
		console.error('Error processing message:', error);
		res.status(500).json({ error: 'Erreur lors du traitement du message' });
	}
});

/**
 * Effectuer un jet de dés
 */
app.post('/api/roleplay/dice/:gameId', (req, res) => {
	const { gameId } = req.params;
	const { diceType, numberOfDice, modifier } = req.body;
	
	// Vérifier si la campagne existe
	if (!inMemoryDB.games[gameId]) {
		return res.status(404).json({ error: 'Campagne non trouvée' });
	}
	
	try {
		// Effectuer le jet de dés
		const results = [];
		let total = 0;
		
		for (let i = 0; i < numberOfDice; i++) {
			const result = Math.floor(Math.random() * diceType) + 1;
			results.push(result);
			total += result;
		}
		
		// Ajouter le modificateur
		total += modifier;
		
		const diceRoll = {
			diceType,
			numberOfDice,
			modifier,
			results,
			total
		};
		
		// Créer un message système pour le jet de dés
		const rollMessage = {
			content: `[Jet de dés: ${numberOfDice}d${diceType}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''} = ${total}]`,
			sender: 'Système',
			avatar: 'S',
			type: 'system',
			timestamp: new Date().toISOString()
		};
		
		// Enregistrer le message
		if (!inMemoryDB.messages[gameId]) {
			inMemoryDB.messages[gameId] = [];
		}
		
		inMemoryDB.messages[gameId].push(rollMessage);
		
		// Notifier tous les clients connectés du jet de dés
		io.to(gameId).emit('new-message', rollMessage);
		
		res.json(diceRoll);
	} catch (error) {
		console.error('Error processing dice roll:', error);
		res.status(500).json({ error: 'Erreur lors du jet de dés' });
	}
});

/**
 * Récupérer la liste des joueurs d'une campagne
 */
app.get('/api/roleplay/players/:gameId', (req, res) => {
	const { gameId } = req.params;
	
	// Vérifier si la campagne existe
	if (!inMemoryDB.games[gameId]) {
		return res.status(404).json({ error: 'Campagne non trouvée' });
	}
	
	// Récupérer les joueurs de la campagne
	const players = inMemoryDB.players[gameId] || [];
	
	res.json(players);
});

/**
 * Ajouter un joueur à une campagne
 */
app.post('/api/roleplay/players/:gameId', (req, res) => {
	const { gameId } = req.params;
	const playerData = req.body;
	
	// Vérifier si la campagne existe
	if (!inMemoryDB.games[gameId]) {
		return res.status(404).json({ error: 'Campagne non trouvée' });
	}
	
	// Générer un ID pour le joueur s'il n'en a pas
	if (!playerData.id) {
		playerData.id = uuidv4();
	}
	
	// Ajouter le joueur à la campagne
	if (!inMemoryDB.players[gameId]) {
		inMemoryDB.players[gameId] = [];
	}
	
	inMemoryDB.players[gameId].push(playerData);
	
	// Notifier tous les clients qu'un nouveau joueur a rejoint
	io.to(gameId).emit('player-joined', playerData);
	
	res.json(playerData);
});

/**
 * Créer une nouvelle campagne
 */
app.post('/api/roleplay/game', (req, res) => {
	const { title, description } = req.body;
	
	// Générer un ID pour la campagne
	const gameId = uuidv4();
	
	// Créer la campagne
	const game = {
		id: gameId,
		title: title || 'Nouvelle Aventure',
		description: description || 'Une nouvelle aventure commence...',
		createdAt: new Date().toISOString()
	};
	
	// Enregistrer la campagne
	inMemoryDB.games[gameId] = game;
	inMemoryDB.players[gameId] = [];
	inMemoryDB.messages[gameId] = [];
	
	// Ajouter un message initial du MJ
	const initialMessage = {
		content: 'Bienvenue dans votre nouvelle aventure ! Que voulez-vous faire ?',
		sender: 'Maître du Jeu',
		avatar: 'M',
		type: 'dm',
		timestamp: new Date().toISOString()
	};
	
	inMemoryDB.messages[gameId].push(initialMessage);
	
	res.json(game);
});

// Gestion des WebSockets pour les communications en temps réel
io.on('connection', (socket) => {
	console.log('New client connected');
	
	// Rejoindre une salle (campagne)
	socket.on('join-game', (gameId) => {
		socket.join(gameId);
		console.log(`Client joined game: ${gameId}`);
	});
	
	// Déconnexion
	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

/**
 * Prépare le contexte pour le LLM en fonction de l'historique de la conversation
 */
function prepareContextForLLM(gameId, currentMessage) {
	// Récupérer l'historique des messages
	const messages = inMemoryDB.messages[gameId] || [];
	
	// Limiter le nombre de messages pour éviter de dépasser les limites du LLM
	const recentMessages = messages.slice(-10);
	
	// Construire le contexte
	let context = "Tu es le Maître du Jeu d'une campagne de jeu de rôle. Tu dois répondre de manière immersive et descriptive. ";
	context += "Voici l'historique de la conversation:\n\n";
	
	// Ajouter les messages récents au contexte
	recentMessages.forEach(msg => {
		if (msg.type === 'dm') {
			context += `MJ: ${msg.content}\n\n`;
		} else if (msg.type === 'player') {
			context += `${msg.sender}: ${msg.content}\n\n`;
		} else if (msg.type === 'system') {
			context += `Système: ${msg.content}\n\n`;
		}
	});
	
	// Ajouter le message actuel
	context += `${currentMessage.sender}: ${currentMessage.content}\n\n`;
	context += "Comment le MJ répond-il à cette action ? Sois descriptif et immersif.";
	
	return context;
}

/**
 * Envoie une requête au LLM et retourne sa réponse
 */
async function sendToLLM(prompt) {
	// Si l'API key n'est pas configurée, retourner une réponse de démo
	if (!LLM_API_KEY) {
		console.warn('LLM API key not configured, using demo response');
		return generateDemoResponse();
	}
	
	try {
		const response = await axios.post(
			LLM_API_URL,
			{
				model: LLM_MODEL,
				messages: [
					{ role: "user", content: prompt }
				],
				max_tokens: 1000
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': LLM_API_KEY,
					'anthropic-version': '2023-06-01'
				}
			}
		);
		
		return response.data.content[0].text;
	} catch (error) {
		console.error('Error calling LLM API:', error);
		return generateDemoResponse();
	}
}

/**
 * Génère une réponse de démo aléatoire
 */
function generateDemoResponse() {
	const demoResponses = [
		"Alors que vous avancez plus profondément dans la forêt, les ombres semblent s'allonger et danser autour de vous. Un bruit sourd résonne au loin. Que faites-vous ?",
		"La créature vous regarde avec des yeux brillants, puis s'enfuit rapidement dans les sous-bois. Vous remarquez qu'elle a laissé tomber quelque chose de brillant sur le sol.",
		"La porte de la cabane s'ouvre lentement, révélant une vieille femme aux cheveux argentés. Elle vous sourit et dit : 'Je vous attendais, voyageurs. Entrez, nous avons beaucoup à discuter.'",
		"Le ciel s'assombrit soudainement. Ce n'est pas naturel - vous sentez une présence magique puissante qui approche. Tous vos instincts vous disent de vous mettre à l'abri rapidement.",
		"Vous trouvez un ancien parchemin caché sous une pierre. Les inscriptions sont dans une langue ancienne, mais vous reconnaissez quelques symboles qui indiquent un trésor caché."
	];
	
	return demoResponses[Math.floor(Math.random() * demoResponses.length)];
}

/**
 * Initialise des données de démo pour le développement
 */
function initializeDemoData() {
	// Créer une campagne de démo
	const demoGameId = 'terres-oubliees-01';
	
	inMemoryDB.games[demoGameId] = {
		id: demoGameId,
		title: 'Aventure dans les Terres Oubliées',
		description: 'Une aventure épique dans un monde fantastique peuplé de créatures mystérieuses et de magie ancienne.',
		createdAt: new Date().toISOString()
	};
	
	// Ajouter des joueurs de démo
	inMemoryDB.players[demoGameId] = [
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
	inMemoryDB.messages[demoGameId] = [
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

// Route pour servir l'application frontend
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Démarrer le serveur
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});