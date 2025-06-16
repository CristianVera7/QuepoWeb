# Imagen base con Node.js
FROM node:22

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar resto del proyecto
COPY . .

# Construir el proyecto
RUN npm run build

# Servir con serve
RUN npm install -g serve

# Exponer puerto
EXPOSE 5000

# Comando para correr la app
CMD ["serve", "-s", "dist", "-l", "5000"]