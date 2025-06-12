<template lang="pug">
    .plan-form-container
        //- Menú de filtros que se muestra solo si showFilters está habilitado
        PlanFiltersMenu(:hasDni="hasDni")
        .plan-creation-container
            //- Formulario principal para crear/editar planes
            form.formPlan(@submit.prevent="submitForm")
                //- Campo de título del plan
                .form-group
                    label(for="plan-title") Título
                    input#plan-title(type="text" placeholder="Título de tu aventura" v-model="planData.title" required maxlength="39")
                
                //- Selector de categoría del plan
                .form-group
                    label(for="plan-category") Categoría
                    select#plan-category(v-model="planData.category" required)
                        option(disabled value="") Selecciona una categoría
                        option(value="Pesca") Pesca
                        option(value="Senderismo") Senderismo
                        option(value="Escalada") Escalada

                //- Área de texto para la descripción
                .form-group
                    label(for="plan-description") Descripción
                    textarea#plan-description(placeholder="Describe tu plan de aventura" v-model="planData.description" required)
                
                //- Sección del mapa interactivo para seleccionar la ruta
                .form-group.map-section
                    label.map-label Selecciona la ruta
                    .map-wrapper
                        //- Componente de mapa que emite evento cuando se confirma una ruta
                        MapSelector(
                            @route-confirmed="handleRoute" 
                            :initialOrigin="planData.route.location.origin"
                            :initialDestination="planData.route.location.destination"
                        )
                    //- Información de la ruta seleccionada (solo se muestra si hay origen y destino)
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
                
                //- Fila con campos de fecha, plazas y precio
                .form-row
                    //- Selector de fecha y hora usando FlatPickr
                    .form-group.half
                        label(for="plan-date") Fecha y hora
                        flat-pickr#plan-date(
                            v-model="planData.dateTime"
                            :config="dateTimeConfig"
                            placeholder="Selecciona fecha y hora"
                            required
                        )
                    
                    //- Campo numérico para plazas disponibles
                    .form-group.half
                        label(for="plan-places") Plazas disponibles
                        input#plan-places(type="number" placeholder="Número de plazas" v-model="planData.placesAvailable" required)
                    
                    //- Campo de precio con símbolo de euro
                    .form-group.half
                        label(for="plan-price") Precio por plaza
                        .price-input-container
                            input#plan-price(type="number" min="1" placeholder="Precio" v-model="planData.price" required)
                            span.price-currency €

                //- Sección de información del vehículo
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

                //- Sección de pasajeros (solo visible en modo edición y si hay pasajeros)
                .section-box.passengers-info(v-if="isEditMode && planData.passengers && planData.passengers.length > 0")
                    h3
                        i.fas.fa-users
                        span Pasajeros ({{ planData.passengers.length || 0 }})
                    ul.passenger-list
                        li.passenger-item(v-for="passenger in planData.passengers" :key="passenger._id") 
                            i.fas.fa-user
                            span {{ passenger.nickName }}

                //- Sección de acciones del formulario
                .form-actions
                    //- Contenedor de mensajes (éxito/error) con iconos dinámicos
                    .message-container(v-if="message" :class="{ 'success': message.includes('éxito'), 'error': message.includes('Error') || message.includes('campos') }")
                        i.fas(:class="message.includes('éxito') ? 'fa-check-circle' : 'fa-exclamation-circle'")
                        p {{ message }}
                    
                    //- Grupo de botones de acción
                    .button-group
                        //- Botón de cancelar (solo en modo edición)
                        button.cancel-button(type="button" @click="cancelForm" v-if="isEditMode")
                            i.fas.fa-times
                            span Cancelar
                        
                        //- Botón principal de envío (crear/actualizar)
                        button.submit-button(type="submit" :disabled="loading")
                            i.fas(:class="isEditMode ? 'fa-save' : 'fa-paper-plane'")
                            span {{ isEditMode ? 'Guardar cambios' : 'Crear plan' }}
                            span.loading-indicator(v-if="loading") ...
                        
                        //- Botón de eliminar (solo en modo edición)
                        button.delete-button(type="button" @click="showDeleteModal = true" :disabled="deleteLoading" v-if="isEditMode")
                            i.fas.fa-trash
                            span Eliminar plan
                            span.loading-indicator(v-if="deleteLoading") ...
                        
                        //- Modal de confirmación para eliminación (teleportado al body)
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

// CONFIGURACIÓN DE PROPS Y EVENTOS
// Props que definen el comportamiento del componente
const props = defineProps({
    isEditMode: {           // Determina si estamos editando o creando
        type: Boolean,
        default: false
    },
    showHeader: {           // Controla la visibilidad del header
        type: Boolean,
        default: true
    },
    showFilters: {          // Controla la visibilidad de los filtros
        type: Boolean,
        default: true
    },
    planId: {               // ID del plan para modo edición
        type: String,
        default: ''
    }
})

// Eventos que emite el componente para comunicarse con el padre
const emit = defineEmits(['plan-created', 'plan-updated', 'plan-deleted', 'cancel'])

// INICIALIZACIÓN DE DEPENDENCIAS
const route = useRoute()
const router = useRouter()
const { checkUser, tokenStore } = useRegisterStore()
const { hasDni } = storeToRefs(useRegisterStore())

// CONFIGURACIÓN DEL SELECTOR DE FECHA
// Configuración completa para FlatPickr con validaciones y formato español
const dateTimeConfig = {
    dateFormat: 'd-m-Y H:i',    // Formato visual de fecha
    enableTime: true,            // Habilitar selección de hora
    time_24hr: true,            // Formato 24 horas
    locale: 'es',               // Idioma español
    disableMobile: true,        // Evitar calendario nativo en móviles
    allowInput: true,           // Permitir entrada manual
    minDate: 'today',           // Mínimo día actual
    minuteIncrement: 5,         // Incremento de minutos
    disable: [
        function (date: Date) {
            // Función que deshabilita fechas anteriores a hoy
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
        }
    ]
}

// ESTADO DEL FORMULARIO
// Estructura principal de datos del plan con valores iniciales
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

// ESTADO DE CONTROL
const originalPlanData = ref({ ...planData.value })  // Copia de datos originales para detectar cambios
const message = ref('')                              // Mensajes de feedback al usuario
const loading = ref(false)                           // Estado de carga del formulario
const deleteLoading = ref(false)                     // Estado de carga específico para eliminación
const showDeleteModal = ref(false)                   // Control del modal de confirmación

// COMPUTED PROPERTIES
// Obtiene el ID del plan desde props o parámetros de ruta
const getPlanId = computed(() => {
    return props.planId || (route.params.id as string)
})

// FUNCIONES DE CARGA DE DATOS
// Carga los datos del plan existente cuando estamos en modo edición
const loadPlanData = async () => {
    if (!props.isEditMode) return

    try {
        loading.value = true
        await checkUser()

        // Verificar autenticación
        if (!tokenStore) {
            console.error('No hay token de usuario disponible')
            router.push('/login')
            return
        }

        const planId = getPlanId.value
        console.log('Cargando plan con ID:', planId)

        // Llamada a la API para obtener los datos del plan
        const response = await axios.get(`http://localhost:8000/plan/getPlanById/${planId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        })

        console.log('Datos del plan recibidos:', response.data)
        const planDataResponse = response.data.plan

        // Formatear la fecha para que sea compatible con FlatPickr
        // Formatear la fecha para que sea compatible con FlatPickr en hora local
        let formattedDate = ''
        if (planDataResponse.dateTime) {
            const planDate = new Date(planDataResponse.dateTime)

            const [datePart, timePart] = planDate.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).split(', ')

            formattedDate = `${datePart} ${timePart}`
        }


        // Mapear los datos recibidos al formulario
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

        // Guardar copia de los datos originales para detectar cambios
        originalPlanData.value = JSON.parse(JSON.stringify(planData.value))

    } catch (err) {
        console.error('Error al cargar el plan:', err)
        message.value = 'Error al cargar los datos del plan'
    } finally {
        loading.value = false
    }
}

// MANEJADORES DE EVENTOS
// Maneja la ruta seleccionada desde el componente MapSelector
const handleRoute = (routeData: { origin: string, destination: string, duration: string, distance: string }) => {
    planData.value.route.location.origin = routeData.origin
    planData.value.route.location.destination = routeData.destination
    planData.value.route.duration = routeData.duration
    planData.value.route.distance = routeData.distance
    console.log('Ruta seleccionada:', routeData)
}

// FUNCIONES DE VALIDACIÓN
// Valida que todos los campos requeridos estén completos
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

// FUNCIONES DE FORMATO DE DATOS
// Convierte la fecha de FlatPickr al formato ISO para el backend
const parseDateForSubmit = () => {
    if (!planData.value.dateTime) return ''

    // Parsear formato "dd-mm-yyyy HH:MM" a objeto Date
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

// FUNCIONES DE CRUD
// Elimina el plan actual (solo disponible en modo edición)
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

        // Llamada a la API para eliminar el plan
        await axios.delete(`http://localhost:8000/plan/delete/${planId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        })

        // Emitir evento de eliminación exitosa al componente padre
        emit('plan-deleted', planData.value.title)

    } catch (err) {
        console.error('Error al eliminar el plan:', err)
        message.value = 'Error al eliminar el plan. Inténtalo de nuevo.'
    } finally {
        deleteLoading.value = false
    }
}

// Función principal para crear o actualizar un plan
const submitForm = async () => {
    try {
        await checkUser()
        if (!tokenStore) {
            console.error('No hay token de usuario disponible')
            message.value = 'Necesitas estar autenticado para realizar esta acción'
            return
        }

        // Verificar DNI solo para creación de nuevos planes
        if (!props.isEditMode && !hasDni.value) {
            console.error('Falta DNI verificado')
            message.value = 'Necesitas tener un DNI verificado para crear planes'
            return
        }

        // Validar todos los campos del formulario
        validateForm()

        loading.value = true

        // Preparar datos para envío con fecha formateada
        const dataToSubmit = JSON.parse(JSON.stringify(planData.value))
        dataToSubmit.dateTime = parseDateForSubmit()

        if (props.isEditMode) {
            // FLUJO DE ACTUALIZACIÓN
            await axios.put(`http://localhost:8000/plan/update/${getPlanId.value}`, dataToSubmit, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenStore}`
                }
            })
            message.value = 'Plan actualizado con éxito.'
            emit('plan-updated', planData.value.title)
        } else {
            // FLUJO DE CREACIÓN
            await axios.post('http://localhost:8000/plan/create', dataToSubmit, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenStore}`
                }
            })
            message.value = 'Plan creado con éxito.'
            emit('plan-created', planData.value.title)
            console.log(dataToSubmit);

            // Resetear formulario después de creación exitosa
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

// FUNCIONES DE NAVEGACIÓN Y CONTROL
// Maneja la cancelación de la edición con confirmación si hay cambios
const cancelForm = () => {
    if (props.isEditMode) {
        // Detectar si hay cambios no guardados
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

// Confirma la eliminación cerrando el modal y ejecutando la eliminación
const confirmDelete = async () => {
    showDeleteModal.value = false
    await deletePlan()
}

// HOOKS DE CICLO DE VIDA
// Se ejecuta al montar el componente
onMounted(async () => {
    await checkUser()
    if (props.isEditMode) {
        await loadPlanData()
    }
})

// WATCHERS
// Observa cambios en el planId para recargar datos si cambia
watch(() => props.planId, async (newId, oldId) => {
    if (newId && newId !== oldId && props.isEditMode) {
        await loadPlanData()
    }
})
</script>