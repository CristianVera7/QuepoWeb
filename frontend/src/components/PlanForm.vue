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
                    .map-container
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
                        input#plan-date(type="datetime-local" v-model="planData.dateTime" required)
                    
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, defineProps, defineEmits } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlanFiltersMenu from './PlanFiltersMenu.vue'
import axios from 'axios'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import MapSelector from './MapSelector.vue'

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
const emit = defineEmits(['plan-created', 'plan-updated', 'cancel'])

const route = useRoute()
const router = useRouter()
const { checkUser, tokenStore } = useRegisterStore()
const { hasDni } = storeToRefs(useRegisterStore())

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
    }
})

// Para almacenar los datos originales en modo edición (inicializado igual que planData)
const originalPlanData = ref({ ...planData.value })
const message = ref('')
const loading = ref(false)

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
                Authorization: `Bearer ${tokenStore}`
            }
        })

        console.log('Datos del plan recibidos:', response.data)

        // Verificamos si los datos vienen como plan o directamente
        const planDataResponse = response.data.plan

        // Formatear la fecha para el input datetime-local
        let formattedDate = ''
        if (planDataResponse.dateTime) {
            const planDate = new Date(planDataResponse.dateTime)
            formattedDate = planDate.toISOString().slice(0, 16) // formato YYYY-MM-DDThh:mm
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
            }
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

        if (props.isEditMode) {
            // Actualizar plan existente
            console.log(props.planId, planData.value)
            await axios.put(`http://localhost:8000/plan/update/${props.planId}`, planData.value, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenStore}`
                }
            })
            message.value = 'Plan actualizado con éxito.'
            emit('plan-updated', planData.value.title)
        } else {
            // Crear nuevo plan
            await axios.post('http://localhost:8000/plan/create', planData.value, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenStore}`
                }
            })
            message.value = 'Plan creado con éxito.'
            emit('plan-created', planData.value.title)

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
                }
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

<style lang="scss" scoped>
.plan-form-container {
    width: 100%;
}

.plan-header {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: #4CAF50;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    i {
        color: #4CAF50;
    }
}

.plan-creation-container {
    padding: 2rem;
    color: #10e78a;
}

.formPlan {
    max-width: 900px;
    margin: 0 auto;

    .form-group {
        margin-bottom: 1.5rem;


        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #ffffff;
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
            background-color: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: #e0f0e9;
            transition: all 0.3s ease;
            font-weight: bold;


            &:focus {
                outline: none;
                border-color: #ffffff;
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

    .map-section {
        margin-bottom: 2rem;

        .map-label {
            margin-bottom: 1rem;
        }

        .map-container {
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.575);
        }

        .route-info {
            margin-top: 1rem;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 1rem;
            border-left: 4px solid #ffffffa9;

            .route-detail {
                display: flex;
                align-items: center;
                margin-bottom: 0.7rem;

                i {
                    color: #ffffff;
                    margin-right: 0.5rem;
                    width: 20px;
                    text-align: center;
                }

                span {
                    font-weight: 500;
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

                    i {
                        color: #ffffff;
                        margin-right: 0.5rem;
                    }
                }
            }
        }
    }

    .car-section {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.582);

        h3 {
            display: flex;
            align-items: center;
            color: #43a047;
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
                    background-color: rgba(0, 0, 0, 0.3);
                }
            }
        }
    }

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
            color: #ffffff;
            font-weight: 600;
        }
    }

    .section-box.passengers-info {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.3);
        margin-bottom: 1.5rem;

        h3 {
            display: flex;
            align-items: center;
            color: #43a047;
            margin-bottom: 1rem;
            font-size: 1.3rem;

            i {
                margin-right: 0.7rem;
                color: #ffffff;
            }
        }

        .passenger-list {
            list-style: none;
            padding: 0;
            margin: 0;

            .passenger-item {
                background-color: rgba(0, 0, 0, 0.3);
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;

                i {
                    margin-right: 0.75rem;
                    color: #43a047;
                }

                span {
                    color: #ffffff;
                }
            }
        }
    }

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
            background-color: #4CAF50;
            color: white;
            box-shadow: 0 4px 15px rgba(0, 179, 0, 0.3);

            &:hover:not(:disabled) {
                background-color: #43a047;
                box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
            }
        }

        .cancel-button {
            background-color: #757575;
            color: white;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

            &:hover {
                background-color: #616161;
                box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
            }
        }
    }
}

@keyframes pulse {
    0% {
        opacity: 0.5;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.5;
    }
}

// Ajustes para pantallas pequeñas
@media (max-width: 768px) {
    .plan-creation-container {
        padding: 1.5rem 1rem;
    }

    .plan-header {
        font-size: 2rem;
    }

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
</style>