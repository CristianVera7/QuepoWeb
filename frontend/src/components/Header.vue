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
import { useRouter } from 'vue-router'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'
import type { IPlan } from '../types/plan'
import axios from 'axios'

const registerStore = useRegisterStore()
const { hasDni } = storeToRefs(registerStore)
const { tokenStore } = registerStore

const router = useRouter()
const menuVisible = ref(false)
const showLogoutModal = ref(false)
const hasNotifications = ref(false)
const highlightProfile = ref(false)
const highlightRequests = ref(false)

const checkNotifications = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/pending', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })

        const hasPending = Array.isArray(response.data.plans) &&
            response.data.plans.some(
                (plan: IPlan) => plan.pendingPassengers && plan.pendingPassengers.length > 0
            )


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

        hasNotifications.value = !hasDni.value || hasPending
    } catch (error) {
        console.error('Error verificando notificaciones:', error)
        hasNotifications.value = !hasDni.value
    }
}


const toggleMenu = () => {
    menuVisible.value = !menuVisible.value
}

const goToProfile = () => {
    menuVisible.value = false
    router.push({ name: 'editProfile' })
}

const goToRequestsPlans = () => {
    menuVisible.value = false
    router.push({ name: 'requestsPlans' })
}

const logout = () => {
    menuVisible.value = false
    showLogoutModal.value = true
}

const confirmLogout = () => {
    localStorage.removeItem('User loged')
    useRegisterStore().tokenStore = ''
    router.push({ name: 'login' })
}

onMounted(() => {
    checkNotifications()
    setInterval(checkNotifications, 60000)
})
</script>


<style scoped lang="scss">
@keyframes shake {
    0% {
        transform: rotate(0deg);
    }

    20% {
        transform: rotate(-15deg);
    }

    40% {
        transform: rotate(15deg);
    }

    60% {
        transform: rotate(-10deg);
    }

    80% {
        transform: rotate(10deg);
    }

    100% {
        transform: rotate(0deg);
    }
}

.headerDashboard {
    font-size: larger;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #d7eee400;
    margin: 2vw 4vw;
    width: auto;
    height: 12.8rem;
    position: relative;

    .image-container {
        position: relative;
        display: inline-block;
    }

    .titleDashboard {
        .routeStyles {
            text-decoration: none;
            color: inherit;
        }

        display: flex;
        justify-content: center;
        place-content: center;
        align-items: center;
        text-align: center;
        font-size: clamp(1rem, 1.5vw, 1.5rem); // Tamaño de fuente responsive
        color: #ffffff;
        margin: 1rem;
        cursor: pointer;
        max-width: 8rem;
    }

    .purpose {
        color: #ffffff;
        font-size: clamp(1.5rem, 3vw, 2.3rem); // Tamaño de fuente responsive
        margin: 0 auto; // Centrado automático
        max-width: 50%; // Limitar ancho máximo
        display: flex;
        align-items: center;
        justify-content: center; // Centrar contenido
        text-align: center;
        position: absolute; // Posicionamiento absoluto
        left: 50%; // Centrar horizontalmente
        transform: translateX(-50%); // Ajustar la posición para centrar
    }

    .user-menu {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 1rem;
        height: 4rem;
        padding: 2rem 1rem;
        border-radius: 2rem;
        z-index: 10; // Añadido para asegurar que esté por encima de otros elementos

        .user-trigger {
            display: flex;
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid #ffffff;
            object-fit: cover;
            padding: 0.3rem;

            .avatar {
                width: clamp(40px, 4vw, 60px); // Tamaño responsive para la imagen
                height: clamp(40px, 4vw, 60px);
            }

            .notification-bell {
                position: absolute;
                top: 0rem;
                left: 0.5rem;
                border-radius: 50%;
                box-shadow: 0 0 15px rgba(255, 204, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: bold;
                color: #000;
                z-index: 20;
                animation: shake 1s infinite;

                &::before {
                    content: "🔔";
                    font-size: 1.2rem;
                }
            }
        }

        .user-dropdown {
            position: absolute;
            top: -20px; // Cambiado para posicionarlo debajo del avatar
            right: 0px;
            background: #012b00c5;
            border-radius: 12px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            padding: 0.75rem 0;
            width: max-content; // Se ajusta al contenido
            min-width: 185px; // Ancho mínimo
            overflow: hidden;
            color: rgba(255, 255, 255, 0.753);
            z-index: 100; // Asegura que aparezca sobre otros elementos
            margin-top: 0.5rem; // Espacio entre avatar y dropdown

            .user-trigger-dropdown {
                display: flex;
                justify-content: end;
                cursor: pointer;
                margin-right: 1.25rem;

                .avatar {
                    width: clamp(40px, 5vw, 60px); // Tamaño responsive para la imagen
                    height: clamp(40px, 5vw, 60px);
                }
            }

            .icon {
                width: 1.2rem;
                height: 1.2rem;
                margin-right: 0.6rem;
                stroke: #00ad09;
                flex-shrink: 0;

                &.text-danger {
                    stroke: #17d605;
                }

            }

            .dropdown-item {
                display: flex;
                align-items: center;
                font-size: clamp(0.9rem, 1.2vw, 1.2rem); // Texto responsive
                padding: 0.65rem 1.2rem;
                white-space: nowrap;
                cursor: pointer;

                &:hover {
                    transform: translateY(-2px) scale(1.02);
                    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                    color: white;
                }

                &:last-child {
                    color: #ff1900b9;
                    font-weight: 600;
                }
            }
        }
    }

    .highlighted {
        display: inline-block;
        animation: pulseText 0.6s infinite;
        color: rgb(255, 255, 255);
    }

    @keyframes pulseText {

        0%,
        100% {
            transform: scale(1);
        }

        50% {
            transform: scale(1.05);
        }
    }



    .dropdown-enter-active,
    .dropdown-leave-active {
        transition: all 0.2s ease-out;
        transform-origin: top right;
    }

    .dropdown-enter-from {
        opacity: 0;
        transform: translateY(0) scaleY(0.5);
    }

    .dropdown-leave-from {
        opacity: 1;
        transform: translateY(0) scaleY(1);
    }

    .dropdown-leave-to {
        opacity: 0;
        transform: translateY(1%) scaleY(0.5);
    }
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.377);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 200;

    .modal-content {
        background-color: #01300af5;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        max-width: 90%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.473);

        h2 {
            margin-bottom: 1.5rem;
            font-size: 1.3rem;
            color: #ffffff;
        }

        .modal-actions {
            display: flex;
            justify-content: center;
            gap: 1rem;

            button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                background-color: #2d89ef;
                color: white;
                transition: background-color 0.2s;

                &:hover {
                    background-color: #2269be;
                }

                &.cancel {
                    background-color: #d81600;

                    &:hover {
                        background-color: #a80f00;
                    }
                }
            }
        }
    }
}


// Media queries mejoradas para diferentes tamaños de pantalla
@media (max-width: 1024px) {
    .headerDashboard {
        flex-wrap: wrap;

        .purpose {
            position: static;
            transform: none;
            order: 3;
            max-width: 100%;
            margin: 1rem auto;
            padding: 0 1rem;
        }

        .user-menu {
            .user-dropdown {
                top: -13px;
                right: -3px; // Asegurar que permanezca alineado a la derecha
            }
        }
    }
}

@media (max-width: 768px) {
    .headerDashboard {
        margin: 1rem; // Reducir márgenes en móviles
        justify-content: space-between;
        gap: 1rem; // Espacio entre elementos

        .titleDashboard {
            margin-right: 0; // Eliminamos el margen fijo
            flex: 1; // Permitir que crezca para llenar el espacio
        }

        .user-menu {
            height: auto; // Altura automática
            padding: 1rem 0.5rem; // Reducir padding horizontal
            margin-left: 0; // Eliminar margen fijo

            .user-trigger {

                .notification-bell {
                    position: absolute;
                    top: 1.1rem;
                    left: 0.3rem;
                    width: 1.2rem;
                    height: 1.2rem;

                    &::before {
                        content: "🔔";
                        font-size: 1rem;
                    }
                }

            }

            .user-dropdown {
                top: 4px;
                right: -5px; // Mantener alineado a la derecha
                width: auto; // Ancho automático
                min-width: 160px; // Reducir ancho mínimo

                .dropdown-item {
                    padding: 0.6rem 1rem; // Reducir padding
                    font-size: 1rem; // Tamaño fijo para móviles
                }
            }
        }

        .purpose {
            font-size: 1.3rem; // Tamaño de fuente más pequeño
            margin-top: 0.5rem; // Reducir espacio superior
            width: 100%; // Ocupar todo el ancho
        }
    }
}

@media (max-width: 480px) {
    .headerDashboard {
        margin: 0.5rem; // Márgenes más pequeños
        padding: 0.5rem;

        .titleDashboard {
            font-size: 0.9rem; // Reducir tamaño de fuente
        }

        .user-menu {
            padding: 0.5rem;

            .user-trigger {
                padding: 0.2rem; // Borde más fino
                border-width: 1px; // Borde más fino

                .notification-bell {
                    position: absolute;
                    top: 0.5rem;
                    left: 0.2rem;
                    width: 1.2rem;
                    height: 1.2rem;

                    &::before {
                        content: "🔔";
                        font-size: 0.8rem;
                    }
                }

                .avatar {
                    width: 35px; // Tamaño fijo para móviles pequeños
                    height: 35px;
                }
            }

            .user-dropdown {
                top: -10px;
                left: auto; // Anular cualquier posicionamiento izquierdo
                right: -11.5px; // Ajustar para que no se salga de la pantalla
                transform-origin: top right; // Origen de transformación
                width: 150px; // Ancho fijo para móviles pequeños

                .dropdown-item {
                    padding: 0.5rem 0.8rem; // Padding más compacto
                    font-size: 0.9rem; // Texto más pequeño

                    .icon {
                        width: 1rem;
                        height: 1rem;
                        margin-right: 0.4rem;
                    }
                }
            }
        }

        .purpose {
            font-size: 1.1rem; // Aún más pequeño en móviles pequeños
        }
    }
}
</style>
