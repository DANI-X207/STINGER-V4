# Utilise une image Node.js stable
FROM node:20

# Crée le dossier de travail
WORKDIR /app

# Copie tous les fichiers du projet dans le conteneur
COPY . .

# Installe les dépendances avec tolérance aux conflits
RUN npm install --legacy-peer-deps

# Expose un port si ton bot utilise un serveur web (optionnel)
EXPOSE 3000

# Lance ton bot
CMD ["node", "index.js"]
