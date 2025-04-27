#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.request
import urllib.error
import urllib.parse
import threading
import os
import sys
import requests
from http import HTTPStatus

# Configuration
PORT = 9425
# Liste des URLs vers Ollama à essayer, en ordre de priorité
OLLAMA_URLS = [
    "http://172.17.0.8:11434",  # URL principale vers Ollama sur le réseau Docker
    "http://172.17.0.4:11434",   # URL alternative en localhost
    "http://localhost:11434"  # URL alternative pour Docker Desktop
]

# URL active pour Ollama, sera définie par la fonction test_ollama_connection
OLLAMA_URL = None

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        # Gestion des requêtes OPTIONS pour CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
    
    def do_POST(self):
        # Vérifier si c'est une requête pour le proxy Ollama
        if self.path.startswith('/proxy-ollama/'):
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Récupérer l'URL cible sur Ollama
            target_path = self.path.replace('/proxy-ollama/', '')
            target_url = f"{OLLAMA_URL}/{target_path}"
            
            print(f"Forwarding POST request to: {target_url}")
            
            try:
                # Effectuer la requête vers Ollama
                response = requests.post(
                    target_url,
                    data=post_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                print(f"Ollama response status: {response.status_code}")
                
                # Envoyer la réponse au client
                self.send_response(response.status_code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response.content)
                
            except Exception as e:
                print(f"Erreur lors de la communication avec Ollama: {e}")
                self.send_error(500, f"Erreur lors de la communication avec Ollama: {e}")
        else:
            # Requête POST non gérée
            self.send_error(404)
    
    def do_GET(self):
        # Vérifier si c'est une requête pour le proxy Ollama
        if self.path.startswith('/proxy-ollama/'):
            # Récupérer l'URL cible sur Ollama
            target_path = self.path.replace('/proxy-ollama/', '')
            target_url = f"{OLLAMA_URL}/{target_path}"
            
            print(f"Forwarding GET request to: {target_url}")
            
            try:
                # Effectuer la requête vers Ollama
                response = requests.get(target_url)
                
                print(f"Ollama response status: {response.status_code}")
                
                # Envoyer la réponse au client
                self.send_response(response.status_code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response.content)
                
            except Exception as e:
                print(f"Erreur lors de la communication avec Ollama: {e}")
                self.send_error(500, f"Erreur lors de la communication avec Ollama: {e}")
        else:
            # Afficher le chemin demandé pour le débogage
            print(f"Requested path: {self.path}")
            
            # Réparer le chemin si on utilise index.html à la racine
            if self.path == '/':
                self.path = '/index.html'
            
            # Vérifier si le fichier existe
            file_path = os.path.join(os.getcwd(), self.path.lstrip('/'))
            print(f"Looking for file at: {file_path}")
            
            # Liste des fichiers dans le répertoire en cas d'erreur
            if not os.path.exists(file_path):
                print(f"File not found. Contents of directory:")
                print(os.listdir(os.getcwd()))
                
                # Vérifier si le fichier peut être dans un sous-répertoire
                for root, dirs, files in os.walk(os.getcwd()):
                    for file in files:
                        if file == os.path.basename(self.path):
                            print(f"Found similar file at: {os.path.join(root, file)}")
            
            try:
                # Servir le fichier statique
                return http.server.SimpleHTTPRequestHandler.do_GET(self)
            except Exception as e:
                print(f"Error serving file: {e}")
                self.send_error(404, f"File not found: {self.path}")

def test_ollama_connection():
    """Test de connexion à Ollama en essayant plusieurs URLs"""
    global OLLAMA_URL
    
    for url in OLLAMA_URLS:
        print(f"Tentative de connexion à Ollama sur {url}...")
        try:
            response = requests.get(f"{url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [model.get('name') for model in models]
                print(f"✅ Connexion à Ollama réussie sur {url}! Modèles disponibles : {', '.join(model_names)}")
                OLLAMA_URL = url
                return True
            else:
                print(f"⚠️ Ollama répond sur {url} mais avec un code d'erreur: {response.status_code}")
                print(f"Réponse: {response.text}")
        except Exception as e:
            print(f"⚠️ Impossible de se connecter à Ollama sur {url}: {e}")
            print(f"⚠️ Essai de l'URL suivante...")
    
    # Si on a essayé toutes les URLs sans succès
    print("⚠️ Aucune connexion à Ollama n'a pu être établie.")
    print("⚠️ Le serveur sera démarré, mais les fonctionnalités LLM ne seront pas disponibles")
    
    # Utiliser par défaut la première URL même si elle ne fonctionne pas
    # (nécessaire pour que le code fonctionne même en mode démo)
    OLLAMA_URL = OLLAMA_URLS[0]
    return False

def run_server():
    """Démarrer le serveur HTTP avec le proxy"""
    # Afficher le chemin de travail actuel
    print(f"Répertoire de travail: {os.getcwd()}")
    print(f"Contenu du répertoire:")
    print(os.listdir(os.getcwd()))
    
    # Tester la connexion à Ollama
    test_ollama_connection()
    
    # Démarrer le serveur
    handler = ProxyHTTPRequestHandler
    
    # Utiliser le paramètre bind pour s'assurer d'écouter sur toutes les interfaces
    httpd = socketserver.TCPServer(("0.0.0.0", PORT), handler)
    
    print(f"🚀 Serveur démarré sur le port {PORT}")
    print(f"📝 Accédez à l'application: http://localhost:{PORT}")
    print(f"🔄 Ollama configuré sur: {OLLAMA_URL}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Serveur arrêté")
        httpd.server_close()
        sys.exit(0)

if __name__ == "__main__":
    run_server()