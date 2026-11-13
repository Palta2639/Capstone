# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias e instalarlas
COPY package*.json ./
RUN npm install

# Copiar el resto del código del frontend
COPY . .

# Construir la aplicación para producción (empaquetado final)
RUN npm run build

# Exponer el puerto de Next.js
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]