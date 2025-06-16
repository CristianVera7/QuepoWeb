<template lang="pug">
    FirstComponent
      .edit-plan-view    
        .content-container
          .form-section
            // Componente del formulario de plan, reutilizado en modo edición
            PlanForm(
              :isEditMode="true"
              :planId="planId"
              @plan-updated="handlePlanUpdated" 
              @plan-deleted="handlePlanDeleted" 
            )
            
        // Modal de éxito que se muestra tras actualizar o eliminar un plan
        .success-modal(v-if="showSuccessModal")
            .modal-content
                // Ícono cambia según si fue actualización o eliminación
                i(:class="isDeleteSuccess ? 'fas fa-trash' : 'fas fa-check-circle'")
                h3 {{ modalTitle }} 
                p {{ successMessage }}
                // Botón que redirige a la vista de planes
                button.modal-button(@click="navigateToDashboard") {{ isDeleteSuccess ? 'Volver a mis planes' : 'Ver mis planes' }}
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
// Se obtiene el ID del plan desde la URL
const planId = route.params.id as string

// Store para verificar el usuario autenticado
const { checkUser } = useRegisterStore()

// Estados del modal de éxito
const showSuccessModal = ref(false)
const successMessage = ref('')
const isDeleteSuccess = ref(false)
const modalTitle = ref('Plan actualizado con éxito!')

// Verificar autenticación del usuario al cargar la vista
onMounted(async () => {
    await checkUser()
})

// Callback al actualizar un plan exitosamente
const handlePlanUpdated = (planTitle: string) => {
    isDeleteSuccess.value = false // No fue eliminación
    modalTitle.value = 'Plan actualizado con éxito!'
    successMessage.value = `Tu plan "${planTitle}" ha sido actualizado correctamente.`
    showSuccessModal.value = true
}

// Callback al eliminar un plan exitosamente
const handlePlanDeleted = (planTitle: string) => {
    isDeleteSuccess.value = true // Fue una eliminación
    modalTitle.value = 'Plan eliminado con éxito!'
    successMessage.value = `Tu plan "${planTitle}" ha sido eliminado correctamente.`
    showSuccessModal.value = true
    router.push('/myPlans') // Redirige tras eliminar
}

// Redirige manualmente a la vista de planes
const navigateToDashboard = () => {
    router.push('/myPlans')
}
</script>
