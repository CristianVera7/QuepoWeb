<template lang="pug">
    // Vista principal para registro/inicio de sesión
    .registerLog-view
        .firstWrapper
            .formContainer
                .firstBlock
                    // Menú de navegación móvil
                    NavMenuMobile

                    // Bloque de bienvenida
                    .view
                        p.h2 Únete a una comunidad comprometida con la sostenibilidad y el cambio positivo.

                    // Contenedor del formulario
                    .form-wrapper
                        form.form
                            // Campo nickname (solo si está en ruta de registro)
                            input(
                                type="text" 
                                placeholder="Nickname" 
                                @focus='focusField="nickName"' 
                                :class='errors.nickName?"fieldError":"field"' 
                                v-model='user.nickName' 
                                v-if="isRegisterPath"
                            ) 
                            // Mensaje de error nickname
                            p.msgError(
                                v-if='focusField==="nickName" && errors.nickName'
                            ) {{errors.nickName}}

                            // Campo email
                            input(
                                type="text" 
                                placeholder="Email"  
                                @focus='focusField="email"' 
                                :class='errors.email?"fieldError":"field"' 
                                v-model='user.email' 
                            )
                            // Mensaje de error email
                            p.msgError(v-if='focusField==="email" && errors.email') {{errors.email}}

                            // Campo password
                            input(
                                type="password" 
                                placeholder="Password" 
                                @focus='focusField="password"'  
                                :class='errors.password?"fieldError":"field"' 
                                v-model='user.password'
                            )
                            // Mensaje de error password
                            p.msgError(v-if='focusField==="password" && errors.password') {{errors.password}}

                            // Campo repetir contraseña (solo en registro)
                            input(
                                type="password" 
                                placeholder="Repeat password" 
                                @focus='focusField="repeatPassword"' 
                                :class='errors.repeatPassword?"fieldError":"field"' 
                                v-model='user.repeatPassword' 
                                v-if="isRegisterPath"
                            )
                            // Mensaje de error repetir contraseña
                            p.msgError(
                                v-if='focusField==="repeatPassword" && errors.repeatPassword'
                            ) {{errors.repeatPassword}}

                            // Botón de registro
                            button.btnForm(
                                @click.prevent='registerUser' 
                                :disabled='isBtnDisabled'
                            ) Sign up

                            // Enlace a la ruta de login si ya tiene cuenta
                            .divRouteLogin 
                                label Already have an account?
                                Router-link.routeLogin(:to="{name:'login'}") Log in

                // Sección secundaria con sponsors.
                .secondBlock
                    Sponsors    
</template>


<script setup lang="ts">
// Importación de componentes auxiliares y dependencias
import NavMenuMobile from '../components/NavMenuMobile.vue'
import Sponsors from '../components/Sponsors.vue'
import axios from 'axios'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validateForm } from '../validations/validationUser'
import { useRegisterStore } from '../stores/registerStore'
import { type IUser } from '../types/user'

// Hooks de Vue Router
const route = useRoute()
const router = useRouter()

const focusField = ref('')
const errors = ref({})
// Determina si el usuario está en la ruta /register
const isRegisterPath = computed(() => route.path === '/register')
const isBtnDisabled = ref<boolean>(true)
// Habilita/deshabilita el botón según validaciones y ruta
const validateBtnForm = computed(() =>
    !isRegisterPath.value
        ? (isBtnDisabled.value = Object.keys(errors.value).length > 2)
        : (isBtnDisabled.value = Object.keys(errors.value).length > 0)
)
// Modelo del usuario con datos del formulario
const user = ref<IUser>({
    nickName: '',
    email: '',
    password: '',
    repeatPassword: '',
})
// Funciones de Pinia para actualizar el estado global
const { setMailStore, setisRegisteredStore } = useRegisterStore()

// Función que envía el formulario de registro al backend
const registerUser = async () => {
    // Validación de coincidencia de contraseñas
    if (user.value.password !== user.value.repeatPassword) {
        console.log('Error al repetir tu contraseña')
        return
    }

    try {
        // Petición POST al backend para registrar nuevo usuario
        const response = await axios.post('http://localhost:8000/user/register', user.value)

        // Si ya existe, muestra alerta
        if (response.data.ok === false) return alert('Este usuario ya existe')

        // Si el registro es exitoso, actualiza estado y redirige a login
        setisRegisteredStore(true)
        router.push({ name: 'login' })
        setMailStore(user.value.email)

        // Almacena el email en localStorage
        localStorage.setItem('User registered', JSON.stringify(user.value.email))

        console.log('USUARIO CREADO CORRECTAMENTE 👍')
    } catch (error) {
        console.log('Ha habido un problema al crear al usuario ❌', error)
    }
}

// Observa cambios en los campos del formulario para validar en tiempo real
watch(user.value, () => {
    errors.value = validateForm(user.value)
    isBtnDisabled.value = validateBtnForm.value
})
</script>