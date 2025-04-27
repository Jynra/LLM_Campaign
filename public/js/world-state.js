/**
 * Gestion de l'état du monde et de la mémoire du jeu
 */
class WorldState {
    constructor(gameId) {
        this.gameId = gameId;
        this.locations = {};    // Lieux visités
        this.npcs = {};         // PNJ rencontrés
        this.quests = {};       // Quêtes actives
        this.events = [];       // Événements importants
        this.items = {};        // Objets importants
        
        // Clé pour le stockage local
        this.storageKey = `roleplay_world_state_${gameId}`;
        
        // Charger les données existantes
        this.load();
    }
    
    /**
     * Sauvegarde l'état du monde dans le stockage local
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                locations: this.locations,
                npcs: this.npcs,
                quests: this.quests,
                events: this.events,
                items: this.items
            }));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'état du monde:', error);
        }
    }
    
    /**
     * Charge l'état du monde depuis le stockage local
     */
    load() {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.locations = parsedState.locations || {};
                this.npcs = parsedState.npcs || {};
                this.quests = parsedState.quests || {};
                this.events = parsedState.events || [];
                this.items = parsedState.items || {};
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'état du monde:', error);
        }
    }
    
    /**
     * Ajoute ou met à jour un lieu
     */
    updateLocation(name, description) {
        this.locations[name] = {
            description,
            lastUpdated: new Date().toISOString()
        };
        this.save();
    }
    
    /**
     * Ajoute ou met à jour un PNJ
     */
    updateNPC(name, description) {
        this.npcs[name] = {
            description,
            lastUpdated: new Date().toISOString()
        };
        this.save();
    }
    
    /**
     * Ajoute ou met à jour une quête
     */
    updateQuest(name, status, description) {
        this.quests[name] = {
            status, // 'active', 'completed', 'failed'
            description,
            lastUpdated: new Date().toISOString()
        };
        this.save();
    }
    
    /**
     * Ajoute un événement important
     */
    addEvent(description) {
        this.events.push({
            description,
            timestamp: new Date().toISOString()
        });
        
        // Limiter le nombre d'événements stockés
        if (this.events.length > 50) {
            this.events = this.events.slice(-50);
        }
        
        this.save();
    }
    
    /**
     * Génère un résumé de l'état actuel du monde
     */
    getSummary() {
        let summary = "";
        
        // Résumé des lieux
        if (Object.keys(this.locations).length > 0) {
            summary += "# LIEUX IMPORTANTS\n";
            for (const [name, data] of Object.entries(this.locations)) {
                summary += `- ${name}: ${data.description}\n`;
            }
            summary += "\n";
        }
        
        // Résumé des PNJ
        if (Object.keys(this.npcs).length > 0) {
            summary += "# PERSONNAGES NON-JOUEURS\n";
            for (const [name, data] of Object.entries(this.npcs)) {
                summary += `- ${name}: ${data.description}\n`;
            }
            summary += "\n";
        }
        
        // Résumé des quêtes
        if (Object.keys(this.quests).length > 0) {
            summary += "# QUÊTES ACTIVES\n";
            for (const [name, data] of Object.entries(this.quests)) {
                summary += `- ${name} (${data.status}): ${data.description}\n`;
            }
            summary += "\n";
        }
        
        // Événements récents
        if (this.events.length > 0) {
            summary += "# ÉVÉNEMENTS IMPORTANTS (5 plus récents)\n";
            for (const event of this.events.slice(-5)) {
                summary += `- ${event.description}\n`;
            }
            summary += "\n";
        }
        
        return summary;
    }
    
    /**
     * Efface toutes les données
     */
    clear() {
        this.locations = {};
        this.npcs = {};
        this.quests = {};
        this.events = [];
        this.items = {};
        localStorage.removeItem(this.storageKey);
    }

	/**
	 * Traite un texte d'extraction pour mettre à jour l'état du monde
	 */
	processExtraction(extractionText) {
	    console.log("Traitement de l'extraction:", extractionText);
	
	    // Fonction pour extraire les éléments d'une section
	    const extractItems = (sectionText) => {
	        if (!sectionText || sectionText.includes("Aucun")) return [];
		
	        return sectionText.split('\n')
	            .map(line => line.trim())
	            .filter(line => line && (line.startsWith('-') || line.length > 3))
	            .map(line => line.startsWith('-') ? line.substring(1).trim() : line);
	    };
	
	    try {
	        // Extraction des sections par catégorie
	        const locationMatch = extractionText.match(/LIEUX:(.*?)(?=PNJ:|$)/s);
	        const npcMatch = extractionText.match(/PNJ:(.*?)(?=QUÊTES:|$)/s);
	        const questMatch = extractionText.match(/QUÊTES:(.*?)(?=ÉVÉNEMENTS:|$)/s);
	        const eventMatch = extractionText.match(/ÉVÉNEMENTS:(.*?)(?=OBJETS:|$)/s);
	        const itemMatch = extractionText.match(/OBJETS:(.*?)(?=$)/s);
		
	        // Traitement des lieux
	        if (locationMatch && locationMatch[1]) {
	            const locations = extractItems(locationMatch[1]);
	            locations.forEach(loc => {
	                const [name, ...descParts] = loc.split(':');
	                if (name) {
	                    const description = descParts.length ? descParts.join(':').trim() : 'Lieu découvert';
	                    this.updateLocation(name.trim(), description);
	                }
	            });
	        }
		
	        // Traitement des PNJ
	        if (npcMatch && npcMatch[1]) {
	            const npcs = extractItems(npcMatch[1]);
	            npcs.forEach(npc => {
	                const [name, ...descParts] = npc.split(':');
	                if (name) {
	                    const description = descParts.length ? descParts.join(':').trim() : 'Personnage rencontré';
	                    this.updateNPC(name.trim(), description);
	                }
	            });
	        }
		
	        // Traitement des quêtes
	        if (questMatch && questMatch[1]) {
	            const quests = extractItems(questMatch[1]);
	            quests.forEach(quest => {
	                const [name, ...descParts] = quest.split(':');
	                if (name) {
	                    const description = descParts.length ? descParts.join(':').trim() : 'Quête active';
	                    this.updateQuest(name.trim(), 'active', description);
	                }
	            });
	        }
		
	        // Traitement des événements
	        if (eventMatch && eventMatch[1]) {
	            const events = extractItems(eventMatch[1]);
	            events.forEach(event => {
	                if (event) {
	                    this.addEvent(event);
	                }
	            });
	        }
		
	        this.save();
	        console.log("État du monde mis à jour:", this);
	        return true;
	    } catch (error) {
	        console.error('Erreur lors du traitement de l\'extraction:', error);
	    }
	
	    return false;
	}
}