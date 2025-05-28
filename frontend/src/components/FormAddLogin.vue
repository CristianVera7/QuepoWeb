<template lang="pug">
    // Contenedor general del formulario
    .form-wrapper
        form.form
            // Campo Nickname (solo en registro)
            input(
                type="text" 
                placeholder="Nickname" 
                @focus='focusField="nickName"' 
                :class='errors.nickName?"fieldError":"field"' 
                v-model='user.nickName' 
                v-if="isRegisterPath"
            )
            // Mensaje de error para Nickname
            p.msgError(v-if='focusField==="nickName"&&errors.nickName') {{errors.nickName}}

            // Campo Email
            input(
                type="text" 
                placeholder="Email"  
                @focus='focusField="email"' 
                :class='errors.email?"fieldError":"field"' 
                v-model='user.email' 
            )
            // Si no es registro, muestra el email del store (por ejemplo en login)
            p(v-if="!isRegisterPath") {{props.emailStore}} 
            // Mensaje de error para Email
            p.msgError(v-if='focusField==="email"&&errors.email') {{errors.email}}

            // Campo Password
            input(
                type="password" 
                placeholder="Password" 
                @focus='focusField="password"'  
                :class='errors.password?"fieldError":"field"' 
                v-model='user.password'
            )
            // Mensaje de error para Password
            p.msgError(v-if='focusField==="password"&&errors.password') {{errors.password}}

            // Campo Repetir Password (solo en registro)
            input(
                type="password" 
                placeholder="Repeat password" 
                @focus='focusField="repeatPassword"' 
                :class='errors.repeatPassword?"fieldError":"field"' 
                v-model='user.repeatPassword' 
                v-if="isRegisterPath"
            )
            // Mensaje de error para Repetir Password
            p.msgError(v-if='focusField==="repeatPassword"&&errors.repeatPassword') {{errors.repeatPassword}}

            // Botón de envío del formulario
            button.btnForm(@click.prevent='handleSubmit' :disabled='isBtnDisabled') {{props.textButton}}

            // Enlace alternativo a login o registro según el flujo
            .divRouteLogin 
                label {{props.message}}
                Router-link.routeLogin(:to="{name: props.pathRouterLink}") {{props.textRouterLink}}

    // Logo solo visible en versión móvil
    .divLogoMobile
        img(src="../img/logo/whiteLogo.png")
</template>

<script setup lang="ts">
// Imports necesarios: validaciones, reactividad, ruta, store y tipos
import { Form, Field, ErrorMessage, type ValidationResult } from 'vee-validate'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { validateForm } from '../validations/validationUser'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import { type IUser } from '../types/user'

// Ruta actual
const route = useRoute()

// Campo actualmente enfocado (para mostrar errores solo si se tocó)
const focusField = ref('')

// Verifica si el formulario actual es de registro
const isRegisterPath = computed(() => route.path === '/register')

// Controla el estado del botón (habilitado o deshabilitado)
const isBtnDisabled = ref<boolean>(true)

// Estado de errores de validación
const errors = ref({})

// Cálculo para validar si el botón debe estar deshabilitado
const validateBtnForm = computed(() =>
    !isRegisterPath.value
        ? (isBtnDisabled.value = Object.keys(errors.value).length > 2)
        : (isBtnDisabled.value = Object.keys(errors.value).length > 0)
)

// Store y propiedades del usuario
const useRegister = useRegisterStore()
const { emailStore } = storeToRefs(useRegister)
const user = ref<IUser>({
    nickName: '',
    email: '',
    password: '',
    repeatPassword: '',
})

// Props recibidas desde el componente padre
const props = defineProps({
    textButton: { type: String, required: true },
    onsubmit: { type: Function, required: false },
    message: { type: String, required: true },
    pathRouterLink: { type: String, required: true },
    textRouterLink: { type: String, required: true },
})

// Emite eventos al componente padre según si es login o registro
const emits = defineEmits(['registerSubmit', 'loginSubmit'])

// Maneja el envío del formulario y emite los datos correspondientes
const handleSubmit = () => {
    const loginEmit = emits('loginSubmit', user.value)
    const registerEmit = emits('registerSubmit', user.value)
    return { loginEmit, registerEmit }
}

// Observa cambios en los campos del formulario y actualiza errores y estado del botón
watch(user.value, () => {
    errors.value = validateForm(user.value)
    isBtnDisabled.value = validateBtnForm.value
})

// Si viene del login, completa el email con lo que haya en el store
onMounted(() => {
    if (emailStore && route.path === '/login') user.value.email = emailStore.value
})
</script>
