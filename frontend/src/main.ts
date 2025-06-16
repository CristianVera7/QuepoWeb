import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
// Hoja de estilos de Leaflet (mapas)
import 'leaflet/dist/leaflet.css'
import { useRegisterStore } from './stores/registerStore'
// Importar configuración de API
import api from './api/index'

// Crea una nueva instancia de la aplicación Vue
const app = createApp(App)

// Hacer la API disponible globalmente (opcional)
app.config.globalProperties.$api = api

// Crea una instancia de Pinia y la registra en la app
const pinia = createPinia()
app.use(pinia)

async function initializeApp() {
  // Accede a la store del usuario registrado y verifica si hay sesión activa
  const store = useRegisterStore()
  await store.checkUser()

  // Registra el router para manejar rutas de navegación
  app.use(router)

  // Monta la aplicación en el elemento con id="app" del DOM
  app.mount('#app')
}

initializeApp()