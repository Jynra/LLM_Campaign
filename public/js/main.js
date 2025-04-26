/**
 * Point d'entrée principal de l'application
 */

// Instancier les gestionnaires
const chatManager = new ChatManager();
const uiManager = new UIManager();

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si la modale de bienvenue a déjà été affichée
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (!welcomeShown) {
        showWelcomeModal();
    }
    
    // Initialiser l'application
    initializeApp();
    
    // Vérifier si Ollama est disponible
    checkOllamaConnection();
});

/**
 * Initialise l'application
 */
async function initializeApp() {
    try {
        console.log('Initializing application...');
        
        // Récupérer l'ID de la campagne (par défaut pour la démo)
        const gameId = getGameIdFromUrl() || CONFIG.game.defaultGameId;
        
        // Récupérer les informations de la campagne (mode démo)
        const gameInfo = apiClient.getGameInfo(gameId);
        console.log('Game info loaded:', gameInfo);
        
        // Récupérer les joueurs (mode démo)
        const playerObjects = apiClient.getPlayersList(gameId).map(player => Player.fromJSON(player));
        console.log('Players loaded:', playerObjects);
        
        // Récupérer l'historique des messages (mode démo)
        const messageObjects = apiClient.getMessageHistory(gameId).map(message => Message.fromJSON(message));
        console.log('Message history loaded:', messageObjects);
        
        // Créer l'objet Game
        const game = new Game(
            gameInfo.id,
            gameInfo.title,
            gameInfo.description,
            playerObjects,
            messageObjects
        );
        
        // Stockage global du jeu pour permettre la réinitialisation
        window.currentGameData = {
            gameInfo: gameInfo,
            players: playerObjects
        };
        
        // Sélectionner le joueur actuel (premier joueur pour la démo)
        const currentPlayer = playerObjects[0];
        
        // Initialiser le gestionnaire de chat
        chatManager.init(game, currentPlayer);
        
        // Initialiser le gestionnaire d'interface
        uiManager.init(chatManager);
        
        // Mettre à jour l'interface avec les données chargées
        updateInterface(game);
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        displayErrorMessage('Impossible de charger l\'application. Veuillez réessayer plus tard.');
    }
}

/**
 * Vérifie la connexion à Ollama et les modèles disponibles
 */
async function checkOllamaConnection() {
    try {
        // Vérifier les modèles disponibles
        const models = await apiClient.checkAvailableModels();
        
        if (models && models.length > 0) {
            console.log('Ollama connection successful. Available models:', models);
            
            // Mettre à jour l'indicateur de statut
            updateOllamaStatus(true);
            
            // Mettre à jour le sélecteur de modèles si présent
            const modelSelect = document.getElementById('model-select');
            if (modelSelect) {
                modelSelect.innerHTML = '';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    modelSelect.appendChild(option);
                });
                
                // Définir le modèle par défaut
                modelSelect.value = apiClient.ollamaModel;
                
                // Écouter les changements
                modelSelect.addEventListener('change', () => {
                    apiClient.setModel(modelSelect.value);
                });
            }
        } else {
            console.warn('No Ollama models found or connection issue. Using demo mode.');
            updateOllamaStatus(false);
            displayStatusMessage('Mode démo : Connexion à Ollama non disponible ou aucun modèle trouvé');
        }
    } catch (error) {
        console.error('Error checking Ollama connection:', error);
        updateOllamaStatus(false);
        displayStatusMessage('Erreur de connexion à Ollama. Mode démo activé.');
    }
}

/**
 * Récupère l'ID de jeu depuis l'URL
 */
function getGameIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('game');
}

/**
 * Met à jour l'interface avec les données de la campagne
 */
function updateInterface(game) {
    // Mettre à jour le titre de la campagne
    document.querySelector('.chat-header h2').textContent = game.title;
    document.getElementById('current-campaign').textContent = game.title;
    
    // Mettre à jour la liste des joueurs
    uiManager.updatePlayerList(game.players);
    
    // Charger les messages initiaux
    chatManager.refreshChatDisplay();
}

/**
 * Affiche un message d'erreur
 */
function displayErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Ajouter en haut de la page
    document.body.insertBefore(errorDiv, document.body.firstChild);
    
    // Supprimer après quelques secondes
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Affiche un message de statut dans l'interface
 */
function displayStatusMessage(message) {
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

// Afficher la modale de bienvenue
function showWelcomeModal() {
    const welcomeModal = document.getElementById('welcome-modal');
    
    // Sélectionner le bouton par sa classe ou son texte
    const continueButton = document.querySelector('.modal-buttons button') || 
                           document.querySelector('button:contains("Commencer l\'aventure")');
    
    if (welcomeModal && continueButton) {
        welcomeModal.style.display = 'flex';
        
        // Ajout du log pour vérifier que l'événement est bien attaché
        console.log("Attaching click event to welcome button");
        
        // Utiliser onclick directement peut aider à résoudre certains problèmes
        continueButton.onclick = function() {
            console.log("Welcome button clicked");
            welcomeModal.style.display = 'none';
            localStorage.setItem('welcomeShown', 'true');
        };
        
        // Alternative avec addEventListener
        continueButton.addEventListener('click', function() {
            console.log("Welcome button clicked (addEventListener)");
            welcomeModal.style.display = 'none';
            localStorage.setItem('welcomeShown', 'true');
        });
    } else {
        console.error("Modal or button not found", {
            modal: welcomeModal, 
            button: continueButton
        });
    }
}

// Mise à jour de l'indicateur de statut Ollama
function updateOllamaStatus(isConnected) {
    const statusElement = document.getElementById('ollama-status');
    if (statusElement) {
        if (isConnected) {
            statusElement.className = 'ollama-status connected';
            statusElement.textContent = 'Ollama connecté';
        } else {
            statusElement.className = 'ollama-status disconnected';
            statusElement.textContent = 'Ollama non disponible (mode démo)';
        }
    }
}

/**
 * Fonction pour le déboggage (mode développement)
 */
function debug(message, data) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`[DEBUG] ${message}`, data);
    }
}