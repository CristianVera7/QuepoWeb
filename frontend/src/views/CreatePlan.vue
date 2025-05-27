<template lang="pug">
    FirstComponent
      .create-plan-view    
        .content-container
          .form-section
            PlanForm(
              :isEditMode="false"
              @plan-created="handlePlanCreated"
            )
            
        .success-modal(v-if="showSuccessModal")
          .modal-content
            i.fas.fa-check-circle
            h3 Plan creado con éxito!
            p {{ successMessage }}
            button.modal-button(@click="navigateToDashboard") Ver mis planes
</template>

<script setup lang="ts">
import FirstComponent from '../components/FirstComponent.vue'
import PlanForm from '../components/PlanForm.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterStore } from '../stores/registerStore'

// Router para la navegación
const router = useRouter()

// Store para verificar el usuario
const { checkUser } = useRegisterStore()

// Estado para el modal de éxito
const showSuccessModal = ref(false)
const successMessage = ref('')

// Comprobar si el usuario está autenticado al cargar la vista
onMounted(async () => {
    await checkUser()
})

// Manejar la creación exitosa de un plan
const handlePlanCreated = (planTitle: string) => {
    successMessage.value = `Tu plan "${planTitle}" ha sido creado correctamente. Puedes verlo en tu dashboard.`
    showSuccessModal.value = true
}

// Navegar al dashboard
const navigateToDashboard = () => {
    router.push('/myPlans')
}
</script>