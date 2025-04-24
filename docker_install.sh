#!/bin/bash

# Supprimer l'ancien conteneur s'il existe
docker rm LLM_Campaign 2>/dev/null || true

# Supprimer l'ancienne image si elle existe
docker rmi llm_campaign-image 2>/dev/null || true

# Construire l'image
docker build -t llm_campaign-image .

# Exécuter le conteneur
docker run -d -p 9425:9425 -v ./:/LLM_Campaign --name LLM_Campaign llm_campaign-image

echo "Le site de roleplay est lancé sur http://localhost:9425"
echo "Il utilise Ollama sur votre machine"