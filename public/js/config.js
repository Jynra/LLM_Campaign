/**
 * Configuration globale pour l'application de roleplay
 */
const CONFIG = {
    // Configuration du jeu
    game: {
        defaultGameId: 'terres-oubliees-01',
        maxHistoryMessages: 100  // Nombre maximum de messages à conserver dans l'historique
    },
    
    // Configuration des dés
    dice: {
        types: [4, 6, 8, 10, 12, 20, 100]  // Types de dés disponibles (d4, d6, etc.)
    },
    
    // Configuration de l'interface utilisateur
    ui: {
        messageTypes: {
            DM: 'dm',
            PLAYER: 'player',
            SYSTEM: 'system'
        },
        colors: {
            primary: '#4a4e69',
            secondary: '#22223b',
            accent: '#9a8c98',
            light: '#f2e9e4',
            dark: '#22223b'
        }
    },
    
    // Configuration du maître du jeu IA
    dm: {
        name: 'Maître du Jeu',
        avatar: 'M',
        prompts: {
            start: "Tu es le maître du jeu d'une partie de jeu de rôle fantasy. Commence par décrire un monde fantastique et une situation initiale pour les joueurs.",
            continue: "Continue l'histoire en tenant compte des actions des joueurs. Sois descriptif et immersif. Ne prends pas de décisions à la place des joueurs."
        }
    }
};