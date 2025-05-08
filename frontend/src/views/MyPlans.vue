<template lang="pug">
    firstComponent
        PlanFiltersMenu(:allPlans="plansList" :hasDni="hasDni" @update:filteredPlans="onFilteredPlansUpdate")
        PlanList(:filteredPlans="displayedPlans" :hasDni="hasDni" :message="message" @leavePlan="leavePlan")
</template>

<script setup lang="ts">
import firstComponent from '../components/FirstComponent.vue';
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue';
import PlanList from '../components/PlanList.vue';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRegisterStore } from '../stores/registerStore';
import type { IPlan } from '../types/plan';
import { storeToRefs } from 'pinia';

const store = useRegisterStore();
const { checkUser, tokenStore } = store;
const { hasDni } = storeToRefs(useRegisterStore());

const plansList = ref<IPlan[]>([]);
const displayedPlans = ref<IPlan[]>([]);
const message = 'No tienes planes en los que seas participe.';

const onFilteredPlansUpdate = (plans: IPlan[]) => {
    displayedPlans.value = plans;
};

const listOfPlans = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/myPlans', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        });

        if (response.data.ok) {
            console.log('Planes obtenidos:', response.data.plansList);
            plansList.value = response.data.plansList;
            // Al cargar los planes, inicializamos también los planes filtrados
            displayedPlans.value = response.data.plansList;
        } else {
            console.log('ERROR AL OBTENER LOS PLANES');
        }
    } catch (error) {
        console.error(error);
    }
};

const leavePlan = async (planId: string) => {
    try {
        const response = await axios.delete(`http://localhost:8000/plan/passengerDelete/${planId}`, {
            headers: {
                Authorization: `Bearer ${tokenStore}`
            }
        });

        if (response.data.ok) {
            console.log('Te has salido del plan');
            await listOfPlans();
        } else {
            console.log('ERROR AL SALIR DEL PLAN');
        }
    } catch (error) {
        console.log(error);
    }
};

onMounted(async () => {
    await checkUser();
    await listOfPlans();
});
</script>