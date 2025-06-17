<template lang="pug">
    // Contenedor principal de la vista de login
    .registerLog-view
        .firstWrapper
            .formContainer
                .firstBlock
                    // Menú de navegación para móviles
                    NavMenuMobile

                    // Mensaje inspirador superior
                    .view
                        p.h2 Conéctate y continúa tu viaje hacia un mundo más verde con nosotros.

                    // Botones de acceso social (sin funcionalidad implementada aún)
                    .socialIcons
                        button.icon
                            .svg-icon.google
                        button.icon
                            .svg-icon.linkedin
                        button.icon 
                            .svg-icon.github

                    // Separador visual entre login social y formulario tradicional
                    .divSeparator 
                        hr.lineSeparator
                        p.textSeparator OR
                        hr.lineSeparator

                    // Formulario de login tradicional (email + password)
                    .form-wrapper
                        form.form
                            // Campo de email con validación visual
                            input(
                                type="text" 
                                placeholder="Email"  
                                @focus='focusField="email"' 
                                :class='errors.email?"fieldError":"field"' 
                                v-model='user.email'
                            )
                            p.msgError(v-if='focusField==="email"&&errors.email') {{errors.email}}

                            // Campo de contraseña con validación visual
                            input(
                                type="password" 
                                placeholder="Password" 
                                @focus='focusField="password"'  
                                :class='errors.password?"fieldError":"field"' 
                                v-model='user.password'
                            )
                            p.msgError(v-if='focusField==="password"&&errors.password') {{errors.password}}

                            // Botón de login deshabilitado si hay errores de validación
                            button.btnForm(@click.prevent='loginUser' :disabled='isBtnDisabled') Log in

                            // Link para redirigir a registro en caso de no tener cuenta
                            .divRouteLogin 
                                label You don't have an account?
                                Router-link.routeLogin(:to="{name:'register'}") Register

                // Bloque decorativo con componente de sponsors
                .secondBlock
                    Sponsors
</template>


<script setup lang="ts">
// Importación de componentes visuales
import NavMenuMobile from '../components/NavMenuMobile.vue'
import Sponsors from '../components/Sponsors.vue'

// Importación de validación y tipos
import { Form, Field, ErrorMessage, type ValidationResult } from 'vee-validate'
import api from '../api/index'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validateForm } from '../validations/validationUser'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import { type IUser } from '../types/user'

// Acceso a la ruta actual y router para navegación programática
const route = useRoute()
const router = useRouter()

// Campo que tiene el foco actual (para mostrar errores)
const focusField = ref('')

// Computado para saber si estamos en la ruta de registro (por si se reutiliza la vista)
const isRegisterPath = computed(() => route.path === '/register')

// Desactiva el botón si hay errores en el formulario
const isBtnDisabled = ref<boolean>(true)
const validateBtnForm = computed(() =>
    !isRegisterPath.value
        ? (isBtnDisabled.value = Object.keys(errors.value).length > 2) // En login puede haber hasta 2 campos
        : (isBtnDisabled.value = Object.keys(errors.value).length > 0)
)

// Objeto que almacena errores de validación por campo
const errors = ref({})

// Referencia al store de usuario
const useRegister = useRegisterStore()
const { emailStore } = storeToRefs(useRegister)

// Objeto que representa al usuario que está haciendo login
const user = ref<IUser>({
    nickName: '',
    email: '',
    password: '',
    repeatPassword: '',
})

// Función para iniciar sesión del usuario
const loginUser = async () => {
    try {
        // Petición al backend para autenticar usuario
        const response = await api.post('/user/login', user.value)

        if (response.data.ok) {
            // Si la autenticación es exitosa, guardar el token
            localStorage.setItem('User loged', response.data.token)

            // Guardar email en el store y en localStorage
            emailStore.value = user.value.email
            localStorage.setItem('User registered', JSON.stringify(user.value.email))

            // Guardar token y estado logueado en el store
            useRegister.tokenStore = response.data.token
            useRegister.isLogged = true

            console.log('EL USUARIO EXISTE EN BD, ESTÁS LOGUEADO 👍')

            // Redireccionar al dashboard
            router.push({ name: 'dashboard' })
        }

        // Expiración de la sesión automáticamente según tiempo dado por el backend
        setTimeout(() => {
            localStorage.removeItem('User loged')
            useRegister.tokenStore = ''
            useRegister.isLogged = false
            alert('Sesion finalizada ❌')
            router.push({ name: 'login' })
        }, response.data.expires)

    } catch (error) {
        // Si el login falla, mostramos alerta y redirigimos al registro
        alert(`${user.value.email} no existe`)
        console.log(error)
        router.push({ name: 'register' })
    }
}

// Observa cambios en los campos del usuario y valida en tiempo real
watch(user.value, () => {
    errors.value = validateForm(user.value)
    isBtnDisabled.value = validateBtnForm.value
})

// Si venimos desde el registro y ya tenemos un email guardado, lo rellenamos automáticamente
onMounted(() => {
    if (emailStore.value && isRegisterPath) user.value.email = emailStore.value
})
</script>
