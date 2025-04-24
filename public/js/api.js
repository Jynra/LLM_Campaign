/**
 * Client API pour communiquer avec le backend
 */

class ApiClient {
	constructor() {
		this.baseUrl = CONFIG.api.baseUrl;
		this.endpoints = CONFIG.api.endpoints;
	}
	
	/**
	 * Effectue une requête vers l'API
	 */
	async request(endpoint, method = 'GET', data = null) {
		const url = `${this.baseUrl}${endpoint}`;
		
		const options = {
			method,
			headers: {
				'Content-Type': 'application/json'
			}
		};
		
		if (data) {
			options.body = JSON.stringify(data);
		}
		
		try {
			const response = await fetch(url, options);
			
			if (!response.ok) {
				throw new Error(`API request failed: ${response.status} ${response.statusText}`);
			}
			
			return await response.json();
		} catch (error) {
			console.error('API request error:', error);
			throw error;
		}
	}
	
	/**
	 * Récupère les informations d'une campagne
	 */
	async getGame(gameId) {
		const endpoint = `${this.endpoints.getGameInfo}/${gameId}`;
		return this.request(endpoint);
	}
	
	/**
	 * Récupère l'historique des messages d'une campagne
	 */
	async getMessageHistory(gameId) {
		const endpoint = `${this.endpoints.getHistory}/${gameId}`;
		return this.request(endpoint);
	}
	
	/**
	 * Envoie un message au LLM (Maître du Jeu)
	 */
	async sendMessage(gameId, message) {
		const endpoint = `${this.endpoints.sendMessage}/${gameId}`;
		
		return this.request(endpoint, 'POST', {
			message: message.toJSON()
		});
	}
	
	/**
	 * Effectue un jet de dés via l'API
	 */
	async rollDice(gameId, diceRoll) {
		const endpoint = `${this.endpoints.rollDice}/${gameId}`;
		
		return this.request(endpoint, 'POST', {
			diceType: diceRoll.diceType,
			numberOfDice: diceRoll.numberOfDice,
			modifier: diceRoll.modifier
		});
	}
	
	/**
	 * Récupère la liste des joueurs d'une campagne
	 */
	async getPlayers(gameId) {
		const endpoint = `${this.endpoints.players}/${gameId}`;
		return this.request(endpoint);
	}
	
	/**
	 * Version simulée des appels API pour la démo
	 * (sans connexion réelle à un backend)
	 */
	simulateApi() {
		// Remplacer les méthodes par des versions simulées
		
		this.getGame = (gameId) => {
			return Promise.resolve({
				id: gameId,
				title: 'Aventure dans les Terres Oubliées',
				description: 'Une aventure épique dans un monde fantastique peuplé de créatures mystérieuses et de magie ancienne.'
			});
		};
		
		this.getMessageHistory = (gameId) => {
			// Générer quelques messages de démo
			const messages = [
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
			
			return Promise.resolve(messages);
		};
		
		this.sendMessage = (gameId, message) => {
			// Simuler une réponse du LLM après un délai
			return new Promise((resolve) => {
				setTimeout(() => {
					// Réponses prédéfinies du MJ pour la démo
					const dmResponses = [
						"Alors que vous avancez plus profondément dans la forêt, les ombres semblent s'allonger et danser autour de vous. Un bruit sourd résonne au loin. Que faites-vous ?",
						"La créature vous regarde avec des yeux brillants, puis s'enfuit rapidement dans les sous-bois. Vous remarquez qu'elle a laissé tomber quelque chose de brillant sur le sol.",
						"La porte de la cabane s'ouvre lentement, révélant une vieille femme aux cheveux argentés. Elle vous sourit et dit : 'Je vous attendais, voyageurs. Entrez, nous avons beaucoup à discuter.'",
						"Le ciel s'assombrit soudainement. Ce n'est pas naturel - vous sentez une présence magique puissante qui approche. Tous vos instincts vous disent de vous mettre à l'abri rapidement.",
						"Vous trouvez un ancien parchemin caché sous une pierre. Les inscriptions sont dans une langue ancienne, mais vous reconnaissez quelques symboles qui indiquent un trésor caché."
					];
					
					// Choisir une réponse aléatoire
					const randomIndex = Math.floor(Math.random() * dmResponses.length);
					
					resolve({
						content: dmResponses[randomIndex],
						sender: CONFIG.dm.name,
						avatar: CONFIG.dm.avatar,
						type: CONFIG.ui.messageTypes.DM,
						timestamp: new Date().toISOString()
					});
				}, 1500);
			});
		};
		
		this.getPlayers = (gameId) => {
			// Liste des joueurs de démo
			const players = [
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
			
			return Promise.resolve(players);
		};
		
		this.rollDice = (gameId, diceRoll) => {
			// Simuler un jet de dés
			const roll = new DiceRoll(
				diceRoll.diceType,
				diceRoll.numberOfDice,
				diceRoll.modifier
			).roll();
			
			return Promise.resolve(roll);
		};
		
		console.log('API client running in simulation mode');
		return this;
	}
}

// Créer une instance du client API
const apiClient = new ApiClient().simulateApi();