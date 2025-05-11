<template lang="pug">
    firstComponent
        PlanFiltersMenu(:allPlans="plansList" :hasDni="hasDni" @update:filteredPlans="onFilteredPlansUpdate")
        PlanList(
            :filteredPlans="filteredPlans" 
            :hasDni="hasDni" 
            :message="feedback" 
            :pendingRequestPlans="pendingRequestPlans"
            @joinPlan="joinPlan" 
            @leavePlan="leavePlan"
        )

    .v-modal.modal-overlay(v-if="!hasDni && showModal" )
        .modal-content
            h3 No tienes un DNI registrado
            p Para poder interactuar con la aplicación, necesitas registrar tu DNI.
            .modal-actions
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

const store = useRegisterStore()
const { checkUser, tokenStore } = store
const { hasDni } = storeToRefs(store)
const router = useRouter()

const plansList = ref<IPlan[]>([])
const filteredPlans = ref<IPlan[]>([])
const pendingRequestPlans = ref<string[]>([])
const feedback = 'No hay planes disponibles para esta categoria y/o fecha.'
const showModal = ref(true)

const listOfPlans = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/list', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })
        if (response.data.ok) {
            plansList.value = response.data.data
            filteredPlans.value = response.data.data
        } else {
            console.error('ERROR AL OBTENER LOS PLANES')
        }
    } catch (error) {
        console.error(error)
    }
}

const onFilteredPlansUpdate = (plans: IPlan[]) => {
    filteredPlans.value = plans
}

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

const leavePlan = async (planId: string) => {
    try {
        const response = await axios.delete(`http://localhost:8000/plan/passengerDelete/${planId}`, {
            headers: {
                Authorization: `Bearer ${tokenStore}`
            }
        });
        if (response.data.ok) {
            console.log('Te has salido del plan')
            await listOfPlans()

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

const getPendingRequests = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/pendingRequest', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        });

        if (response.data.ok && response.data.plans) {
            pendingRequestPlans.value = response.data.plans.map((plan: any) => plan.planId);
        }
    } catch (error) {
        console.log('Error al obtener solicitudes pendientes:', error);
    }
}

const goToRegister = () => {
    router.push('/editProfile')
}

const closeModal = () => {
    showModal.value = false
}

onMounted(async () => {
    await checkUser()
    if (!hasDni.value) {
        showModal.value = true
    }

    await getPendingRequests()
    console.log('Solicitudes pendientes del usuario:', pendingRequestPlans.value.length);
    await listOfPlans()
})
</script>

<style scoped lang="scss">
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

.modal-content {
    background-color: rgba(0, 41, 0, 0.966);
    padding: 2rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
    text-align: center;
}

h3 {
    font-size: 1.5rem;
    color: #b60000;
}

p {
    margin: 1rem;
    color: rgb(255, 255, 255);
    background-color: rgba(0, 128, 0, 0.267);
    border-radius: 1rem;
    padding: 1rem;
}

.modal-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;


    button {
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;

        &.go-to-register {
            background-color: #2d89ef;
            color: white;

            &:hover {
                background-color: #2269be;
            }
        }

        &.later {
            background-color: #ec0000;
            color: rgb(255, 255, 255);

            &:hover {
                background-color: #ec0000c5;
            }
        }
    }
}
</style>
