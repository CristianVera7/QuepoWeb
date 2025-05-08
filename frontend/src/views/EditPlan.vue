<template lang="pug">
    FirstComponent
      .edit-plan-view    
        .content-container
          .form-section
            PlanForm(
              :isEditMode="true"
              :planId="planId"
              @plan-updated="handlePlanUpdated"
            )
            
        .success-modal(v-if="showSuccessModal")
          .modal-content
            i.fas.fa-check-circle
            h3 Plan actualizado con éxito!
            p {{ successMessage }}
            button.modal-button(@click="navigateToDashboard") Ver mis planes
</template>

<script setup lang="ts">
import FirstComponent from '../components/FirstComponent.vue'
import PlanForm from '../components/PlanForm.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRegisterStore } from '../stores/registerStore'

// Router y route para la navegación
const router = useRouter()
const route = useRoute()
const planId = route.params.id as string

// Store para verificar el usuario
const { checkUser } = useRegisterStore()

// Estado para el modal de éxito
const showSuccessModal = ref(false)
const successMessage = ref('')

// Comprobar si el usuario está autenticado al cargar la vista
onMounted(async () => {
    await checkUser()
})

// Manejar la actualización exitosa de un plan
const handlePlanUpdated = (planTitle: string) => {
    successMessage.value = `Tu plan "${planTitle}" ha sido actualizado correctamente.`
    showSuccessModal.value = true
}

// Navegar al dashboard
const navigateToDashboard = () => {
    router.push('/dashboard')
}
</script>

<style lang="scss" scoped>
.edit-plan-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    padding-bottom: 3rem;

    .content-container {
        flex: 1;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .success-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;

        .modal-content {
            background-color: #022c05;
            border-radius: 12px;
            padding: 2.5rem;
            text-align: center;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);

            i {
                font-size: 4rem;
                color: #4CAF50;
                margin-bottom: 1.5rem;
            }

            h3 {
                font-size: 1.8rem;
                margin-bottom: 1rem;
                color: #ffffff;
            }

            p {
                margin-bottom: 2rem;
                color: rgba(255, 255, 255, 0.8);
                line-height: 1.5;
            }

            .modal-button {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 179, 0, 0.3);

                &:hover {
                    background-color: #43a047;
                    box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
                }
            }
        }
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

// Ajustes para pantallas pequeñas
@media (max-width: 768px) {
    .edit-plan-view {
        .content-container {
            padding: 1.5rem 1rem;
        }
    }
}
</style>