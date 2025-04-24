#!/bin/bash

# Supprimer l'ancien conteneur s'il existe
docker rm LLM_Campaign 2>/dev/null || true

# Supprimer l'ancienne image si elle existe
docker rmi LLM_Campaign-image 2>/dev/null || true

# Construire l'image
docker build -t LLM_Campaign-image .

# Exécuter le conteneur
docker run -d -p 9425:9425 -v ./:/LLM_Campaign --name LLM_Campaign LLM_Campaign-image

echo "Le site de roleplay est lancé sur http://localhost:9425"
echo "Il utilise Ollama sur votre machine"