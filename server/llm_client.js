/**
 * Client pour interagir avec l'API du LLM (Large Language Model)
 * Ce module gère la communication avec l'API Claude ou tout autre LLM
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

class LLMClient {
	constructor() {
		this.apiUrl = process.env.LLM_API_URL || 'https://api.anthropic.com/v1/messages';
		this.apiKey = process.env.LLM_API_KEY;
		this.model = process.env.LLM_MODEL || 'claude-3-opus-20240229';
		
		// Vérifier la configuration
		if (!this.apiKey && process.env.NODE_ENV !== 'development') {
			console.warn('LLM API key not configured. Using demo mode.');
		}
	}
	
	/**
	 * Envoie une requête au LLM et retourne sa réponse
	 * @param {string} prompt - Le texte à envoyer au LLM
	 * @param {number} maxTokens - Nombre maximum de tokens pour la réponse
	 * @param {Object} options - Options supplémentaires
	 */
	async sendPrompt(prompt, maxTokens = 1000, options = {}) {
		// Si l'API key n'est pas configurée, utiliser le mode démo
		if (!this.apiKey) {
			return this.generateDemoResponse();
		}
		
		try {
			const response = await axios.post(
				this.apiUrl,
				{
					model: this.model,
					messages: [
						{ role: "user", content: prompt }
					],
					max_tokens: maxTokens,
					...options
				},
				{
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': this.apiKey,
						'anthropic-version': '2023-06-01'
					}
				}
			);
			
			// Vérifier la réponse de l'API
			if (response.data && response.data.content && response.data.content.length > 0) {
				return response.data.content[0].text;
			} else {
				console.error('Unexpected response format from LLM API:', response.data);
				return this.generateDemoResponse();
			}
		} catch (error) {
			console.error('Error calling LLM API:', error.message);
			if (error.response) {
				console.error('API response:', error.response.data);
			}
			
			return this.generateDemoResponse();
		}
	}
	
	/**
	 * Génère une réponse en mode démo pour les tests
	 */
	generateDemoResponse() {
		const demoResponses = [
			"Alors que vous avancez plus profondément dans la forêt, les ombres semblent s'allonger et danser autour de vous. Un bruit sourd résonne au loin. Que faites-vous ?",
			"La créature vous regarde avec des yeux brillants, puis s'enfuit rapidement dans les sous-bois. Vous remarquez qu'elle a laissé tomber quelque chose de brillant sur le sol.",
			"La porte de la cabane s'ouvre lentement, révélant une vieille femme aux cheveux argentés. Elle vous sourit et dit : 'Je vous attendais, voyageurs. Entrez, nous avons beaucoup à discuter.'",
			"Le ciel s'assombrit soudainement. Ce n'est pas naturel - vous sentez une présence magique puissante qui approche. Tous vos instincts vous disent de vous mettre à l'abri rapidement.",
			"Vous trouvez un ancien parchemin caché sous une pierre. Les inscriptions sont dans une langue ancienne, mais vous reconnaissez quelques symboles qui indiquent un trésor caché.",
			"Un frisson parcourt votre échine lorsque vous entendez un hurlement lointain. Ce n'est pas un loup ordinaire, c'est quelque chose de plus grand, de plus ancien. Les légendes locales parlent de créatures qui rôdent dans ces bois la nuit.",
			"L'aubergiste vous regarde avec méfiance, puis se penche en avant et murmure : 'Si vous cherchez vraiment la Relique Perdue, vous devriez parler au vieil ermite qui vit dans la grotte au nord du village. Mais soyez prudents, il n'aime pas les visiteurs...'",
			"Après plusieurs heures de marche, vous arrivez devant les ruines imposantes d'un ancien temple. Des colonnes de marbre brisées s'élèvent vers le ciel, et l'entrée est gardée par deux statues monumentales représentant des guerriers avec des armes levées. Que faites-vous ?",
			"Vous sentez le sol trembler sous vos pieds. Au début, ce n'est qu'une légère vibration, mais elle s'intensifie rapidement. Dans la distance, vous voyez des arbres s'effondrer alors que quelque chose d'énorme se déplace dans votre direction. Il serait sage de se mettre à couvert."
		];
		
		return demoResponses[Math.floor(Math.random() * demoResponses.length)];
	}
	
	/**
	 * Crée un prompt spécifique pour le Maître du Jeu
	 * @param {Array} messageHistory - Historique des messages
	 * @param {Object} currentMessage - Message actuel
	 * @param {Object} gameInfo - Informations sur la campagne
	 */
	createDMPrompt(messageHistory, currentMessage, gameInfo) {
		// Construire l'introduction
		let prompt = `Tu es le Maître du Jeu (MJ) d'une campagne de jeu de rôle se déroulant dans un univers ${gameInfo.genre || 'fantastique'}. 
Ton rôle est de décrire le monde, les situations et de réagir aux actions des joueurs.

Conseils pour le MJ:
- Sois descriptif et immersif dans tes réponses
- Réagis aux actions des joueurs de manière cohérente
- Crée des situations intéressantes qui offrent plusieurs possibilités d'action
- N'écris pas pour les joueurs, laisse-les prendre leurs propres décisions
- Inclus des détails sensoriels (sons, odeurs, textures, etc.)
- Mentionne les conséquences possibles des actions risquées

Voici quelques informations sur la campagne:
Titre: ${gameInfo.title}
Description: ${gameInfo.description}

`;

		// Ajouter l'historique des messages récents
		prompt += "HISTORIQUE RÉCENT DE LA CONVERSATION:\n\n";
		
		// Limiter le nombre de messages pour éviter de dépasser les limites du LLM
		const recentMessages = messageHistory.slice(-10);
		
		recentMessages.forEach(msg => {
			if (msg.type === 'dm') {
				prompt += `MJ: ${msg.content}\n\n`;
			} else if (msg.type === 'player') {
				prompt += `${msg.sender} (${msg.character || 'Joueur'}): ${msg.content}\n\n`;
			} else if (msg.type === 'system') {
				prompt += `[Système: ${msg.content}]\n\n`;
			}
		});
		
		// Ajouter le message actuel
		prompt += `${currentMessage.sender} (${currentMessage.character || 'Joueur'}): ${currentMessage.content}\n\n`;
		
		// Ajouter les instructions finales
		prompt += "En tant que Maître du Jeu, comment réponds-tu à cette action ? Décris ce qui se passe ensuite de manière immersive et captivante.";
		
		return prompt;
	}
}

module.exports = new LLMClient();