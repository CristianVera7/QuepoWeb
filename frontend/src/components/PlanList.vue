// En PlanList.vue, actualiza el template y el script:

<template lang="pug">
    .plan-list-container
        .plan-list(v-if="filteredPlans.length > 0")
            CardPlan(
                v-for="plan in filteredPlans"
                :key="plan._id"  
                :plan="plan"  
                :hasDni="hasDni"  
                :pendingRequestPlans="props.pendingRequestPlans"  
                @joinPlan="joinPlan"  
                @leavePlan="leavePlan"
                @cancelRequest="cancelRequest"
            )
        .no-plans-message(v-else)
            p {{ message }}  
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { type IPlan } from '../types/plan';
import CardPlan from './CardPlan.vue';

interface Props {
    filteredPlans: IPlan[];
    hasDni: boolean;
    message: string;
    pendingRequestPlans?: string[];
}

const props = defineProps<Props>();
const emit = defineEmits(['joinPlan', 'leavePlan', 'cancelRequest']); // Añade 'cancelRequest'

const joinPlan = (payload: { planId: string, message: string }) => {
    emit('joinPlan', payload);
}

const leavePlan = (planId: string) => {
    emit('leavePlan', planId);
}

// Nueva función para manejar la cancelación de solicitudes
const cancelRequest = (planId: string) => {
    emit('cancelRequest', planId);
}

onMounted(() => console.log('Pending for current user:', props.pendingRequestPlans))
</script>
