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
                            p {{ passenger.nickName }}: {{passenger.message}}
            
                        .actions
                            button.approve(@click="approvePassenger(plan.planId, passenger.id)") Aceptar
                            button.reject(@click="rejectPassenger(plan.planId, passenger.id)") Rechazar
            p(v-else) No tienes solicitudes pendientes
            .goBack
                router-link(to="/dashboard") Volver al panel
</template>

<script setup lang="ts">
import FirstComponent from '../components/FirstComponent.vue';
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue';
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRegisterStore } from '../stores/registerStore'
import type { IPlan } from '../types/plan';
import { storeToRefs } from 'pinia';

const { hasDni } = storeToRefs(useRegisterStore())
const { tokenStore } = useRegisterStore()
const requests = ref<IPlan[]>([])

const getRequestsPlans = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/pending', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })
        console.log(response.data.plans);

        requests.value = response.data.plans.filter((plan: IPlan) => plan.pendingPassengers.length > 0)
    } catch (error) {
        console.error('Error al obtener solicitudes', error)
    }
}

const approvePassenger = async (planId: string, passengerId: string) => {
    try {
        console.log(planId, passengerId)
        const response = await axios.post(`http://localhost:8000/plan/${planId}/passengers/${passengerId}/approve`, {}, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })
        console.log(response);

        getRequestsPlans()
    } catch (error) {
        console.log(error);

    }
}

const rejectPassenger = async (planId: string, passengerId: string) => {
    await axios.post(`http://localhost:8000/plan/${planId}/passengers/${passengerId}/reject`, {}, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenStore}`
        }
    })
    getRequestsPlans()
}

onMounted(() => {
    getRequestsPlans()

})
</script>

<style scoped lang="scss">
.wrapperRequestPlans {
    max-width: 960px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fdfdfd;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .tittlePlan {
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
        color: #2d3748;
        display: grid;
        place-content: center;
    }
}


.planCard {
    background: #f9f9f9;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 2rem;

    .planTitle {
        font-size: 1.3rem;
        color: #2e7d32;
        margin-bottom: 1rem;
        font-weight: 600;
    }

    .passengerCard {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-radius: 8px;
        background-color: #e0f0e9;
        margin-top: 1rem;
        border: 1px solid #edf2f7;

        .passengerInfo {
            max-width: 60%;

            h4 {
                display: grid;
                justify-content: flex-start;
                font-size: 1.1rem;
                color: #2e7d32;
            }

            p {
                display: grid;
                justify-content: flex-start;
                margin: 0.25rem 0 0 0;
                font-size: 1rem;
                color: #2e7d32;
            }
        }

        .actions {
            display: flex;
            gap: 0.5rem;

            button {
                padding: 0.4rem 0.8rem;
                border-radius: 6px;
                font-weight: 500;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;

                &.approve {
                    background-color: #2d89ef;
                    color: white;

                    &:hover {
                        background-color: #2269be;
                    }
                }

                &.reject {
                    background-color: #e53e3e;
                    color: white;

                    &:hover {
                        background-color: #c53030;
                    }
                }
            }
        }
    }
}

.goBack {
    text-align: center;
    margin-top: 2rem;

    a {
        padding: 0.5rem 1rem;
        background-color: #2e7d32;
        font-weight: 900;
        border-radius: 0.6rem;
        color:white;
        text-decoration: none;

        &:hover {
            background-color:#256128;
        }
    }
}
</style>
