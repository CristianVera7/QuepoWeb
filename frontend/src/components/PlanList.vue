<template lang="pug">
    .plan-list-container
        .plan-list(v-if="filteredPlans.length > 0")
            CardPlan(
                v-for="plan in filteredPlans"
                :key="plan._id"
                :plan="plan"
                :hasDni="hasDni"
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
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        align-items: start;
        gap: 5rem;
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
    .plan-list {
        grid-template-columns: 1fr !important;
    }
}
</style>