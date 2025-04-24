#!/bin/bash

# Supprimer l'ancien conteneur s'il existe
docker rm roleplay-site 2>/dev/null || true

# Supprimer l'ancienne image si elle existe
docker rmi roleplay-site-image 2>/dev/null || true

# Construire l'image
docker build -t roleplay-site-image .

# Exécuter le conteneur
docker run -d -p 9428:9428 -v ./:/roleplay_site --name roleplay-site roleplay-site-image

echo "Le site de roleplay est lancé sur http://localhost:9428"
echo "Il utilise Ollama sur votre machine"