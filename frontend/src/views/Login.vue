<template lang="pug">
    .register-view
        .firstWrapper
            .formContainer
                NavMenuMobile
                .view
                    h2.h2 Log in
                .socialIcons
                    button.icon
                        .svg-icon.google
                    button.icon
                        .svg-icon.linkedin
                    button.icon 
                        .svg-icon.github
                .divSeparator 
                    hr.lineSeparator
                    p.textSeparator OR
                    hr.lineSeparator
                .form-wrapper
                    form.form
                        input( type="text" placeholder="Email"  @focus='focusField="email"' :class='errors.email?"fieldError":"field"' v-model='user.email' )
                        p.msgError(v-if='focusField==="email"&&errors.email') {{errors.email}}
                        input(type="password" placeholder="Password" @focus='focusField="password"'  :class='errors.password?"fieldError":"field"' v-model='user.password')
                        p.msgError(v-if='focusField==="password"&&errors.password') {{errors.password}}
                        button.btnForm(@click.prevent='loginUser' :disabled='isBtnDisabled') Log in
                        .divRouteLogin 
                            label You don't have an account?
                            Router-link.routeLogin(:to="{name:'register'}") Register
                .divLogoMobile
                    img(src="../img/logo/logoQuepo.png")
        Sponsors
</template>

<script setup lang="ts">
import NavMenuMobile from '../components/NavMenuMobile.vue'
import Sponsors from '../components/Sponsors.vue'
import { Form, Field, ErrorMessage, type ValidationResult } from 'vee-validate'
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validateForm } from '../validations/validationUser'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import { type IUser } from '../types/user'

const route = useRoute()
const router = useRouter()
const focusField = ref('')
const isRegisterPath = computed(() => route.path === '/register')
const isBtnDisabled = ref<boolean>(true)
const validateBtnForm = computed(() =>
    !isRegisterPath.value
        ? (isBtnDisabled.value = Object.keys(errors.value).length > 2)
        : (isBtnDisabled.value = Object.keys(errors.value).length > 0)
)
const errors = ref({})
const useRegister = useRegisterStore()
const { emailStore } = storeToRefs(useRegister)
const user = ref<IUser>({
    nickName: '',
    email: '',
    password: '',
    repeatPassword: '',
})

const loginUser = async () => {
    try {
        const response = await axios.post('http://localhost:8000/user/login', user.value)
        if (response.data.ok) {
            // Primero guardamos el token en localStorage
            localStorage.setItem('User loged', response.data.token)
            
            // Actualizamos el email al usuario actual que está haciendo login
            emailStore.value = user.value.email
            localStorage.setItem('User registered', JSON.stringify(user.value.email))
            
            // Actualizamos el token en el store
            useRegister.tokenStore = response.data.token
            useRegister.isLogged = true
            
            console.log('EL USUARIO EXISTE EN BD, ESTÁS LOGUEADO 👍')
            router.push({ name: 'dashboard' })
        }

        setTimeout(() => {
            localStorage.removeItem('User loged')
            useRegister.tokenStore = ''
            useRegister.isLogged = false
            alert('Sesion finalizada ❌')
            router.push({ name: 'login' })
        }, response.data.expires)
    } catch (error) {
        alert(`${user.value.email} no existe`)
        console.log(error)
        router.push({ name: 'register' })
    }
}

watch(user.value, () => {
    errors.value = validateForm(user.value)
    isBtnDisabled.value = validateBtnForm.value
})

onMounted(() => {
    if (emailStore.value && isRegisterPath) user.value.email = emailStore.value
})
</script>
