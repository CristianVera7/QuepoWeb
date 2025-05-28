<template lang="pug">
    .headerDashboard
        .titleDashboard
            router-link.routeStyles(to="/dashboard")
                h1 Quepo?

        .purpose
            p Conectando personas para disfrutar de la naturaleza

        .user-menu
            .user-trigger(@click="toggleMenu")
                img.avatar(src="../img/icons/mochilaSetting2.png", alt="Usuario")
                span.notification-bell(v-if="hasNotifications")
            transition(name="dropdown")
                .user-dropdown(v-show="menuVisible")
                    .user-trigger-dropdown
                        img.avatar(@click.self="toggleMenu")(src="../img/icons/mochilaSetting2.png", alt="Usuario" )

                    .dropdown-item(:class="{ 'highlighted': highlightRequests }" @click="goToRequestsPlans")
                        svg(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke="currentColor", class="icon")
                            path(stroke-linecap="round", stroke-linejoin="round", stroke-width="1.8", d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9")
                        | Solicitudes
                    .dropdown-item(:class="{ 'highlighted': highlightProfile }" @click="goToProfile")
                        svg(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke="currentColor", class="icon text-gray-600")
                            path(stroke-linecap="round", stroke-linejoin="round", stroke-width="1.8", d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z")
                            path(stroke-linecap="round", stroke-linejoin="round", stroke-width="1.8", d="M6 21v-2c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4v2")
                        | Editar perfil

                    .dropdown-item(@click="logout")
                        svg(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke="currentColor", class="icon")
                            path(stroke-linecap="round", stroke-linejoin="round", stroke-width="1.8", d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1")
                        | Cerrar sesión

    transition(name="fade")
        .modal-overlay(v-if="showLogoutModal", @click.self="showLogoutModal = false")
            .modal-content
                h2 ¿Estás seguro de que deseas cerrar sesión?
                .modal-actions
                    button(@click="confirmLogout") Sí, cerrar sesión
                    button.cancel(@click="showLogoutModal = false") Cancelar
</template>

<script setup lang="ts">
// Imports de Vue, Pinia, Router, Axios y tipos
import { useRouter } from 'vue-router'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'
import type { IPlan } from '../types/plan'
import axios from 'axios'

// Acceso al store de registro y extracción de refs
const registerStore = useRegisterStore()
const { hasDni } = storeToRefs(registerStore)
const { tokenStore } = registerStore

// Router para navegación programática
const router = useRouter()

// Estados locales para visibilidad del menú, modal, notificaciones y resaltado
const menuVisible = ref(false)
const showLogoutModal = ref(false)
const hasNotifications = ref(false)
const highlightProfile = ref(false)
const highlightRequests = ref(false)

// Función para verificar notificaciones (planes pendientes o perfil incompleto)
const checkNotifications = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/pending', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })

        // Verifica si hay planes con pasajeros pendientes
        const hasPending = Array.isArray(response.data.plans) &&
            response.data.plans.some(
                (plan: IPlan) => plan.pendingPassengers && plan.pendingPassengers.length > 0
            )

        // Lógica para resaltar botones del dropdown según el caso
        if (!hasDni.value) {
            highlightProfile.value = true
            highlightRequests.value = false
        } else if (!!hasPending) {
            highlightProfile.value = false
            highlightRequests.value = true
        } else {
            highlightProfile.value = false
            highlightRequests.value = false
        }

        // Determina si se debe mostrar el ícono de notificación
        hasNotifications.value = !hasDni.value || hasPending
    } catch (error) {
        console.error('Error verificando notificaciones:', error)
        // En caso de error, mostrar notificación si no hay DNI
        hasNotifications.value = !hasDni.value
    }
}

// Abre o cierra el menú de usuario
const toggleMenu = () => {
    menuVisible.value = !menuVisible.value
}

// Navega a la edición de perfil y oculta el menú
const goToProfile = () => {
    menuVisible.value = false
    router.push({ name: 'editProfile' })
}

// Navega a solicitudes pendientes y oculta el menú
const goToRequestsPlans = () => {
    menuVisible.value = false
    router.push({ name: 'requestsPlans' })
}

// Muestra el modal de confirmación de cierre de sesión
const logout = () => {
    menuVisible.value = false
    showLogoutModal.value = true
}

// Confirma cierre de sesión, borra token y redirige a login
const confirmLogout = () => {
    localStorage.removeItem('User loged')
    useRegisterStore().tokenStore = ''
    router.push({ name: 'login' })
}

// Verifica notificaciones iniciales
// Establece intervalo para seguir verificando cada 60 segundos
onMounted(() => {
    checkNotifications()
    setInterval(checkNotifications, 60000)
})
</script>