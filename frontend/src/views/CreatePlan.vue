<template lang="pug">
    // Componente base que envuelve la vista
    FirstComponent
        .create-plan-view    
            .content-container
                .form-section
                    // Formulario de creación de plan, no está en modo edición
                    PlanForm(
                        :isEditMode="false"
                        @plan-created="handlePlanCreated" 
                    )

        // Modal que se muestra al crear exitosamente un plan
        .success-modal(v-if="showSuccessModal")
            .modal-content
                i.fas.fa-check-circle // Icono de éxito
                h3 Plan creado con éxito!
                p {{ successMessage }} // Mensaje personalizado con el nombre del plan
                button.modal-button(@click="navigateToDashboard") Ver mis planes
</template>

<script setup lang="ts">
import FirstComponent from '../components/FirstComponent.vue'
import PlanForm from '../components/PlanForm.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterStore } from '../stores/registerStore'

// Router para poder redirigir al usuario
const router = useRouter()

// Store para verificar que el usuario esté autenticado
const { checkUser } = useRegisterStore()

// Estado reactivo para controlar si se muestra el modal de éxito
const showSuccessModal = ref(false)
const successMessage = ref('') // Contendrá el mensaje personalizado tras crear el plan

// Se ejecuta al cargar la vista: verifica que el usuario esté autenticado
onMounted(async () => {
    await checkUser()
})

// Función que se ejecuta cuando el plan ha sido creado correctamente
const handlePlanCreated = (planTitle: string) => {
    // Se personaliza el mensaje con el título del plan creado
    successMessage.value = `Tu plan "${planTitle}" ha sido creado correctamente. Puedes verlo en tu dashboard.`
    showSuccessModal.value = true // Se muestra el modal
}

// Redirige al usuario al dashboard para ver sus planes
const navigateToDashboard = () => {
    router.push('/myPlans')
}
</script>
