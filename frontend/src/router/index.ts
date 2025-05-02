import { createRouter, createWebHistory } from 'vue-router'

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
                path: '/editProfile',
                name: 'editProfile',
                component: () => import('../views/EditProfile.vue'),
            },
        ],
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
