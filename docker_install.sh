#!/bin/bash

# Supprimer l'ancien conteneur s'il existe
docker rm -f llm-campaign 2>/dev/null || true

# Supprimer l'ancienne image si elle existe
docker rmi llm-campaign-image 2>/dev/null || true

# Construire l'image
docker build -t llm-campaign-image .

# Exécuter le conteneur
docker run -d -p 9425:9425 -v ./public:/llm-campaign --name llm-campaign llm-campaign-image

echo "Le site de roleplay est lancé sur http://localhost:9425"
echo "Utilise un proxy vers Ollama à l'adresse http://172.17.0.8:11434"