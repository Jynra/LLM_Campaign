FROM python:3-alpine

# Créer un répertoire pour l'application
WORKDIR /llm-campaign

# Débuguer le contenu du répertoire
RUN echo "Contenu avant la copie:" && ls -la

# Copier tous les fichiers de l'application
COPY public/* ./
COPY public/css ./css/
COPY public/js ./js/
COPY proxy.py .

# Débuguer le contenu après la copie
RUN echo "Contenu après la copie:" && ls -la && \
    echo "Contenu du dossier css:" && ls -la css/ && \
    echo "Contenu du dossier js:" && ls -la js/

# Exposer le port 9425
EXPOSE 9425

# Installer les dépendances Python pour le proxy
RUN pip install --no-cache-dir requests

# Lancer le serveur HTTP avec le proxy
CMD ["python", "proxy.py"]