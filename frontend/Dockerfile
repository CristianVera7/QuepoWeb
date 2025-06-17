# Imagen base con Node.js
FROM node:22

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias e instalar
COPY package*.json ./
RUN npm install

# 🔧 Solución clave: dar permisos de ejecución a vue-tsc
RUN chmod +x node_modules/.bin/vue-tsc

# Copiar el resto del proyecto
COPY . .

# Construir el proyecto
RUN npm run build

# Instalar serve globalmente
RUN npm install -g serve

# Exponer el puerto
EXPOSE 5000

# Comando para correr la app
CMD ["serve", "-s", "dist", "-l", "5000"]
