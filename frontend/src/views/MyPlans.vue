<template lang="pug">
    firstComponent
        PlanFiltersMenu(:allPlans="plansList" :hasDni="hasDni" @update:filteredPlans="onFilteredPlansUpdate")
        PlanList(:filteredPlans="displayedPlans" :hasDni="hasDni" :pendingRequestPlans="pendingRequestPlans" :message="message" @leavePlan="leavePlan")
</template>

<script setup lang="ts">
// Importación de componentes y librerías necesarias
import firstComponent from '../components/FirstComponent.vue';
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue';
import PlanList from '../components/PlanList.vue';
import { ref, onMounted, watch } from 'vue';
import api from '../api/index';
import { useRegisterStore } from '../stores/registerStore';
import type { IPlan } from '../types/plan';
import { storeToRefs } from 'pinia';

// Uso del store de registro
const store = useRegisterStore();
const { checkUser, tokenStore } = store;
const { hasDni } = storeToRefs(useRegisterStore());

// Listado de todos los planes obtenidos del backend
const plansList = ref<IPlan[]>([]);

// Planes actualmente visibles (pueden estar filtrados)
const displayedPlans = ref<IPlan[]>([]);

// Lista de IDs de planes en los que hay solicitudes pendientes del usuario
const pendingRequestPlans = ref<string[]>([]);

// Mensaje por defecto cuando el usuario no tiene planes
const message = 'No tienes planes en los que seas participe.';

// Función que actualiza los planes visibles según filtros aplicados
const onFilteredPlansUpdate = (plans: IPlan[]) => {
    displayedPlans.value = plans;
};

// Función que obtiene los planes del usuario desde el backend
const listOfPlans = async () => {
    try {
        const response = await api.get('/plan/myPlans', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        });

        if (response.data.ok) {
            console.log('Planes obtenidos:', response.data.plansList);
            plansList.value = response.data.plansList;
            displayedPlans.value = [...plansList.value]
            // displayedPlans.value = response.data.plansList; // se inicializan los planes visibles
        } else {
            console.log('ERROR AL OBTENER LOS PLANES');
            displayedPlans.value = [];
        }
    } catch (error) {
        console.log('Comprobacion del error');
        displayedPlans.value = [];
        console.error(error);
    }
};

// Función para que el usuario abandone un plan
const leavePlan = async (planId: string) => {
    try {
        const response = await api.delete(`/plan/passengerDelete/${planId}`, {
            headers: {
                Authorization: `Bearer ${tokenStore}`
            }
        });

        if (response.data.ok) {
            console.log('Te has salido del plan');
            await listOfPlans(); // se actualiza la lista luego de salir del plan
        } else {
            console.log('ERROR AL SALIR DEL PLAN');
        }
    } catch (error) {
        console.log(error);
    }
};

// Función que obtiene los planes con solicitudes pendientes del usuario
const getPendingRequests = async () => {
    try {
        const response = await api.get('/plan/pendingRequest', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        });

        if (response.data.ok && response.data.plans) {
            // Extrae solo los IDs de los planes con solicitudes pendientes
            pendingRequestPlans.value = response.data.plans.map((plan: any) => plan.planId);
        }
    } catch (error) {
        console.log('Error al obtener solicitudes pendientes:', error);
    }
}


// Cuando se monta la vista, se valida al usuario y se cargan sus planes y solicitudes pendientes
onMounted(async () => {
    await checkUser(); // verifica al usuario logueado
    await listOfPlans(); // obtiene sus planes actuales
    await getPendingRequests(); // obtiene sus solicitudes pendientes
});
</script>