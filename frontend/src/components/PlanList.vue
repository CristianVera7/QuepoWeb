<template lang="pug">
    // Contenedor principal de la lista de planes
    .plan-list-container
        // Si hay planes filtrados, se renderiza la lista
        .plan-list(v-if="filteredPlans.length > 0")
            // Se itera sobre los planes y se renderiza un componente CardPlan por cada uno
            CardPlan(
                v-for="plan in filteredPlans"
                :key="plan._id"  
                :plan="plan"  
                :hasDni="hasDni"  
                :pendingRequestPlans="props.pendingRequestPlans"  
                @joinPlan="joinPlan"  
                @leavePlan="leavePlan"  
            )
        // Si no hay planes filtrados, se muestra un mensaje alternativo
        .no-plans-message(v-else)
            p {{ message }}  
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { type IPlan } from '../types/plan';  // Tipo para los objetos plan
import CardPlan from './CardPlan.vue';  // Componente hijo que representa un plan individual

// Props que recibe este componente desde su componente padre
interface Props {
    filteredPlans: IPlan[];  // Lista de planes filtrados para mostrar
    hasDni: boolean;  // Estado que indica si el usuario tiene DNI registrado
    message: string;  // Mensaje a mostrar si no hay planes
    pendingRequestPlans?: string[];  // IDs de planes con solicitudes pendientes (opcional)
}

// Se definen las props y los eventos que puede emitir el componente
const props = defineProps<Props>();
const emit = defineEmits(['joinPlan', 'leavePlan']);

// Función que emite el evento 'joinPlan' al componente padre
const joinPlan = (payload: { planId: string, message: string }) => {
    emit('joinPlan', payload);
}

// Función que emite el evento 'leavePlan' al componente padre
const leavePlan = (planId: string) => {
    emit('leavePlan', planId);
}

// Al montar el componente, se imprime en consola los planes con solicitud pendiente del usuario
onMounted(() => console.log('Pending for current user:', props.pendingRequestPlans))
</script>
