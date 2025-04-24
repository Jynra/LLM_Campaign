FROM python:3-alpine

# Créer un répertoire pour l'application
WORKDIR /llm-campaign

# Copier tous les fichiers de l'application
COPY public/index.html .
COPY public/css/ ./css/
COPY public/js/ ./js/

# Exposer le port 9425
EXPOSE 9425

# Lancer un serveur HTTP simple
CMD ["python", "-m", "http.server", "9425"]