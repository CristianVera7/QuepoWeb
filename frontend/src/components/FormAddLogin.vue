<template lang="pug">
        .form-wrapper
            form.form
                input(type="text" placeholder="Nickname" @focus='focusField="nickName"' :class='errors.nickName?"fieldError":"field"' v-model='user.nickName' v-if="isRegisterPath") 
                p.msgError(v-if='focusField==="nickName"&&errors.nickName') {{errors.nickName}}
                input( type="text" placeholder="Email"  @focus='focusField="email"' :class='errors.email?"fieldError":"field"' v-model='user.email' )
                p(v-if="!isRegisterPath") {{props.emailStore}} 
                p.msgError(v-if='focusField==="email"&&errors.email') {{errors.email}}
                input(type="password" placeholder="Password" @focus='focusField="password"'  :class='errors.password?"fieldError":"field"' v-model='user.password')
                p.msgError(v-if='focusField==="password"&&errors.password') {{errors.password}}
                input(type="password" placeholder="Repeat password" @focus='focusField="repeatPassword"' :class='errors.repeatPassword?"fieldError":"field"' v-model='user.repeatPassword' v-if="isRegisterPath")
                p.msgError(v-if='focusField==="repeatPassword"&&errors.repeatPassword') {{errors.repeatPassword}}
                button.btnForm(@click.prevent='handleSubmit' :disabled='isBtnDisabled') {{props.textButton}}
                .divRouteLogin 
                    label {{props.message}}
                    Router-link.routeLogin(:to="{name: props.pathRouterLink}") {{props.textRouterLink}}
        .divLogoMobile
            img(src="../img/logo/whiteLogo.png")
</template>

<script setup lang="ts">
import { Form, Field, ErrorMessage, type ValidationResult } from 'vee-validate'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { validateForm } from '../validations/validationUser'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import { type IUser } from '../types/user'

const route = useRoute()
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

const props = defineProps({
    textButton: { type: String, required: true },
    onsubmit: { type: Function, required: false },
    message: { type: String, required: true },
    pathRouterLink: { type: String, required: true },
    textRouterLink: { type: String, required: true },
})
const emits = defineEmits(['registerSubmit', 'loginSubmit'])

const handleSubmit = () => {
    const loginEmit = emits('loginSubmit', user.value)
    const registerEmit = emits('registerSubmit', user.value)
    return { loginEmit, registerEmit }
}

watch(user.value, () => {
    errors.value = validateForm(user.value)
    isBtnDisabled.value = validateBtnForm.value
})

onMounted(() => {
    if (emailStore && route.path === '/login') user.value.email = emailStore.value
})
</script>
