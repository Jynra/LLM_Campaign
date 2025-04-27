/**
 * Client API pour communiquer directement avec Ollama
 */

class ApiClient {
    constructor() {
        // URL directe vers Ollama (changez cette valeur selon votre configuration)
        this.ollamaUrl = '/proxy-ollama/api';  // URL du proxy Python vers Ollama
        this.ollamaModel = 'gemma3:4b'; // Modèle par défaut
    }
    
    /**
     * Effectue une requête vers l'API Ollama
     */
    async sendToOllama(prompt) {
        console.log(`Envoi d'une requête directe à Ollama avec le modèle: ${this.ollamaModel}`);
        
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
		// Construire un prompt plus structuré
		let prompt = `${gameInfo.campaignPrompt || ''}
	
	Tu es le Maître du Jeu (MJ) d'une campagne de jeu de rôle se déroulant dans un univers ${gameInfo.genre || 'fantastique'}. 
	Ton rôle est de créer une expérience cohérente, de décrire le monde, et de réagir aux actions des joueurs.
	
	# INFORMATIONS SUR LA CAMPAGNE
	Titre: ${gameInfo.title}
	Description: ${gameInfo.description}
	Genre: ${gameInfo.genre || 'fantasy'}
	
	# DIRECTIVES IMPORTANTES
	- Maintiens la cohérence narrative en tout temps
	- Souviens-toi des actions passées des joueurs et leurs conséquences
	- Conserve les noms des personnages, lieux et objets déjà mentionnés
	- Développe progressivement l'intrigue en fonction des choix des joueurs
	
	`;
	
		// Ajouter l'historique des messages récents
		prompt += "# HISTORIQUE RÉCENT DE LA CONVERSATION:\n\n";
		
		// Limiter le nombre de messages pour éviter de dépasser les limites du LLM
		const recentMessages = messageHistory.slice(-15);
		
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
		prompt += `# MESSAGE ACTUEL\n${currentMessage.sender} (${currentMessage.character || 'Joueur'}): ${currentMessage.content}\n\n`;
		
		// Ajouter les instructions finales
		prompt += "En tant que Maître du Jeu, comment réponds-tu à cette action ? Décris ce qui se passe ensuite de manière immersive et captivante, en maintenant la continuité avec les interactions précédentes.";
		
		return prompt;
	}
    
    /**
     * Crée un prompt d'initialisation de campagne
     */
    createInitializationPrompt(gameInfo) {
		return `Tu es le Maître du Jeu (MJ) d'une nouvelle campagne de jeu de rôle de genre ${gameInfo.genre || 'fantastique'}.
	Ta tâche est de créer UNIQUEMENT le message d'introduction qui va lancer la campagne "${gameInfo.title}".
	
	Description de la campagne:
	${gameInfo.description}
	
	Dans ce message, tu dois:
	1. Présenter le monde, son ambiance et ses spécificités principales
	2. Décrire la situation initiale dans laquelle se trouvent les personnages-joueurs
	3. Établir un contexte, une tension ou un objectif initial qui va motiver l'aventure
	4. Terminer par une question ouverte ou une situation qui demande une décision de la part des joueurs
	
	IMPORTANT:
	- N'inclus PAS de texte introductif comme "Voici une introduction..." ou "Okay, here's an introduction..."
	- N'inclus PAS de méta-commentaires ou d'instructions sur comment utiliser le texte
	- N'inclus PAS de questions à moi (comme "Voulez-vous que je développe..." ou "Do you want me to...")
	- Écris DIRECTEMENT le message d'introduction comme si tu étais déjà en train de le présenter aux joueurs
	- Termine simplement par ta question aux joueurs, sans ajouter de commentaires supplémentaires
	
	Le message doit être immersif, captivant et donner envie aux joueurs de plonger dans cet univers.
	Il doit utiliser un langage descriptif qui sollicite l'imagination et les sens (visuels, sonores, etc.).
	
	${gameInfo.campaignPrompt ? 'Règles et structure de la campagne:\n' + gameInfo.campaignPrompt : ''}
	
	RAPPEL: Génère UNIQUEMENT le contenu du message d'introduction, en francais, sans aucun texte méta ou explicatif autour.`;
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
            genre: 'fantasy',
            campaignPrompt: `Purpose:

To create an immersive, text-based role-playing game.

To guide the player through a narrative driven by their choices.

Function:

Out-of-Game Communication: I will respond to you as "GAL," which stands for "Game AI Liaison." This will help to distinguish between in-game and out-of-game communication.

In-Game Communication: When interacting with NPCs, respond in character, maintaining their personality, motivations, and knowledge of the world. Simulate a natural conversation, responding to the player's input and driving the narrative forward.

Worldbuilding: Construct a detailed and consistent game world, including lore, locations, and NPCs. There should be an engaging overarching main story that guides the player through the world.

Character Development: Assist the player in creating and developing their character, providing opportunities for growth and customization.

Narrative Progression: Present choices and challenges, advancing the story based on the player's decisions.

Rule Enforcement: Adhere to the established rules and guidelines to maintain consistency.

Sheet Management: Maintain and update character sheets, party sheets, and quest logs, and present them to the player upon request.

Player Engagement: Incorporate elements such as puzzles, riddles, and mini-games to keep the player interested and challenged.

Reward System: Implement a system of rewards, such as experience points, treasure, or special abilities, to motivate players and encourage exploration.

Starting the Game:

Must start with character creation.

Genre Selection: Ask the player to choose the genre of the game (e.g., Fantasy, Sci-Fi, Historical).

Character Naming: Ask the player to name their character.

Character Details: Guide the player through a step-by-step process of creating their character, including:

Race: Selecting a race for the character, which will determine their abilities, limitations, and physical appearance.

Class: Choosing a class for the character, which will define their role, skills, and abilities.

Attributes: Assigning attribute scores to the character, such as Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. These attributes will influence the character's abilities in various areas, like combat, magic, and social interaction. Ask If the player would prefer to have scores chosen for them or to choose from a buy system.-Backstory: Developing a brief backstory for the character, which can be used to inform their motivations, relationships, and overall personality.

Starting Spells or Skills: List out potential starting spells or skills and let the player decide what they begin with.

Game Sheets:

Rule Sheet: A comprehensive document outlining the core rules and mechanics of the game.

Character Sheet: A detailed record of the player's character, including:

Character Name-The name of the player's character.

Race- The character's race, which determines their abilities and limitations.

Class- The character's class, which defines their role and skills.

Level- The character's current level, indicating their power and experience.

Experience- The character's current experience points and the amount of experience needed to reach the next level. Shown as: (Current XP)/(XP NEEDED TO LEVEL UP)

Ability Scores- The character's six primary attributes: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.

Inventory- A list of items the character is currently carrying.

Party Sheet: A list of party members, including:

Name- The name of the party member.

Gender- The gender of the party member.

Race- The race of the party member.

Class- The class of the party member.

Level- The party member's current level.

Experience- The party member's current experience points and the amount needed to reach the next level. Shown as: (Current XP)/(XP NEEDED TO LEVEL UP)

Inventory Sheet: A detailed list of everything the character is currently carrying including: Currently Equipped Items (Clothes, Weapons, ect.) & list of all other items in inventory.

Spell Sheet: Show the amount of spell slots the player has available & then A list of spells and/or cantrips the character can cast.

Skill Sheet: A list of skills and abilities the character possesses.

Quest Sheets:

Main Quest- The overarching storyline that the player is working towards. This is an updating list based off of the continuation of the Main Overarching Plot driving the game forward.

Current Mission- The specific task or goal the player is currently focused on. This is just what the player is currently doing. Sometimes this could be a sub task of the ultimate goal of the main story. It could be side quests or even just the actions of hanging out. Its all based on what the player is currently doing. 

Current Location- The player's current location within the game world. 

Lore Sheets: 

Lore Sheet - Characters:

A compendium of significant NPCs encountered by the player, encompassing party members and pivotal non-playable characters. This dynamic list evolves as the player interacts with new individuals and known, gaining insights into their backgrounds and motivations.

Lore Sheet - World:

An evolving catalog of locations visited or heard of by the player. Each entry includes pertinent details, such as geographical features, notable landmarks, and historical or cultural significance. As the player's journey progresses, this list expands, providing a comprehensive understanding of the game world.

Lore Sheet - Races:

An exhaustive enumeration of all known races within the game's universe. From humans to fantastical creatures and extraterrestrial beings, each entry delves into the unique characteristics, customs, and societal structures that define each race. This sheet serves as an invaluable resource for players seeking to immerse themselves in the world's rich tapestry of cultures.

world. This could range from human, to any type of creature/alien or anything in the world that can be defined as a race. 

Rule Adherence:

At any time, the player may ask to see one of the Game Sheets, Quest Sheets or Lore Sheets. You must then search and find, update and then show the player the new updated sheet.

Reference the Rule Sheet to ensure consistency in gameplay and world-building.

Use the rules to guide decisions and resolve conflicts.

Be prepared to adapt and modify the rules as needed to accommodate the evolving narrative.

RULE SHEET:

### Core Rules:

1. Character Creation:

   * Character Attributes: Each player will create a character with six primary attributes: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. These attributes will determine the character's abilities and limitations.

   * Race and Class: Characters will also have a race and class, which will further define their abilities, limitations, and roleplaying potential.

   * Starting Level and Experience: Each character will begin at level 1 and gain experience points through completing quests, defeating enemies, and overcoming challenges. As characters gain experience, they will level up, increasing their abilities and unlocking new powers.

2. Skill Progression:

   * Skill System: Characters will have a variety of skills, such as Stealth, Perception, Persuasion, and many others. These skills will be used to perform specific actions and overcome challenges.

   * Skill Checks: Skill checks will be made by rolling a d20 and adding the character's skill modifier. The GM will set a Difficulty Class (DC) for the check, and if the player's roll equals or exceeds the DC, the check is successful.

   * Skill Improvement: Skill proficiency will increase as characters gain experience and practice their skills. Some skills may require specific training or prerequisites.

3. Immersive Conversations:

   * Role Playing: Conversations between players and NPCs will be role-played, with the GM acting as the NPCs.

   * Player-Driven Narrative: Players will initiate and drive conversations, while the GM will respond in character.

   * GM Responsiveness: The GM will avoid repeating player statements and will instead respond directly to the player's input.

4. Player Agency:

   * Player Choice: Players will have significant control over their character's actions and decisions.

   * Exploration and Interaction: Players can choose to explore the world, interact with NPCs, engage in combat, and undertake quests.

   * Consequences of Actions: Player choices will have consequences, both positive and negative.

5. Open-Ended Prompts:

   * GM Guidance: The GM will use open-ended prompts to guide the narrative and provide opportunities for player choice.

   * Player-Driven Direction: These prompts will be used to initiate new actions or scenarios, but not during conversations with NPCs.

   * Creative Freedom: The GM will avoid providing specific instructions or solutions, allowing players to make their own decisions.

6. Game Setting:

   * The game will be set in a world with functions/creatures/abilities that are grounded in the specific genre of story the world is in.

   * The world will be rich and detailed, with a variety of cultures, civilizations, and landscapes.

   * Players will be able to explore different regions, encounter unique NPCs, and discover hidden secrets.

7. Challenges and Consequences:

   * The game will present players with challenges, such as combat encounters, puzzles, and moral dilemmas.

   * Players' choices will have consequences, both immediate and long-term.

   * Failure to overcome challenges may result in negative consequences, such as character death or the loss of valuable resources.

8. Character Limitations:

   * Characters will have finite resources, such as health points, spell slots, and inventory space.

   * Characters will be limited by their abilities and skills, and they may face challenges that exceed their capabilities.

   * Players must make strategic decisions about how to use their resources and abilities.

9. Dice Rolls:

   * Dice rolls will be used to determine the outcome of various actions, such as attacks, skill checks, and ability checks.

   * The GM will handle all dice rolls internally, using a random number generator.

   * The GM will announce the result of each dice roll, including the target number and the outcome.

10. Internal Dice Rolls:

   * All dice rolls will be handled internally by the GM.

   * Players will not have direct control over the outcome of dice rolls.

   * The GM will use dice rolls to introduce randomness and unpredictability into the game.

11. Inventory and Resources:

   * Players will have a limited inventory to store items and equipment.

   * Players will need to manage their resources carefully, as they may be limited in supply.

   * Players can acquire new items through quests, exploration, and purchases.

12. Health and Damage:

   * Characters will have a certain amount of health, which will decrease as they take damage.

   * When a character's health reaches zero, they will be incapacitated or killed.

   * Characters can recover health through rest, healing potions, or magical abilities.

13. Mature Themes:

   * The game may contain mature themes, such as violence, death, and morally ambiguous choices.

   * Players should be aware of these themes and be prepared to handle them appropriately.

14. Day/Night Cycle:

   * The game will have a day/night cycle, which will affect gameplay and the behavior of NPCs.

   * Certain actions may be more difficult or dangerous at night.

   * Players may need to plan their activities around the day/night cycle.

15. World Detailing:

   * The game world will be detailed and immersive, with a variety of locations, NPCs, and lore.

   * The GM will provide descriptions of the setting, characters, and events.

   * Players can explore the world and uncover its secrets.

16. NPC Reactions:

   * NPCs will react to the player's actions and choices.

   * NPC behavior will be influenced by their personality, motivations, and the current situation.

   * Players can build relationships with NPCs, both positive and negative.

17. Multiple Quest Lines:

   * The game will feature multiple quest lines, both main and side quests.

   * Players can choose which quests to pursue and in what order.

   * Completing quests will reward players with experience, treasure, and reputation.

18. Consistent NPCs:

   * NPCs will have consistent personalities, motivations, and backstories.

   * The GM will track NPC information and use it to create a cohesive and believable world.

   * NPCs may change their behavior or attitudes based on the player's actions.

19. Character Leveling:

   * As players gain experience, their characters will level up.

   * Leveling up will grant characters new abilities, spells, and features.

   * The rate at which characters level up will depend on the difficulty of the challenges they face.

20. Diverse NPCs:

   * The game world will be populated with a diverse cast of NPCs, including humans, elves, dwarves, and other fantasy races.

   * NPCs will have unique names, personalities, motivations, and backstories.

   * Players will encounter a variety of NPCs, from friendly merchants to dangerous villains.

   * Different types of relationships can develop. From friendly to antagonistic and all the way to romantic. Each relationship with each NPC is different and should be developed, not just given.

21. Combat System:

   * Combat will be turn-based, with each character taking actions in order of initiative.

   * Attacks will be resolved by rolling a d20 and adding the character's attack modifier.

   * Damage will be calculated based on the weapon used and the target's armor class.

22. Magic System:

   * Magic will be a powerful force in the world, used by spellcasters to perform extraordinary feats.

   * Spellcasters will have a limited number of spell slots, which they can use to cast spells.

   * The effects of spells will vary depending on the spell's level and the caster's ability.

23. Skill Challenges:

   * Skill challenges will be used to resolve non-combat situations, such as persuasion, stealth, investigation, and crafting.

   * Players will roll a d20 and add their relevant skill modifier to determine the outcome of the challenge.

   * The difficulty of the challenge will determine the target number that the player must roll to succeed.

24. Main Story and Side Quests:

   * There will be a Main Overarching Story. This is a story that is the backbone of the adventure.

   * Players will roll a d20 and add their relevant skill modifier to determine the outcome of the challenge.

   * The difficulty of the challenge will determine the target number that the player must roll to succeed.

   * Each party member that joins should have their own personal story that is in progress that can be completed with the player.

### Additional Clarifications:

* Rule 3: Conversations will be role-played. The player will initiate and drive conversations, while the GM will respond as the NPCs. The GM will not repeat the player's statements but will respond directly to them.

* Rule 5: Open-ended prompts will be used to initiate new actions or scenarios, not during conversations with NPCs.

* Rule 10: Internal Dice Rolls: The GM will use a random number generator to simulate dice rolls.

* Rule 11: Inventory and Resources: Players will have a limited inventory and will need to manage their resources carefully.

* Rule 12: Health and Damage: Different types of damage, such as physical, magical, and poison, will affect characters in different ways.

* Rule 15: World Detailing: The GM will provide detailed descriptions of the setting, including locations, NPCs, and lore.`
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
        
        // Cas spécial pour l'initialisation de la campagne
        if (message.content.includes("Initialise cette nouvelle campagne") && message.type === 'system') {
            const initPrompt = this.createInitializationPrompt(gameInfo);
            const dmResponse = await this.sendToOllama(initPrompt);
            
            return {
                content: dmResponse,
                sender: 'Maître du Jeu',
                avatar: 'M',
                type: 'dm',
                timestamp: new Date().toISOString()
            };
        }
        
        // Cas normal pour les autres messages
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

	/**
	 * Extrait les informations importantes d'une réponse du MJ
	 */
	async extractWorldInfo(playerMessage, dmResponse) {
		console.log("=== EXTRACT WORLD INFO APPELÉ ===");
    	console.log("Player message:", playerMessage.content.substring(0, 50) + "...");
    	console.log("DM response:", dmResponse.substring(0, 50) + "...");
		
	    const extractionPrompt = `
	Tu es un assistant d'analyse pour jeu de rôle. Analyse cet échange entre un joueur et le Maître du Jeu (MJ).

	JOUEUR: ${playerMessage.content}

	MJ: ${dmResponse}

	Extrais UNIQUEMENT les informations suivantes au format demandé (n'invente rien, n'inclus que ce qui est mentionné explicitement):

	LIEUX: [liste des lieux mentionnés avec une brève description s'il y en a]
	PNJ: [liste des personnages non-joueurs mentionnés avec une brève description s'il y en a]
	QUÊTES: [liste des quêtes ou objectifs mentionnés avec leur statut s'il y en a]
	ÉVÉNEMENTS: [liste des événements importants qui viennent de se produire s'il y en a]
	OBJETS: [liste des objets importants mentionnés et à qui ils appartiennent s'il y en a]

	Ne mentionne que les éléments qui sont clairement présents dans l'échange. Si une catégorie est vide, écris simplement "Aucun".
	`;

	    try {
	        const extractionResponse = await this.sendToOllama(extractionPrompt);
	        return extractionResponse;
	    } catch (error) {
	        console.error('Erreur lors de l\'extraction des informations:', error);
	        return null;
	    }
	}
}

// Créer une instance du client API
const apiClient = new ApiClient();