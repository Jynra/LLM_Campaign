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
		// Envoi de message
		this.sendButton.addEventListener('click', () => this.handleSendMessage());
		this.messageInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				this.handleSendMessage();
			}
		});
		
		// Jets de dés
		this.diceButton.addEventListener('click', () => this.showDiceRollModal());
		
		// Carte (à implémenter)
		this.mapButton.addEventListener('click', () => {
			console.log('Map button clicked - functionality not implemented');
			// Implémentation future
		});
		
		// Paramètres (à implémenter)
		this.settingsButton.addEventListener('click', () => {
			console.log('Settings button clicked - functionality not implemented');
			// Implémentation future
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
				
				// Passer au joueur suivant pour la démo
				this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.demoPlayers.length;
			}
			
			// Envoyer le message
			this.chatManager.sendPlayerMessage(message);
			
			// Vider le champ de saisie
			this.messageInput.value = '';
		}
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
		const diceRoll = new DiceRoll(diceType, diceCount, modifier).roll();
		
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
		players.forEach(player => {
			const playerDiv = document.createElement('div');
			playerDiv.className = 'player';
			
			const avatarDiv = document.createElement('div');
			avatarDiv.className = 'player-avatar';
			avatarDiv.textContent = player.avatar;
			
			const nameDiv = document.createElement('div');
			nameDiv.className = 'player-name';
			nameDiv.textContent = player.getDisplayName();
			
			playerDiv.appendChild(avatarDiv);
			playerDiv.appendChild(nameDiv);
			
			playerListElement.appendChild(playerDiv);
		});
	}
}