<template lang="pug">
    FirstComponent
      .edit-plan-view    
        .content-container
          .form-section
            PlanForm(
              :isEditMode="true"
              :planId="planId"
              @plan-updated="handlePlanUpdated"
              @plan-deleted="handlePlanDeleted"
            )
            
        .success-modal(v-if="showSuccessModal")
            .modal-content
                i(:class="isDeleteSuccess ? 'fas fa-trash' : 'fas fa-check-circle'")
                h3 {{ modalTitle }}
                p {{ successMessage }}
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
const planId = route.params.id as string

// Store para verificar el usuario
const { checkUser } = useRegisterStore()

// Estado para el modal de éxito
const showSuccessModal = ref(false)
const successMessage = ref('')
const isDeleteSuccess = ref(false)
const modalTitle = ref('Plan actualizado con éxito!')

// Comprobar si el usuario está autenticado al cargar la vista
onMounted(async () => {
    await checkUser()
})

// Manejar la actualización exitosa de un plan
const handlePlanUpdated = (planTitle: string) => {
    isDeleteSuccess.value = false
    modalTitle.value = 'Plan actualizado con éxito!'
    successMessage.value = `Tu plan "${planTitle}" ha sido actualizado correctamente.`
    showSuccessModal.value = true
}

// Manejar la eliminación exitosa de un plan
const handlePlanDeleted = (planTitle: string) => {
    isDeleteSuccess.value = true
    modalTitle.value = 'Plan eliminado con éxito!'
    successMessage.value = `Tu plan "${planTitle}" ha sido eliminado correctamente.`
    showSuccessModal.value = true
    router.push('/myPlans')
}

// Navegar al dashboard
const navigateToDashboard = () => {
    router.push('/myPlans')
}
</script>