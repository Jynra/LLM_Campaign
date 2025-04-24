FROM python:3-alpine

# Créer un répertoire pour l'application
WORKDIR /llm-campaign

# Copier les fichiers de l'application
COPY public/ ./
COPY proxy.py .

# Exposer le port 9425
EXPOSE 9425

# Installer les dépendances Python pour le proxy
RUN pip install --no-cache-dir requests

# Lancer le serveur HTTP avec le proxy
CMD ["python", "proxy.py"]