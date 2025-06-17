# Imagen base con Node.js
FROM node:22

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Construir el proyecto directamente con npx
RUN npx --yes vue-tsc -b && npx vite build

# Instalar serve globalmente
RUN npm install -g serve

# Exponer el puerto
EXPOSE 5000

# Comando para correr la app
CMD ["serve", "-s", "dist", "-l", "5000"]
