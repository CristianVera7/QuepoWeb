// Importa funciones necesarias de Vue Router para crear el router
import { createRouter, createWebHistory } from 'vue-router'

// Importa el store de registro (gestiona si el usuario está registrado o logueado)
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia' // Permite acceder reactivamente a las propiedades del store

// Definición de rutas de la aplicación
const routes = [
    {
        // Ruta raíz redirige automáticamente a /register
        path: '/',
        redirect: '/register',

        // Se define como contenedor de rutas hijas
        children: [
            {
                path: '/register',
                name: 'register',
                component: () => import('../views/Register.vue'), // Carga perezosa (lazy load)
            },
            {
                path: '/login',
                name: 'login',
                component: () => import('../views/Login.vue'),
            },
            {
                path: '/dashboard',
                name: 'dashboard',
                component: () => import('../views/Dashboard.vue'),
            },
            {
                path: '/createPlan',
                name: 'createPlan',
                component: () => import('../views/CreatePlan.vue'),
            },
            {
                path: '/requestsPlans',
                name: 'requestsPlans',
                component: () => import('../views/RequestsPlans.vue'),
            },
            {
                path: '/editProfile',
                name: 'editProfile',
                component: () => import('../views/EditProfile.vue'),
            },
            {
                path: '/myPlans',
                name: 'myPlans',
                component: () => import('../views/MyPlans.vue'),
            },
            {
                // Ruta dinámica para editar un plan específico según su ID
                path: '/editPlan/:id',
                name: 'editPlan',
                component: () => import('../views/EditPlan.vue'),
            }
        ],
    },
]

// Crea el router usando historial HTML5 (sin hash en la URL)
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

// Función auxiliar para redireccionar de forma segura si no estamos en la vista objetivo
function safeRedirect(to: any, next: any, targetName: string) {
    if (to.name !== targetName) return next({ name: targetName })
    return next()
}

// Middleware global que se ejecuta antes de cada cambio de ruta
router.beforeEach(async (to, from, next) => {
    const store = useRegisterStore()
    const { checkUser } = store // Método para verificar el estado del usuario
    const { isRegistered, isLogged } = storeToRefs(store) // Acceso reactivo a los flags de sesión

    // Verifica estado de usuario y token antes de continuar
    await checkUser()

    // Si no está registrado y quiere ir al dashboard, lo redirige al registro
    if (!isRegistered.value && to.name === 'dashboard') {
        return next({ name: 'register' })
    }

    // Si está registrado pero no logueado y quiere ir al dashboard, va a login
    if (isRegistered.value && (!isLogged.value && to.name === 'dashboard')) {
        return next({ name: 'login' })
    }

    // Si ya está logueado, no tiene sentido ir a login o registro → va al dashboard
    if (isLogged.value && (to.name === 'login' || to.name === 'register')) {
        return next({ name: 'dashboard' })
    }

    // Si ninguna condición aplica, continúa con la navegación normal
    return next()
})

// Exporta el router para que pueda ser usado en la aplicación Vue
export default router