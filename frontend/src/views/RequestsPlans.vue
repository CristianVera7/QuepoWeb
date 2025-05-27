<template lang="pug">
    FirstComponent
        PlanFiltersMenu(:hasDni="hasDni")
        .wrapperRequestPlans
            template(v-if="requests.length > 0 && requests.some(plan => plan.pendingPassengers.length > 0)") 
                .planCard(v-for="plan in requests" :key="plan._id")
                    h3.planTitle {{ plan.planTitle }}

                    .passengerCard(v-for="passenger in plan.pendingPassengers" :key="passenger._id")
                        .passengerInfo
                            h4 {{ passenger.nickName }} se quiere unir al plan.
                            p {{ passenger.nickName }}: {{ passenger.message }}
            
                        .actions
                            button.approve(@click="approvePassenger(plan.planId, passenger.id)") Aceptar
                            button.reject(@click="rejectPassenger(plan.planId, passenger.id)") Rechazar
            p(v-else) No tienes solicitudes pendientes
</template>

<script setup lang="ts">
import FirstComponent from '../components/FirstComponent.vue';
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue';
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRegisterStore } from '../stores/registerStore';
import type { IPlan } from '../types/plan';
import { storeToRefs } from 'pinia';

const { hasDni } = storeToRefs(useRegisterStore());
const { tokenStore } = useRegisterStore();
const requests = ref<IPlan[]>([]);

const getRequestsPlans = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/pending', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`,
            },
        });
        console.log(response.data.plans);
        requests.value = response.data.plans.filter((plan: IPlan) => plan.pendingPassengers.length > 0);
    } catch (error) {
        console.error('Error al obtener solicitudes', error);
    }
};

const approvePassenger = async (planId: string, passengerId: string) => {
    try {
        console.log(planId, passengerId);
        const response = await axios.post(
            `http://localhost:8000/plan/${planId}/passengers/${passengerId}/approve`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenStore}`,
                },
            }
        );
        console.log(response);
        getRequestsPlans();
    } catch (error) {
        console.log(error);
    }
};

const rejectPassenger = async (planId: string, passengerId: string) => {
    await axios.post(
        `http://localhost:8000/plan/${planId}/passengers/${passengerId}/reject`,
        {},
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`,
            },
        }
    );
    getRequestsPlans();
};

onMounted(() => {
    getRequestsPlans();
});
</script>
