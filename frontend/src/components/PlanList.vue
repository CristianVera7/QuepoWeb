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
const emit = defineEmits(['joinPlan', 'leavePlan']);

const joinPlan = (payload: { planId: string, message: string }) => {
    emit('joinPlan', payload);
}

const leavePlan = (planId: string) => {
    emit('leavePlan', planId);
}

onMounted(()=>console.log('Pending for current user:', props.pendingRequestPlans))
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

@media (max-width: 1024px) {
    .plan-list-container {
        padding: 1.5rem 3rem;
        
        .plan-list {
            gap: 1.8rem;
        }
    }
}

@media (max-width: 768px) {
    .plan-list-container {
        padding: 1.2rem;
        
        .plan-list {
            grid-template-columns: 1fr;
            max-width: 500px;
            margin: 0 auto;
            gap: 1.5rem;
        }
    }
}

@media (max-width: 480px) {
    .plan-list-container {
        padding: 1rem;
        
        .plan-list {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            max-width: 100%;
        }
        
        .no-plans-message {
            padding: 1.5rem;
            
            p {
                font-size: 1rem;
            }
        }
    }
}

@media (max-width: 360px) {
    .plan-list-container {
        padding: 0.8rem;
        
        .plan-list {
            gap: 1.2rem;
        }
        
        .no-plans-message {
            padding: 1rem;
            
            p {
                font-size: 0.9rem;
            }
        }
    }
}
</style>