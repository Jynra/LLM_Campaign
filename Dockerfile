FROM python:3-alpine

# Créer un répertoire pour l'application
WORKDIR /roleplay_site

# Copier tous les fichiers de l'application
COPY public/index.html .
COPY public/css/ ./css/
COPY public/js/ ./js/

# Ajouter le script de proxy pour Ollama
COPY proxy.py .

# Exposer le port 9428
EXPOSE 9428

# Installer les dépendances Python pour le proxy
RUN pip install --no-cache-dir requests

# Lancer le serveur HTTP avec le proxy
CMD ["python", "proxy.py"]