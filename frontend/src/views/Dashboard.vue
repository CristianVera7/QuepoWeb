<template lang="pug">
    firstComponent
        PlanFiltersMenu(:allPlans="plansList" :hasDni="hasDni" @update:filteredPlans="onFilteredPlansUpdate")
        PlanList(:filteredPlans="filteredPlans" :hasDni="hasDni" :message="feedback" @joinPlan="joinPlan" @leavePlan="leavePlan")
</template>

<script setup lang="ts">
import firstComponent from '../components/FirstComponent.vue'
import Header from '../components/Header.vue'
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue'
import PlanList from '../components/PlanList.vue'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { type IPlan } from '../types/plan'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'

const store = useRegisterStore()
const { checkUser, tokenStore } = store
const { hasDni } = storeToRefs(useRegisterStore())
const plansList = ref<IPlan[]>([])
const filteredPlans = ref<IPlan[]>([])
const feedback = 'No hay planes disponibles para esta categoria y/o fecha.'

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
            console.log('ERROR AL OBTENER LOS PLANES')
        }
    } catch (error) {
        console.log(error)
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
        } else {
            console.log('ERROR AL SALIR DEL PLAN')
        }
    } catch (error) {
        console.log(error)
    }
}

onMounted(async () => {
    await checkUser()
    await listOfPlans()
})
</script>

<style scoped lang="scss">
</style>