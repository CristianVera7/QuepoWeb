<template lang="pug">
    .register-view
        .firstWrapper
            .formContainer
                .firstBlock
                    NavMenuMobile
                    .view
                        p.h2 Únete a una comunidad comprometida con la sostenibilidad y el cambio positivo.
                    .form-wrapper
                        form.form
                            input(type="text" placeholder="Nickname" @focus='focusField="nickName"' :class='errors.nickName?"fieldError":"field"' v-model='user.nickName' v-if="isRegisterPath") 
                            p.msgError(v-if='focusField==="nickName"&&errors.nickName') {{errors.nickName}}
                            input( type="text" placeholder="Email"  @focus='focusField="email"' :class='errors.email?"fieldError":"field"' v-model='user.email' )
                            p.msgError(v-if='focusField==="email"&&errors.email') {{errors.email}}
                            input(type="password" placeholder="Password" @focus='focusField="password"'  :class='errors.password?"fieldError":"field"' v-model='user.password')
                            p.msgError(v-if='focusField==="password"&&errors.password') {{errors.password}}
                            input(type="password" placeholder="Repeat password" @focus='focusField="repeatPassword"' :class='errors.repeatPassword?"fieldError":"field"' v-model='user.repeatPassword' v-if="isRegisterPath")
                            p.msgError(v-if='focusField==="repeatPassword"&&errors.repeatPassword') {{errors.repeatPassword}}
                            button.btnForm(@click.prevent='registerUser' :disabled='isBtnDisabled') Sign up
                            .divRouteLogin 
                                label Already have an account?
                                Router-link.routeLogin(:to="{name:'login'}") Log in
                .secondBlock
                    Sponsors    
</template>

<script setup lang="ts">
import NavMenuMobile from '../components/NavMenuMobile.vue'
import Sponsors from '../components/Sponsors.vue'
import axios from 'axios'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validateForm } from '../validations/validationUser'
import { useRegisterStore } from '../stores/registerStore'
import { type IUser } from '../types/user'

const route = useRoute()
const router = useRouter()
const focusField = ref('')
const errors = ref({})
const isRegisterPath = computed(() => route.path === '/register')
const isBtnDisabled = ref<boolean>(true)
const validateBtnForm = computed(() =>
    !isRegisterPath.value
        ? (isBtnDisabled.value = Object.keys(errors.value).length > 2)
        : (isBtnDisabled.value = Object.keys(errors.value).length > 0)
)
const user = ref<IUser>({
    nickName: '',
    email: '',
    password: '',
    repeatPassword: '',
})
const { setMailStore, setisRegisteredStore } = useRegisterStore()

const registerUser = async () => {
    if (user.value.password !== user.value.repeatPassword) {
        console.log('Error al repetir tu contraseña')
        return
    }
    try {
        const response = await axios.post('http://localhost:8000/user/register', user.value)
        if (response.data.ok === false) return alert('Este usuario ya existe')
        setisRegisteredStore(true)
        router.push({ name: 'login' })
        setMailStore(user.value.email)
        localStorage.setItem('User registered', JSON.stringify(user.value.email))
        if (response) console.log('USUARIO CREADO CORRECTAMENTE 👍')
    } catch (error) {
        console.log('Ha habido un problema al crear al usuario ❌', error)
    }
}

watch(user.value, () => {
    errors.value = validateForm(user.value)
    isBtnDisabled.value = validateBtnForm.value
})
</script>
