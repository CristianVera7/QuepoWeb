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
   
    if (!isRegistered.value && to.name === 'dashboard' ) {
        return next({ name: 'register' })
    }

    if (isRegistered.value && (!isLogged.value && to.name === 'dashboard')) {
        return next({ name: 'login' })
    }

    if (isLogged.value && (to.name === 'login' || to.name === 'register')) {
        return next({ name: 'dashboard' })
    }

    return next()
})


export default router
