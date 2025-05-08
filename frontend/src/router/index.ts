import { createRouter, createWebHistory } from 'vue-router'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'

const routes = [
    {
        path: '/',
        redirect: '/register',
        children: [
            {
                path: '/register',
                name: 'register',
                component: () => import('../views/Register.vue'),
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
                path: '/editPlan/:id',
                name: 'editPlan',
                component: () => import('../views/EditPlan.vue'),
            }
        ],
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

function safeRedirect(to: any, next: any, targetName: string) {
    if (to.name !== targetName) return next({ name: targetName })
    return next()
}


router.beforeEach(async (to, from, next) => {
    const store = useRegisterStore()
    const { checkUser } = store
    const { isRegistered, isLogged } = storeToRefs(store)

    await checkUser()

    const publicPages = ['login', 'register']
    const authRequired = !publicPages.includes(to.name as string)

    // ✅ Permite login o register si no estás registrado
    if (!isRegistered.value && !['login', 'register'].includes(to.name as string)) {
        return next({ name: 'register' })
    }

    // ✅ Si estás registrado pero no logueado, redirige a login si accede a ruta protegida
    if (!isLogged.value && authRequired) {
        return next({ name: 'login' })
    }

    // ✅ Si ya estás logueado y vas a login o register, redirige a dashboard
    if (isLogged.value && publicPages.includes(to.name as string)) {
        return next({ name: 'dashboard' })
    }

    return next()
})


export default router
