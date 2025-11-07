# 🧭 QuepoWeb  
### Conecta personas con los mismos gustos y reduce la huella de carbono  

**QuepoWeb** es una aplicación web inspirada en BlaBlaCar. Permite a los usuarios crear o unirse a planes y actividades al aire libre, compartir coche y fomentar nuevas conexiones sociales, reduciendo así las emisiones contaminantes y la huella de carbono.  

---

## 🚀 Características principales  

- 🔐 Autenticación con **JWT** y contraseñas cifradas con **Argon2**.  
- 🔄 Control de rutas según si el usuario está autenticado.  
- 🧠 Frontend moderno con **Vue 3**, **TypeScript**, **Pinia**, **Pug** y **SCSS**.  
- ⚙️ Backend con **Node.js**, **Express** y **MongoDB**.  
- 🧹 Código formateado y validado con **Prettier** y **ESLint**.  

---

## 🧩 Tecnologías  

**Frontend:** Vue 3, TypeScript, Pinia, Pug, SCSS, Prettier, ESLint  
**Backend:** Node.js, Express, MongoDB, JWT, Argon2  
**Herramientas:** Git, VS Code, Postman  

---

## ⚙️ Instalación y uso  

### 1️⃣ Clonar el repositorio  
```bash
git clone https://github.com/CristianVera7/QuepoWeb.git
cd QuepoWeb
2️⃣ Instalar dependencias
Frontend

bash
Copiar código
cd front
npm install
npm run dev
Backend

bash
Copiar código
cd back
npm install
npm run dev
3️⃣ Variables de entorno
Crea un archivo .env dentro de la carpeta back con el siguiente contenido:

ini
Copiar código
PORT=5000
MONGO_URI=mongodb://localhost:27017/quepoweb
JWT_SECRET=tu_clave_secreta
🌍 Demo
Puedes probar una versión de prueba del servidor aquí (entorno de test):
👉 http://109.205.183.241:5000/register

💡 Próximas mejoras
💬 Añadir chat en tiempo real entre usuarios.

💳 Integrar una plataforma de pago.

📱 Mejorar el diseño responsive y la accesibilidad.

👨‍💻 Autor
Cristian Vera
Desarrollador Full Stack
📧 criisv95@gmail.com
💻 GitHub: CristianVera7
🔗 LinkedIn: Cristian Vera - Desarrollador
