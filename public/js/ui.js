/**
 * Gestion de l'interface utilisateur
 */

class UIManager {
    constructor() {
        // Éléments du DOM
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.diceButton = document.getElementById('dice-button');
        this.mapButton = document.getElementById('map-button');
        this.clearButton = document.getElementById('clear-button');
        this.settingsButton = document.getElementById('settings-button');
        
        // Liste des joueurs pour simuler différentes personnes (pour la démo)
        this.demoPlayers = [
            new Player('1', 'Galadriel', 'Elfe Mage', 'G'),
            new Player('2', 'Thorin', 'Nain Guerrier', 'T'),
            new Player('3', 'Aragorn', 'Humain Rôdeur', 'A'),
            new Player('4', 'Legolas', 'Elfe Archer', 'L')
        ];
        
        // Joueur actuel (pour la démo)
        this.currentPlayerIndex = 0;
        
        // Initialisation de l'état
        this.initialized = false;
    }
    
    /**
     * Initialise le gestionnaire d'interface
     */
    init(chatManager) {
        this.chatManager = chatManager;
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
        
        // Initialisation terminée
        this.initialized = true;
        console.log('UI manager initialized');
    }
    
    /**
	 * Configure les écouteurs d'événements
	 */
	setupEventListeners() {
	    // ... code existant ...
	
	    // Écouter l'événement de réinitialisation du jeu
	    document.addEventListener('game:reset', (event) => {
	        console.log('Événement de réinitialisation reçu:', event.detail);
		
	        // Mettre à jour l'interface avec le nouveau jeu
	        const game = event.detail.game;
	        const player = event.detail.player;
		
	        // Mettre à jour le titre de la campagne
	        document.querySelector('.chat-header h2').textContent = game.title;
	        document.getElementById('current-campaign').textContent = game.title;
		
	        // Mettre à jour la liste des joueurs
	        this.updatePlayerList(game.players);
		
	        // Réinitialiser le joueur actif
	        this.currentPlayerIndex = 0;
	        this.selectPlayer(0, false); // Ne pas ajouter de message système lors de la réinitialisation
		
	        // Afficher un message de notification
	        this.showNotification("Le jeu a été réinitialisé. Une nouvelle aventure commence!");
	    });
	}
    
    /**
     * Gère l'envoi d'un message
     */
    handleSendMessage() {
        if (!this.initialized) {
            console.error('UI manager not initialized');
            return;
        }
        
        const message = this.messageInput.value.trim();
        if (message) {
            // Obtenir le joueur actuel
            let currentPlayer;
            
            if (this.chatManager.currentPlayer) {
                // Utiliser le joueur défini dans le chat manager
                currentPlayer = this.chatManager.currentPlayer;
            } else {
                // Utiliser un joueur de démo
                currentPlayer = this.demoPlayers[this.currentPlayerIndex];
            }
            
            // Envoyer le message
            this.chatManager.sendPlayerMessage(message);
            
            // Vider le champ de saisie
            this.messageInput.value = '';
        }
    }
    
    /**
	 * Sélectionne un joueur pour l'utilisateur actuel
	 * @param {number} index - Index du joueur à sélectionner
	 * @param {boolean} showMessage - Afficher un message dans le chat (défaut: true)
	 */
	selectPlayer(index, showMessage = true) {
	    // Mettre à jour l'index du joueur actuel
	    this.currentPlayerIndex = index;
	    this.chatManager.currentPlayer = this.demoPlayers[index];
	
	    // Mettre à jour l'interface
	    document.querySelectorAll('.player').forEach((el, i) => {
	        if (i === index) {
	            el.classList.add('active');
	        } else {
	            el.classList.remove('active');
	        }
	    });
	
	    // Afficher un message dans le chat si demandé
	    if (showMessage) {
	        this.chatManager.addMessage(
	            `Vous contrôlez maintenant ${this.demoPlayers[index].name} (${this.demoPlayers[index].character})`,
	            'Système',
	            'S',
	            CONFIG.ui.messageTypes.SYSTEM
	        );
	    }
	}

	/**
	 * Affiche une notification à l'utilisateur
	 * @param {string} message - Message à afficher
	 */
	showNotification(message) {
	    // Vérifier si le conteneur de statut existe
	    let statusContainer = document.getElementById('status-container');
	
	    if (!statusContainer) {
	        // Créer le conteneur de statut
	        statusContainer = document.createElement('div');
	        statusContainer.id = 'status-container';
	        statusContainer.className = 'status-container';
		
	        // Ajouter au corps du document
	        document.body.appendChild(statusContainer);
	    }
	
	    // Créer le message de statut
	    const statusMessage = document.createElement('div');
	    statusMessage.className = 'status-message';
	    statusMessage.textContent = message;
	
	    // Ajouter le message au conteneur
	    statusContainer.appendChild(statusMessage);
	
	    // Supprimer après quelques secondes
	    setTimeout(() => {
	        statusMessage.classList.add('fade-out');
	        setTimeout(() => {
	            statusMessage.remove();
			
	            // Supprimer le conteneur s'il est vide
	            if (statusContainer.children.length === 0) {
	                statusContainer.remove();
	            }
	        }, 500);
	    }, 5000);
	}
    
    /**
     * Affiche une fenêtre modale pour les jets de dés
     */
    showDiceRollModal() {
        // Vérifier s'il existe déjà une modale
        let modal = document.getElementById('dice-modal');
        
        // Si elle n'existe pas, la créer
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dice-modal';
            modal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const title = document.createElement('h2');
            title.textContent = 'Jet de dés';
            
            const form = document.createElement('form');
            form.id = 'dice-form';
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleDiceRoll();
            });
            
            // Type de dé
            const diceTypeLabel = document.createElement('label');
            diceTypeLabel.textContent = 'Type de dé: ';
            diceTypeLabel.htmlFor = 'dice-type';
            
            const diceTypeSelect = document.createElement('select');
            diceTypeSelect.id = 'dice-type';
            
            CONFIG.dice.types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = `d${type}`;
                diceTypeSelect.appendChild(option);
            });
            
            // Nombre de dés
            const diceCountLabel = document.createElement('label');
            diceCountLabel.textContent = 'Nombre de dés: ';
            diceCountLabel.htmlFor = 'dice-count';
            
            const diceCountInput = document.createElement('input');
            diceCountInput.type = 'number';
            diceCountInput.id = 'dice-count';
            diceCountInput.min = '1';
            diceCountInput.max = '10';
            diceCountInput.value = '1';
            
            // Modificateur
            const modifierLabel = document.createElement('label');
            modifierLabel.textContent = 'Modificateur: ';
            modifierLabel.htmlFor = 'dice-modifier';
            
            const modifierInput = document.createElement('input');
            modifierInput.type = 'number';
            modifierInput.id = 'dice-modifier';
            modifierInput.value = '0';
            
            // Boutons
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'modal-buttons';
            
            const rollButton = document.createElement('button');
            rollButton.type = 'submit';
            rollButton.textContent = 'Lancer';
            
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.textContent = 'Annuler';
            cancelButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            // Assembler le formulaire
            form.appendChild(diceTypeLabel);
            form.appendChild(diceTypeSelect);
            form.appendChild(document.createElement('br'));
            form.appendChild(diceCountLabel);
            form.appendChild(diceCountInput);
            form.appendChild(document.createElement('br'));
            form.appendChild(modifierLabel);
            form.appendChild(modifierInput);
            form.appendChild(document.createElement('br'));
            
            buttonsDiv.appendChild(rollButton);
            buttonsDiv.appendChild(cancelButton);
            form.appendChild(buttonsDiv);
            
            // Assembler la modale
            modalContent.appendChild(title);
            modalContent.appendChild(form);
            modal.appendChild(modalContent);
            
            // Ajouter la modale au document
            document.body.appendChild(modal);
            
            // Fermer la modale en cliquant en dehors
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Afficher la modale
        modal.style.display = 'flex';
    }
    
    /**
     * Gère le lancement de dés
     */
    handleDiceRoll() {
        const diceType = parseInt(document.getElementById('dice-type').value);
        const diceCount = parseInt(document.getElementById('dice-count').value);
        const modifier = parseInt(document.getElementById('dice-modifier').value);
        
        // Créer et lancer les dés
        const diceRoll = apiClient.rollDice(diceType, diceCount, modifier);
        
        // Ajouter le résultat au chat
        this.chatManager.addDiceRollMessage(diceRoll);
        
        // Fermer la modale
        document.getElementById('dice-modal').style.display = 'none';
    }
    
    /**
     * Met à jour la liste des joueurs dans l'interface
     */
    updatePlayerList(players) {
        const playerListElement = document.querySelector('.player-list');
        const playersHeader = playerListElement.querySelector('h3');
        
        // Vider la liste des joueurs tout en gardant le titre
        playerListElement.innerHTML = '';
        playerListElement.appendChild(playersHeader);
        
        // Ajouter chaque joueur à la liste
        players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            if (index === this.currentPlayerIndex) {
                playerDiv.classList.add('active');
            }
            
            playerDiv.addEventListener('click', () => {
                this.selectPlayer(index);
            });
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'player-avatar';
            avatarDiv.textContent = player.avatar;
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.textContent = player.getDisplayName ? player.getDisplayName() : `${player.name} (${player.character})`;
            
            playerDiv.appendChild(avatarDiv);
            playerDiv.appendChild(nameDiv);
            
            playerListElement.appendChild(playerDiv);
        });
    }
}