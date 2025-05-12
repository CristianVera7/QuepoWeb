import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import 'leaflet/dist/leaflet.css'
import { useRegisterStore } from './stores/registerStore'

const app = createApp(App)
const pinia = createPinia()


app.use(pinia)

const store = useRegisterStore()
await store.checkUser()

app.use(router)
app.mount('#app')
