<template lang="pug">
    // Layout base que envuelve la vista
    firstComponent
        // Menú de filtros con los planes y estado del DNI
        PlanFiltersMenu(
            :allPlans="plansList"
            :hasDni="hasDni"
            @update:filteredPlans="onFilteredPlansUpdate" 
        )

        // Lista de planes filtrados, pasando también si tiene DNI y planes con solicitud pendiente
        PlanList(
            :filteredPlans="filteredPlans"
            :hasDni="hasDni"
            :message="feedback" 
            :pendingRequestPlans="pendingRequestPlans"
            @joinPlan="joinPlan" 
            @cancelRequest="cancelRequest"
            @leavePlan="leavePlan" 
        )

    // Modal que aparece si el usuario no tiene DNI registrado
    .v-modal.modalDNI-overlay(v-if="!hasDni && showModal")
        .modalDNI-content
            h3 No tienes un DNI registrado
            p Para poder interactuar con la aplicación, necesitas registrar tu DNI.
            .modalDNI-actions
                button.go-to-register(@click="goToRegister") Registrar ahora
                button.later(@click="closeModal") Más tarde
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterStore } from '../stores/registerStore'
import axios from 'axios'
import { type IPlan } from '../types/plan'
import firstComponent from '../components/FirstComponent.vue'
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue'
import PlanList from '../components/PlanList.vue'
import { storeToRefs } from 'pinia'

// Store de autenticación y estado del usuario
const store = useRegisterStore()
const { checkUser, tokenStore } = store
const { hasDni } = storeToRefs(store)

const router = useRouter()

// Listado completo y filtrado de planes
const plansList = ref<IPlan[]>([])
const filteredPlans = ref<IPlan[]>([])

// IDs de planes donde el usuario ya solicitó unirse
const pendingRequestPlans = ref<string[]>([])

const feedback = 'No hay planes disponibles para esta categoria y/o fecha.'
const showModal = ref(true)

// Solicita la lista de planes disponibles
const listOfPlans = async () => {
    try {
        console.log("PASAMOS POR AQUI 👌");
        const response = await axios.get('http://localhost:8000/plan/list', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })
        
        if (response.data.ok) {
            plansList.value = response.data.data
            // filteredPlans.value = response.data.data // Por defecto muestra todos
        } else {
            console.error('ERROR AL OBTENER LOS PLANES')
        }
    } catch (error) {
        console.error(error)
    }
}

// Se actualiza la lista de planes filtrados desde PlanFiltersMenu
const onFilteredPlansUpdate = (plans: IPlan[]) => {
    filteredPlans.value = plans
}

// Envía una solicitud para unirse a un plan
const joinPlan = async (payload: { planId: string, message: string }) => {
    await checkUser()
    try {
        const response = await axios.post(`http://localhost:8000/plan/join/${payload.planId}`, { message: payload.message }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })
        if (response.data.ok) {
            console.log('Solicitud enviada')
            pendingRequestPlans.value.push(payload.planId)
        } else {
            console.log('ERROR AL ENVIAR LA SOLICITUD')
        }
    } catch (error) {
        console.log(error)
    }
}

// En el componente padre
const cancelRequest = async (planId: string) => {
    try {
        const response = await axios.delete(`http://localhost:8000/plans/${planId}/cancel-request`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        });

        if (response.data.ok) {
            // Actualizar pendingRequestPlans directamente
            const index = pendingRequestPlans.value.indexOf(planId)
            if (index !== -1) {
                pendingRequestPlans.value.splice(index, 1)
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Permite abandonar un plan al que ya se unió
const leavePlan = async (planId: string) => {
    try {
        const response = await axios.delete(`http://localhost:8000/plan/passengerDelete/${planId}`, {
            headers: {
                Authorization: `Bearer ${tokenStore}`
            }
        })
        if (response.data.ok) {
            console.log('Te has salido del plan')
            await listOfPlans() // Recarga los planes para reflejar cambios

            // Remueve el plan de la lista de solicitudes pendientes
            const index = pendingRequestPlans.value.indexOf(planId)
            if (index !== -1) {
                pendingRequestPlans.value.splice(index, 1)
            }
        } else {
            console.log('ERROR AL SALIR DEL PLAN')
        }
    } catch (error) {
        console.log(error)
    }
}

// Obtiene las solicitudes pendientes del usuario (planes en los que pidió unirse)
const getPendingRequests = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/pendingRequest', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })

        if (response.data.ok && response.data.plans) {
            pendingRequestPlans.value = response.data.plans.map((plan: any) => plan.planId)
        }
    } catch (error) {
        console.log('Error al obtener solicitudes pendientes:', error)
    }
}

// Redirige al usuario a editar su perfil para registrar su DNI
const goToRegister = () => {
    router.push('/editProfile')
}

// Cierra el modal informativo
const closeModal = () => {
    showModal.value = false
}

// Al cargar la vista
onMounted(async () => {
    await checkUser() // Verifica el usuario autenticado

    // Muestra el modal si no tiene DNI
    if (!hasDni.value) {
        showModal.value = true
    }

    await getPendingRequests() // Carga las solicitudes del usuario
    console.log('Solicitudes pendientes del usuario:', pendingRequestPlans.value.length)

    await listOfPlans() // Carga los planes disponibles
})
</script>
