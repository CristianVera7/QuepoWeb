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