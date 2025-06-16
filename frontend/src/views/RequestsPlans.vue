<template lang="pug">
    // Componente superior reutilizable
    FirstComponent
        // Menú de filtros que depende de si el usuario tiene o no DNI
        PlanFiltersMenu(:hasDni="hasDni")
        .wrapperRequestPlans
            // Se muestra solo si hay planes con pasajeros pendientes
            template(v-if="requests.length > 0 && requests.some(plan => plan.pendingPassengers.length > 0)") 
                // Itera sobre cada plan con solicitudes pendientes
                .planCard(v-for="plan in requests" :key="plan._id")
                    h3.planTitle {{ plan.planTitle }}

                    // Itera sobre los pasajeros que han solicitado unirse al plan
                    .passengerCard(v-for="passenger in plan.pendingPassengers" :key="passenger.userId")
                        .passengerInfo
                            h4 {{ passenger.nickName }} se quiere unir al plan.
                            p {{ passenger.nickName }}: {{ passenger.message }}

                        // Botones para aceptar o rechazar la solicitud
                        .actions
                            button.approve(@click="approvePassenger(plan.planId, passenger.userId)") Aceptar
                            button.reject(@click="rejectPassenger(plan.planId, passenger.userId)") Rechazar

            // Si no hay solicitudes, se muestra este mensaje
            p.noRequest(v-else) No tienes solicitudes pendientes.
</template>

<script setup lang="ts">
/**
 * Importación de componentes de UI reutilizables.
 */
import FirstComponent from '../components/FirstComponent.vue';
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue';

/**
 * Importaciones necesarias para el manejo de estado, datos y ciclo de vida.
 */
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRegisterStore } from '../stores/registerStore';
import type { IPlan } from '../types/plan';
import { storeToRefs } from 'pinia';

/**
 * Se extraen propiedades reactivas del store de registro de usuario.
 */
const { hasDni } = storeToRefs(useRegisterStore());
const { tokenStore } = useRegisterStore();

/**
 * Lista reactiva que almacenará los planes pendientes de aprobación.
 */
const requests = ref<IPlan[]>([]);

/**
 * Función que obtiene los planes con pasajeros pendientes de aprobación.
 */
const getRequestsPlans = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/pending', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`, // Se usa el token del usuario autenticado.
            },
        });
        console.log(response.data.plans);

        // Se filtran únicamente los planes que tengan pasajeros pendientes.
        requests.value = response.data.plans.filter((plan: IPlan) => plan.pendingPassengers.length > 0);
    } catch (error) {
        console.error('Error al obtener solicitudes', error);
    }
};

/**
 * Función para aprobar a un pasajero dentro de un plan.
 * Envía una solicitud POST al backend para confirmar la aprobación.
 */
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

        // Se actualiza la lista después de aprobar.
        getRequestsPlans();
    } catch (error) {
        console.log(error);
    }
};

/**
 * Función para rechazar a un pasajero dentro de un plan.
 * Al igual que aprobar, hace un POST al endpoint correspondiente.
 */
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

    // Se actualiza la lista luego del rechazo.
    getRequestsPlans();
};

/**
 * Hook de ciclo de vida que se ejecuta al montar el componente.
 * Se hace la primera carga de planes pendientes.
 */
onMounted(() => {
    getRequestsPlans();
});
</script>

