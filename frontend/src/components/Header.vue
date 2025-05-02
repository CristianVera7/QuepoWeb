<template lang="pug">
    .headerDashboard
        .titleDashboard
            h1 Quepo?
            img(width="100", height="100", src="../img/logo/logoQuepo.png")

        .purpose
            p Conectando personas para disfrutar de la naturaleza🍃 

        .user-menu
            .user-trigger(@click="toggleMenu")
                img.avatar(src="../img/icons/logoUser.png", alt="Usuario")
                span.arrow ▼

            transition(name="dropdown")
                .user-dropdown(v-show="menuVisible")
                    .user-trigger(@click="toggleMenu")
                        img.avatar(src="../img/icons/logoUser.png", alt="Usuario")
                        span.arrow ▼

                    .dropdown-item(@click="goToProfile")
                        svg(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke="currentColor", class="icon")
                            path(stroke-linecap="round", stroke-linejoin="round", stroke-width="2", d="M5.121 17.804A9.966 9.966 0 0112 15c2.21 0 4.246.716 5.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z")
                        | Editar perfil

                    .dropdown-item(@click="logout")
                        svg(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke="currentColor", class="icon")
                            path(stroke-linecap="round", stroke-linejoin="round", stroke-width="2", d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1")
                        | Cerrar sesión

                    //- .dropdown-item(@click="confirmDeleteAccount")
                    //-     svg(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke="currentColor", class="icon text-danger")
                    //-         path(stroke-linecap="round", stroke-linejoin="round", stroke-width="2", d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z")
                    //-     | Eliminar cuenta
    hr
    hr
    hr
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useRegisterStore } from '../stores/registerStore'
import { ref } from 'vue'

const router = useRouter()

const menuVisible = ref(false)
const toggleMenu = () => menuVisible.value = !menuVisible.value

const goToProfile = () => {
  router.push({ name: 'editProfile' })
}


const logout = () => {
    localStorage.removeItem('User loged')
    useRegisterStore().tokenStore = ''
    router.push({ name: 'login' })
}
</script>

<style scoped lang="scss">
.headerDashboard {
    display: flex;
    justify-content: space-between;
    background-color: #d7eee4;

    .titleDashboard {
        color: #000000;
        gap: 1em;
        margin: 1rem 4em;
    }

    .purpose {
        color: #4CAF50;
        font-size: 1.8em;
        font-weight: 600;
        display: flex;
        align-items: center;
    }

    .user-menu {
        position: relative;
        display: flex;
        align-items: center;
        margin-right: 2em;
        margin-bottom: 4rem;
        background: #d7eee4;

        .user-trigger {
            display: flex;
            gap: 0.2rem;
            cursor: pointer;
            border-radius: 10px;

            .avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 2px solid #2e7d32;
                object-fit: cover;
            }

            .arrow {
                color: #2e7d32;
                font-size: 1rem;
                font-weight: bold;
            }
        }

        .user-dropdown {
            position: absolute;
            top: 22px;
            left: -110px;
            background: #e0f0e9;
            border-radius: 12px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            padding: 0.75rem 0;
            width: 185px;
            overflow: hidden;


            .user-trigger {
                margin: 0.2rem 7rem;
                gap: 0.2rem;
                cursor: pointer;
                border-radius: 10px;

            }

            .icon {
                width: 1.2rem;
                height: 1.2rem;
                margin-right: 0.6rem;
                stroke: #2e7d32;
                flex-shrink: 0;

                &.text-danger {
                    stroke: #e74c3c;
                }
            }


            .dropdown-item {
                display: flex;
                align-items: center;
                font-size: 0.95rem;
                padding: 0.65rem 1.2rem;
                white-space: nowrap;

                &:hover {
                    transform: translateY(-2px) scale(1.02);
                    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }

                &:last-child {
                    color: #e74c3c;
                    font-weight: 600;
                }
            }
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
</style>
