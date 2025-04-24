/**
 * Client API pour communiquer avec le backend Ollama
 */

class ApiClient {
    constructor() {
        // URL du proxy Python vers Ollama
        this.ollamaUrl = '/proxy-ollama/api';
        this.ollamaModel = 'mistral'; // Modèle par défaut
    }
    
    /**
     * Effectue une requête vers l'API Ollama
     */
    async sendToOllama(prompt) {
        console.log(`Envoi d'une requête à Ollama avec le modèle: ${this.ollamaModel}`);
        
        try {
            const response = await fetch(`${this.ollamaUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.ollamaModel,
                    prompt: prompt,
                    stream: false,
                    options: {
                        num_predict: 1000
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur API Ollama: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data && data.response) {
                return data.response;
            } else {
                console.error('Format de réponse Ollama inattendu:', data);
                return this.generateDemoResponse();
            }
        } catch (error) {
            console.error('Erreur lors de la communication avec Ollama:', error);
            return this.generateDemoResponse();
        }
    }
    
    /**
     * Vérifie les modèles disponibles sur le serveur Ollama
     */
    async checkAvailableModels() {
        try {
            const response = await fetch(`${this.ollamaUrl}/tags`);
            
            if (!response.ok) {
                throw new Error(`Erreur API Ollama: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Modèles Ollama disponibles:', data);
            
            return data.models || [];
        } catch (error) {
            console.error('Erreur lors de la vérification des modèles Ollama:', error);
            return [];
        }
    }
    
    /**
     * Génère une réponse de démo en cas d'erreur
     */
    generateDemoResponse() {
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
     * Crée un prompt pour le Maître du Jeu
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
    
    /**
     * Effectue un jet de dés
     */
    rollDice(diceType, numberOfDice, modifier) {
        const results = [];
        let total = 0;
        
        for (let i = 0; i < numberOfDice; i++) {
            const result = Math.floor(Math.random() * diceType) + 1;
            results.push(result);
            total += result;
        }
        
        // Ajouter le modificateur
        total += modifier;
        
        return {
            diceType,
            numberOfDice,
            modifier,
            results,
            total
        };
    }
    
    /**
     * Récupère les informations d'une campagne (pour la démo)
     */
    getGameInfo(gameId) {
        // Simuler une campagne de démo
        return {
            id: gameId || 'terres-oubliees-01',
            title: 'Aventure dans les Terres Oubliées',
            description: 'Une aventure épique dans un monde fantastique peuplé de créatures mystérieuses et de magie ancienne.',
            genre: 'fantasy'
        };
    }
    
    /**
     * Récupère la liste des joueurs (pour la démo)
     */
    getPlayersList(gameId) {
        // Liste des joueurs de démo
        return [
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
    }
    
    /**
     * Récupère l'historique des messages (pour la démo)
     */
    getMessageHistory(gameId) {
        // Messages de démo
        return [
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
    
    /**
     * Envoie un message au LLM et récupère la réponse
     */
    async sendMessage(gameId, message) {
        const gameInfo = this.getGameInfo(gameId);
        const messageHistory = this.getMessageHistory(gameId);
        
        // Ajouter le message actuel à l'historique pour le prompt
        const combinedHistory = [...messageHistory, message];
        
        // Créer le prompt pour le LLM
        const prompt = this.createDMPrompt(messageHistory, message, gameInfo);
        
        // Envoyer la requête à Ollama
        const dmResponse = await this.sendToOllama(prompt);
        
        // Créer la réponse du Maître du Jeu
        return {
            content: dmResponse,
            sender: 'Maître du Jeu',
            avatar: 'M',
            type: 'dm',
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Change le modèle Ollama à utiliser
     */
    setModel(modelName) {
        this.ollamaModel = modelName;
        console.log(`Modèle Ollama changé pour: ${modelName}`);
    }
}

// Créer une instance du client API
const apiClient = new ApiClient();