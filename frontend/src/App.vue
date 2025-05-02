<template lang="pug">
        RouterView
</template>

<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useRegisterStore } from './stores/registerStore'
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

let repeatFind
const store = useRegisterStore()
const { checkUser, checkToken, hasTokenLocalStorage } = useRegisterStore()
const { isRegistered, isLogged } = storeToRefs(store)
const router = useRouter()

// async function refresh() {
//     repeatFind = setInterval(async () => {
//         if (!(await checkUser())) {
//             console.log('NO HAY USUARIO')
//             return router.push({ name: 'register' })
//         }
//         if (await checkToken()) {
//             console.log('hay token')
//             router.push({ name: 'dashboard' })
//         } else {
//             console.log('NO HAY TOKEN')
//             router.push({ name: 'login' })
//         }
//     }, 5000)
// }
// const clearSetInterval = clearInterval(repeatFind)

onMounted(async () => {
    await checkUser()
    if (isRegistered.value && isLogged.value) router.push({ name: 'dashboard' })
    else if (isRegistered.value) router.push({ name: 'login' })
    else router.push({ name: 'register' })

    // refresh()
    // clearSetInterval
})
</script>

<style src="./styles/init.scss"></style>
