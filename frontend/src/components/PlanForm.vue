<template lang="pug">
    .plan-form-container
        PlanFiltersMenu(:hasDni="hasDni")
        .plan-creation-container
            form.formPlan(@submit.prevent="submitForm")
                .form-group
                    label(for="plan-title") Título
                    input#plan-title(type="text" placeholder="Título de tu aventura" v-model="planData.title" required)
                
                .form-group
                    label(for="plan-category") Categoría
                    select#plan-category(v-model="planData.category" required)
                        option(disabled value="") Selecciona una categoría
                        option(value="Pesca") Pesca
                        option(value="Senderismo") Senderismo
                        option(value="Escalada") Escalada

                .form-group
                    label(for="plan-description") Descripción
                    textarea#plan-description(placeholder="Describe tu plan de aventura" v-model="planData.description" required)
                
                .form-group.map-section
                    label.map-label Selecciona la ruta
                    .map-wrapper
                        MapSelector(
                            @route-confirmed="handleRoute" 
                            :initialOrigin="planData.route.location.origin"
                            :initialDestination="planData.route.location.destination"
                        )
                    .route-info(v-if="planData.route.location.origin && planData.route.location.destination")
                        .route-detail
                            i.fas.fa-map-marker-alt
                            span Origen: {{ planData.route.location.origin }}
                        .route-detail
                            i.fas.fa-flag-checkered
                            span Destino: {{ planData.route.location.destination }}
                        .route-stats
                            .route-stat
                                i.fas.fa-road
                                span Distancia: {{ planData.route.distance }}
                            .route-stat
                                i.fas.fa-clock
                                span Duración: {{ planData.route.duration }}
                
                .form-row
                    .form-group.half
                        label(for="plan-date") Fecha y hora
                        //- Reemplazo del input datetime-local por flatpickr
                        flat-pickr#plan-date(
                            v-model="planData.dateTime"
                            :config="dateTimeConfig"
                            placeholder="Selecciona fecha y hora"
                            required
                        )
                    
                    .form-group.half
                        label(for="plan-places") Plazas disponibles
                        input#plan-places(type="number" min="1" placeholder="Número de plazas" v-model="planData.placesAvailable" required)
                    
                    .form-group.half
                        label(for="plan-price") Precio por plaza
                        .price-input-container
                            input#plan-price(type="number" min="1" placeholder="Precio" v-model="planData.price" required)
                            span.price-currency €

                .form-group.car-section
                    h3 
                        i.fas.fa-car
                        span Información del vehículo
                    .car-info-grid
                        .car-info-item
                            label(for="car-plate") Matrícula
                            input#car-plate(type="text" placeholder="Ej: 12345EFD" v-model="planData.carInformation.carIdentifier")
                        
                        .car-info-item
                            label(for="car-brand") Marca
                            input#car-brand(type="text" placeholder="Ej: Toyota" v-model="planData.carInformation.brand")
                        
                        .car-info-item
                            label(for="car-model") Modelo
                            input#car-model(type="text" placeholder="Ej: Rav4" v-model="planData.carInformation.model")
                        
                        .car-info-item
                            label(for="car-color") Color
                            input#car-color(type="text" placeholder="Azul" v-model="planData.carInformation.color")

                .section-box.passengers-info(v-if="isEditMode && planData.passengers && planData.passengers.length > 0")
                    h3
                        i.fas.fa-users
                        span Pasajeros ({{ planData.passengers.length || 0 }})
                    ul.passenger-list
                        li.passenger-item(v-for="passenger in planData.passengers" :key="passenger._id") 
                            i.fas.fa-user
                            span {{ passenger.nickName }}

                .form-actions
                    .message-container(v-if="message" :class="{ 'success': message.includes('éxito'), 'error': message.includes('Error') || message.includes('campos') }")
                        i.fas(:class="message.includes('éxito') ? 'fa-check-circle' : 'fa-exclamation-circle'")
                        p {{ message }}
                    
                    .button-group
                        button.cancel-button(type="button" @click="cancelForm" v-if="isEditMode")
                            i.fas.fa-times
                            span Cancelar
                        
                        button.submit-button(type="submit" :disabled="loading")
                            i.fas(:class="isEditMode ? 'fa-save' : 'fa-paper-plane'")
                            span {{ isEditMode ? 'Guardar cambios' : 'Crear plan' }}
                            span.loading-indicator(v-if="loading") ...
                        
                        button.delete-button(type="button" @click="showDeleteModal = true" :disabled="deleteLoading" v-if="isEditMode")
                            i.fas.fa-trash
                            span Eliminar plan
                            span.loading-indicator(v-if="deleteLoading") ...
                        Teleport(to="body")
                            .modal-mask(v-if="showDeleteModal")
                                .modal-wrapper
                                    .modal-container
                                        h3 ¿Eliminar plan?
                                        p ¿Estás seguro de que deseas eliminar este plan? Esta acción no se puede deshacer.
                                        .modal-actions
                                            button.confirm-button(@click="confirmDelete" :disabled="deleteLoading") Sí, eliminar
                                            button.cancel-button(@click="showDeleteModal = false") Cancelar
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, defineProps, defineEmits } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlanFiltersMenu from './PlanFiltersMenu.vue'
import axios from 'axios'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import MapSelector from './MapSelector.vue'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import 'flatpickr/dist/l10n/es.js'

// Definir props para el componente
const props = defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    },
    showHeader: {
        type: Boolean,
        default: true
    },
    showFilters: {
        type: Boolean,
        default: true
    },
    planId: {
        type: String,
        default: ''
    }
})

// Definir eventos
const emit = defineEmits(['plan-created', 'plan-updated', 'plan-deleted', 'cancel'])

const route = useRoute()
const router = useRouter()
const { checkUser, tokenStore } = useRegisterStore()
const { hasDni } = storeToRefs(useRegisterStore())

// Configuración de FlatPickr para fecha y hora
const dateTimeConfig = {
    dateFormat: 'd-m-Y H:i', // Formato de fecha y hora
    enableTime: true, // Habilitar selección de hora
    time_24hr: true, // Formato 24 horas
    locale: 'es', // Idioma español
    disableMobile: true, // Evitar calendario nativo en móviles
    allowInput: true, // Permitir entrada manual
    minDate: 'today', // Mínimo día actual
    minuteIncrement: 5, // Incremento de minutos
    disable: [
        function (date: Date) {
            // Deshabilita cualquier fecha anterior a hoy
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
        }
    ]
}

// Estado del formulario - Inicializado con valores correctos
const planData = ref({
    title: '',
    category: '',
    description: '',
    route: {
        location: {
            origin: '',
            destination: ''
        },
        duration: '',
        distance: ''
    },
    dateTime: '',
    placesAvailable: undefined as number | undefined,
    price: undefined as number | undefined,
    carInformation: {
        carIdentifier: '',
        brand: '',
        model: '',
        color: ''
    },
    passengers: [] as any[]
})

// Para almacenar los datos originales en modo edición (inicializado igual que planData)
const originalPlanData = ref({ ...planData.value })
const message = ref('')
const loading = ref(false)
const deleteLoading = ref(false)

// Obtener el ID del plan en modo edición
const getPlanId = computed(() => {
    return props.planId || (route.params.id as string)
})

// Cargar los datos del plan si estamos en modo edición
const loadPlanData = async () => {
    if (!props.isEditMode) return

    try {
        loading.value = true
        await checkUser()

        if (!tokenStore) {
            console.error('No hay token de usuario disponible')
            router.push('/login')
            return
        }

        const planId = getPlanId.value
        console.log('Cargando plan con ID:', planId)

        // URL corregida aquí: getPlanById en lugar de solo /{id}
        const response = await axios.get(`http://localhost:8000/plan/getPlanById/${planId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        })

        console.log('Datos del plan recibidos:', response.data)

        // Verificamos si los datos vienen como plan o directamente
        const planDataResponse = response.data.plan

        // Formatear la fecha para flatpickr
        let formattedDate = ''
        if (planDataResponse.dateTime) {
            const planDate = new Date(planDataResponse.dateTime)
            const day = String(planDate.getDate()).padStart(2, '0')
            const month = String(planDate.getMonth() + 1).padStart(2, '0')
            const year = planDate.getFullYear()
            const hours = String(planDate.getHours()).padStart(2, '0')
            const minutes = String(planDate.getMinutes()).padStart(2, '0')
            formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`
        }

        // Asignar los datos al formulario
        planData.value = {
            title: planDataResponse.title || '',
            category: planDataResponse.category || '',
            description: planDataResponse.description || '',
            route: {
                location: {
                    origin: planDataResponse.route?.location?.origin || '',
                    destination: planDataResponse.route?.location?.destination || ''
                },
                duration: planDataResponse.route?.duration || '',
                distance: planDataResponse.route?.distance || ''
            },
            dateTime: formattedDate,
            placesAvailable: Number(planDataResponse.placesAvailable) || undefined,
            price: Number(planDataResponse.price) || undefined,
            carInformation: {
                carIdentifier: planDataResponse.carInformation?.carIdentifier || '',
                brand: planDataResponse.carInformation?.brand || '',
                model: planDataResponse.carInformation?.model || '',
                color: planDataResponse.carInformation?.color || ''
            },
            passengers: planDataResponse.passengers || []
        }

        // Guardar una copia de los datos originales
        originalPlanData.value = JSON.parse(JSON.stringify(planData.value))

    } catch (err) {
        console.error('Error al cargar el plan:', err)
        message.value = 'Error al cargar los datos del plan'
    } finally {
        loading.value = false
    }
}

// Manejar la ruta seleccionada desde el componente de mapa
const handleRoute = (routeData: { origin: string, destination: string, duration: string, distance: string }) => {
    planData.value.route.location.origin = routeData.origin
    planData.value.route.location.destination = routeData.destination
    planData.value.route.duration = routeData.duration
    planData.value.route.distance = routeData.distance
    console.log('Ruta seleccionada:', routeData)
}

// Validar el formulario
const validateForm = () => {
    if (!planData.value.title || !planData.value.category || !planData.value.description ||
        !planData.value.route.location.origin || !planData.value.route.location.destination ||
        !planData.value.dateTime ||
        planData.value.placesAvailable === undefined || planData.value.placesAvailable <= 0 ||
        planData.value.price === undefined || planData.value.price <= 0 ||
        !planData.value.carInformation.carIdentifier || !planData.value.carInformation.brand ||
        !planData.value.carInformation.model || !planData.value.carInformation.color) {
        throw new Error('Por favor, complete todos los campos requeridos.')
    }
    return true
}

// Parsear fecha de FlatPickr antes de enviar
const parseDateForSubmit = () => {
    if (!planData.value.dateTime) return ''

    // Convertir formato "dd-mm-yyyy HH:MM" a objeto Date para el backend
    const parts = planData.value.dateTime.split(' ')
    if (parts.length !== 2) return planData.value.dateTime

    const dateParts = parts[0].split('-')
    const timeParts = parts[1].split(':')

    if (dateParts.length !== 3 || timeParts.length !== 2) return planData.value.dateTime

    const day = parseInt(dateParts[0])
    const month = parseInt(dateParts[1]) - 1 // Los meses en JS son 0-11
    const year = parseInt(dateParts[2])
    const hour = parseInt(timeParts[0])
    const minute = parseInt(timeParts[1])

    const dateObj = new Date(year, month, day, hour, minute)
    return dateObj.toISOString()
}

// Eliminar el plan
const deletePlan = async () => {
    try {
        deleteLoading.value = true
        await checkUser()

        if (!tokenStore) {
            console.error('No hay token de usuario disponible')
            message.value = 'Necesitas estar autenticado para realizar esta acción'
            return
        }

        const planId = getPlanId.value

        // Llamar a la API para eliminar el plan
        await axios.delete(`http://localhost:8000/plan/delete/${planId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        })

        // Emitir evento de eliminación exitosa
        emit('plan-deleted', planData.value.title)

    } catch (err) {
        console.error('Error al eliminar el plan:', err)
        message.value = 'Error al eliminar el plan. Inténtalo de nuevo.'
    } finally {
        deleteLoading.value = false
    }
}

// Enviar el formulario (crear o actualizar)
const submitForm = async () => {
    try {
        await checkUser()
        if (!tokenStore) {
            console.error('No hay token de usuario disponible')
            message.value = 'Necesitas estar autenticado para realizar esta acción'
            return
        }

        // En modo edición no verificamos el DNI ya que el usuario ya pudo crear el plan
        if (!props.isEditMode && !hasDni.value) {
            console.error('Falta DNI verificado')
            message.value = 'Necesitas tener un DNI verificado para crear planes'
            return
        }

        // Validar el formulario
        validateForm()

        loading.value = true

        // Crear copia de los datos para enviar
        const dataToSubmit = JSON.parse(JSON.stringify(planData.value))
        // Convertir la fecha al formato adecuado
        dataToSubmit.dateTime = parseDateForSubmit()

        if (props.isEditMode) {
            // Actualizar plan existente
            await axios.put(`http://localhost:8000/plan/update/${getPlanId.value}`, dataToSubmit, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenStore}`
                }
            })
            message.value = 'Plan actualizado con éxito.'
            emit('plan-updated', planData.value.title)
        } else {
            // Crear nuevo plan
            await axios.post('http://localhost:8000/plan/create', dataToSubmit, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenStore}`
                }
            })
            message.value = 'Plan creado con éxito.'
            emit('plan-created', planData.value.title)
            console.log(planData.value.title);

            // Reset del formulario en modo creación
            planData.value = {
                title: '',
                category: '',
                description: '',
                route: {
                    location: {
                        origin: '',
                        destination: ''
                    },
                    duration: '',
                    distance: ''
                },
                dateTime: '',
                placesAvailable: undefined,
                price: undefined,
                carInformation: {
                    carIdentifier: '',
                    brand: '',
                    model: '',
                    color: ''
                },
                passengers: []
            }
        }

    } catch (err) {
        console.error('Error al procesar el plan:', err)
        if (err instanceof Error) {
            message.value = err.message || 'Error al procesar el plan'
        } else {
            message.value = 'Error al procesar el plan'
        }
    } finally {
        loading.value = false
    }
}

// Cancelar edición
const cancelForm = () => {
    if (props.isEditMode) {
        // Preguntar antes de cancelar si hay cambios
        const hasChanges = JSON.stringify(planData.value) !== JSON.stringify(originalPlanData.value)

        if (hasChanges) {
            if (confirm('¿Estás seguro de que deseas cancelar? Se perderán todos los cambios no guardados.')) {
                emit('cancel')
                router.push('/dashboard')
            }
        } else {
            emit('cancel')
            router.push('/dashboard')
        }
    }
}

const showDeleteModal = ref(false)

const confirmDelete = async () => {
    showDeleteModal.value = false
    await deletePlan()
}

// Cargar datos al montar el componente
onMounted(async () => {
    await checkUser()
    if (props.isEditMode) {
        await loadPlanData()
    }
})

// Observar cambios en el planId para recargar los datos si cambia
watch(() => props.planId, async (newId, oldId) => {
    if (newId && newId !== oldId && props.isEditMode) {
        await loadPlanData()
    }
})
</script>

<style scoped lang="scss">
/* Animaciones */
@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

/* Variables globales */
$primary-color: #4CAF50;
$primary-dark: #43a047;
$background-dark: rgba(1, 43, 0, 0.9);
$background-input: rgba(0, 0, 0, 0.3);
$border-color: rgba(255, 255, 255, 0.3);
$text-color: #ffffff;
$highlight-color: rgba(76, 175, 80, 0.2);

/* Estilos del contenedor principal */
.plan-form-container {
  width: 100%;
}

/* Estilos para el encabezado */
.plan-header {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: $primary-color;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  i {
    color: $primary-color;
  }
}

/* Container para creación de plan */
.plan-creation-container {
  padding: 2rem;
  color: #10e78a;
}

/* Estilos para el formulario principal */
.formPlan {
  max-width: 900px;
  margin: 0 auto;

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: $text-color;
      font-size: 1.1rem;
    }

    #plan-category {
      background-color: #022901;
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: 0.8rem 1rem;
      background-color: $background-input;
      border: 1px solid $border-color;
      border-radius: 8px;
      color: #e0f0e9;
      transition: all 0.3s ease;
      font-weight: bold;

      &:focus {
        outline: none;
        border-color: $text-color;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
      }

      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    textarea {
      resize: vertical;
      min-height: 120px;
    }
  }

  .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;

    .form-group.half {
      flex: 1;
      min-width: 200px;
    }
  }

  /* Sección de mapa */
  .map-section {
    margin-bottom: 2rem;

    .map-label {
      margin-bottom: 1rem;
    }

    .map-wrapper {
      border-radius: 12px;
      padding: 1rem;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.575);
    }

    .route-info {
      margin-top: 1rem;
      background-color: $background-input;
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid #ffffffa9;

      .route-detail {
        display: flex;
        align-items: center;
        margin-bottom: 0.7rem;

        i {
          color: $primary-dark;
          margin-right: 0.5rem;
          width: 20px;
          text-align: center;
        }

        span {
          font-weight: 700;
          color: white;
        }
      }

      .route-stats {
        display: flex;
        margin-top: 1rem;
        gap: 1.5rem;

        .route-stat {
          display: flex;
          align-items: center;
          background-color: rgba(77, 255, 77, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: white;

          i {
            color: $primary-dark;
            margin-right: 0.5rem;
          }
        }
      }
    }
  }

  /* Sección del auto */
  .car-section {
    background-color: $background-input;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.582);

    h3 {
      display: flex;
      align-items: center;
      color: $primary-dark;
      margin-bottom: 1.5rem;
      font-size: 1.3rem;

      i {
        margin-right: 0.7rem;
      }
    }

    .car-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;

      .car-info-item {
        label {
          font-size: 0.95rem;
        }

        input {
          background-color: $background-input;
        }
      }
    }
  }

  /* Contenedor de input de precio */
  .price-input-container {
    position: relative;

    input {
      padding-right: 2.5rem;
    }

    .price-currency {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: $text-color;
      font-weight: 600;
    }
  }

  /* Sección de información de pasajeros */
  .section-box.passengers-info {
    background-color: $background-input;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid $border-color;
    margin-bottom: 1.5rem;

    h3 {
      display: flex;
      align-items: center;
      color: $primary-dark;
      margin-bottom: 1rem;
      font-size: 1.3rem;

      i {
        margin-right: 0.7rem;
        color: $text-color;
      }
    }

    .passenger-list {
      list-style: none;
      padding: 0;
      margin: 0;

      .passenger-item {
        background-color: $background-input;
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;

        i {
          margin-right: 0.75rem;
          color: $primary-dark;
        }

        span {
          color: $text-color;
        }
      }
    }
  }

  /* Acciones del formulario */
  .form-actions {
    margin-top: 2.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;

    .message-container {
      display: flex;
      align-items: center;
      padding: 0.8rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      width: 100%;
      max-width: 500px;

      &.success {
        background-color: rgba(76, 175, 80, 0.2);
        border-left: 4px solid #ffffff9c;
      }

      &.error {
        background-color: rgba(244, 67, 54, 0.2);
        border-left: 4px solid #F44336;
      }

      i {
        font-size: 1.3rem;
        margin-right: 0.8rem;
      }

      p {
        margin: 0;
        font-weight: 500;
      }
    }

    .button-group {
      display: flex;
      gap: 1rem;
    }

    .delete-button,
    .submit-button,
    .cancel-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 2rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;

      i {
        margin-right: 0.5rem;
      }

      &:active {
        transform: translateY(1px);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .loading-indicator {
      margin-left: 0.5rem;
      animation: pulse 1.5s infinite;
    }

    .submit-button {
      background-color: $primary-color;
      color: white;
      box-shadow: 0 4px 15px rgba(0, 179, 0, 0.3);

      &:hover:not(:disabled) {
        background-color: $primary-dark;
        box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
      }
    }

    .cancel-button {
      background-color: $text-color;
      color: grey;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

      &:hover {
        background-color: #dddddd;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
      }
    }

    .delete-button {
      background-color: #e74c3c;
      color: white;
      box-shadow: 0 4px 15px rgba(179, 0, 0, 0.3);

      &:hover:not(:disabled) {
        background-color: #c0392b;
        box-shadow: 0 6px 15px rgba(175, 76, 76, 0.4);
      }
    }
  }
}

/* Estilos para modales */
.modal-mask {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;

  .modal-wrapper {
    background: #002e00e0;
    border-radius: 8px;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }
}

.modal-container {
  h3 {
    color: #fff;
    margin-bottom: 1rem;
  }

  p {
    color: #ccc;
    margin-bottom: 1.5rem;
  }

  .modal-actions {
    display: flex;
    justify-content: space-around;
    gap: 1rem;
  }
}

.confirm-button,
.cancel-button {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.confirm-button {
  background-color: #d32f2f;
  color: white;
}

.cancel-button {
  background-color: $text-color;
  color: rgb(94, 93, 93);
}

/* Estilos específicos para flatpickr */
:deep(.flatpickr-input) {
  color: white;
  background-color: $background-dark;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid white;
  width: 100%;
  font-family: inherit;
  font-size: 1rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
}

/* Estilos para el calendario flatpickr */
:deep(.flatpickr-calendar) {
  background-color: $background-dark;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  border: 1px solid $border-color;
  border-radius: 8px;
  
  .flatpickr-month, 
  .flatpickr-weekdays {
    background-color: $background-dark;
    color: white;
  }
  
  .flatpickr-day {
    color: white;
    
    &.selected, 
    &.startRange, 
    &.endRange {
      background: $primary-color;
      border-color: $primary-color;
      
      &:hover {
        background: $primary-dark;
        border-color: $primary-dark;
      }
    }
    
    &:hover {
      background: $highlight-color;
      border-color: transparent;
    }
    
    &.today {
      border-color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: white;
      }
    }
  }
  
  .flatpickr-weekday {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .flatpickr-current-month {
    color: white;
    
    .flatpickr-monthDropdown-months {
      background-color: $background-dark;
      color: white;
      
      &:hover {
        background-color: rgba(1, 43, 0, 0.8);
      }
    }
    
    .numInputWrapper {
      input {
        color: white;
        
        &:focus {
          border-color: $primary-color;
        }
      }
      
      span {
        border-color: $border-color;
        
        &:after {
          border-top-color: white;
        }
        
        &.arrowUp:after {
          border-bottom-color: white;
        }
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
  
  .flatpickr-prev-month, 
  .flatpickr-next-month {
    color: white !important;
    fill: white !important;
    
    &:hover svg {
      fill: $primary-color !important;
    }
  }
}

/* Estilos mejorados para la sección de tiempo */
:deep(.flatpickr-calendar.hasTime) {
  width: 320px !important;

  .flatpickr-time {
    background-color: $background-dark !important;
    border-top: 1px solid $border-color !important;
    height: 50px !important;
    line-height: 50px !important;
    
    input.flatpickr-hour, 
    input.flatpickr-minute, 
    input.flatpickr-second {
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      color: white !important;
      background-color: transparent !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
      height: auto !important;
      
      &:focus {
        border-color: $primary-color !important;
        box-shadow: 0 0 5px rgba(76, 175, 80, 0.5) !important;
      }
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
    }

    .numInputWrapper {
      height: 50px !important;
      width: calc(33.3% - 15px) !important;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.05) !important;
      }
      
      span {
        border-color: $border-color !important;
        opacity: 1 !important;
        width: 24px !important;
        height: 24px !important;
        
        &:hover {
          background: rgba(255, 255, 255, 0.2) !important;
        }
        
        &.arrowUp {
          &:after {
            border-bottom-color: $primary-color !important;
            border-width: 5px !important;
          }
          
          &:hover:after {
            border-bottom-color: white !important;
          }
        }
        
        &.arrowDown {
          &:after {
            border-top-color: $primary-color !important;
            border-width: 5px !important;
          }
          
          &:hover:after {
            border-top-color: white !important;
          }
        }
      }
    }

    .flatpickr-time-separator {
      color: $primary-color !important;
      font-weight: bold !important;
      width: 15px !important;
      font-size: 1.5rem !important;
      line-height: 50px !important;
      opacity: 1 !important;
    }

    .flatpickr-am-pm {
      color: white !important;
      background-color: transparent !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      width: 60px !important;
      height: 50px !important;
      line-height: 50px !important;
      border-radius: 5px !important;
      
      &:hover {
        background: $highlight-color !important;
      }
      
      &.selected {
        background-color: rgba(76, 175, 80, 0.4) !important;
      }
    }
  }
}

/* Media queries para responsividad */
@media (max-width: 768px) {
  .plan-creation-container {
    padding: 1.5rem 1rem;
  }
  
  .plan-header {
    font-size: 2rem;
  }
  
  .form-row {
    flex-direction: column;
    
    .form-group.half {
      width: 100%;
    }
  }
  
  :deep(.flatpickr-input) {
    width: 100%;
    min-width: 100%;
  }
  
  .formPlan {
    .route-stats {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .form-actions .button-group {
      flex-direction: column;
      width: 100%;
      max-width: 300px;
      gap: 0.75rem;
    }
  }
}
</style>