#!/bin/bash

# Supprimer l'ancien conteneur s'il existe
docker rm llm-campaign 2>/dev/null || true

# Supprimer l'ancienne image si elle existe
docker rmi llm-campaign-image 2>/dev/null || true

# Construire l'image
docker build -t llm-campaign-image .

# Exécuter le conteneur
docker run -d -p 9425:9425 --name llm-campaign llm-campaign-image

echo "Le site de roleplay est lancé sur http://localhost:9425"
echo "Il utilise Ollama sur votre machine à l'adresse 172.17.0.5:11434"