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
            )
        .no-plans-message(v-else)
            p {{ message }}
</template>

<script setup lang="ts">
import { type IPlan } from '../types/plan';
import CardPlan from './CardPlan.vue';

interface Props {
    filteredPlans: IPlan[];
    hasDni: boolean;
    message: string;
    pendingRequestPlans?: string[];
}

const props = defineProps<Props>();
const emit = defineEmits(['joinPlan', 'leavePlan']);

const joinPlan = (payload: { planId: string, message: string }) => {
    emit('joinPlan', payload);
}

const leavePlan = (planId: string) => {
    emit('leavePlan', planId);
}
</script>

<style scoped lang="scss">
.plan-list-container {
    padding: 2rem 4rem;

    .plan-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 2rem;
    }

    .no-plans-message {
        padding: 2rem;
        text-align: center;
        background-color: #f9f9f962;
        border-radius: 0.5rem;

        p {
            font-size: 1.1rem;
            color: #ffffff;
        }
    }
}

@media (max-width: 768px) {
    .plan-list-container {
        padding: 1rem;
    }

    .plan-list {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .plan-list-container {
        padding: 1rem;
    }

    .plan-list {
        grid-template-columns: 1fr;  /* For smaller screens, cards take full width */
        gap: 1.5rem;
    }

    .plan-card {
        width: 100%;  /* Ensures cards take full width in small screens */
        max-width: 100%;  /* Avoids limiting the size */
    }
}

</style>