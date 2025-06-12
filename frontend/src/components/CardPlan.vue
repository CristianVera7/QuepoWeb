<template lang="pug">
    .wrapper
        .plan-card(:class="{ 'expanded': isExpanded, 'collapsed': !isExpanded }")
            // Contenedor principal de la card
            .card-container
                // Imagen de fondo con categoría del plan
                .plan-image
                    img.background-img(:src="defaultImage(plan.category)" :alt="plan.category")
                    .plan-image-overlay
                        .plan-category {{ plan.category }}
                        // Botón de cerrar cuando está expandida
                        button.close-button(v-if="isExpanded" @click.stop="toggleExpansion")
                            i.fas.fa-times
                
                .plan-content
                    // Vista compacta - siempre visible
                    .compact-view
                        .plan-header
                            .nature-divider
                            h4.plan-title
                                strong {{ plan.title }}
                            .nature-divider
                            p.plan-description {{ isExpanded ? plan.description : truncate(plan.description, 85) }}

                        .compact-info
                            .info-item-card
                                .wrapper-info-item
                                    i.fas.fa-user
                                    strong Organiza:  
                                .detail
                                    span  {{ plan.creatorNickName }}
                            .info-item-card
                                .wrapper-info-item
                                    i.fas.fa-calendar
                                    strong Fecha y hora:
                                .detail
                                    span {{ formatDate(plan.dateTime).replace(',', '') }}
                            .info-item-card
                                .wrapper-info-item
                                    i.fas.fa-euro-sign
                                    strong Precio:
                                .detail
                                    span {{ plan.price }}€
                            .info-item-card
                                .wrapper-info-item
                                    i.fas.fa-chair
                                    strong Plazas libres:
                                .detail
                                    span {{ plan.placesAvailable }}
                        .plan-footer(v-show="!isExpanded" )
                            .plan-footer__togle-section
                                .wrapper-divider
                                    .nature-divider
                                    .expanded-button(@click="toggleExpansion")
                                        p Ver más
                                    .nature-divider
                                .button-container
                                    // Advertencia si el usuario no tiene DNI registrado
                                    .dni-warning(v-if="!hasDni")
                                        .header-warning
                                            i.fas.fa-exclamation-triangle
                                            p Documento de identidad requerido
                                        .body-warning
                                            button(@click="editProfile")
                                                i.fas.fa-user-edit
                                                | Completa tu perfil

                                    // Botón "Unirse" - solo si hay plazas, no es creador, no es pasajero, no tiene solicitud pendiente y tiene DNI
                                    button.join-button(
                                        v-if="plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !hasPendingRequest && !showMessageBox && hasDni"
                                        @click="toggleMessageBox"
                                    ) 
                                        i.fas.fa-sign-in-alt
                                        | Unirse
                                    // Caja de mensaje para enviar solicitud de unión
                                    .message-box(v-if="showMessageBox")
                                        textarea.box(v-model="message" placeholder="Escribe un mensaje para el creador..." rows="3")
                                        button.send-button(@click="joinPlanEmit" :disabled="!message.trim()") 
                                            i.fas.fa-paper-plane
                                            | Enviar solicitud
                    
                                    // Estado "Solicitud pendiente" - cuando el usuario ya envió una solicitud
                                    .section-pending
                                        p.pending-button(
                                            v-if="hasPendingRequest"
                                            disabled
                                        )
                                            i.fas.fa-clock
                                            | Solicitud pendiente
                                        //boton cancelar solicitud pe
                                        button.cancel-request-button(v-if="hasPendingRequest" @click="cancelRequest")
                                            i.fas.fa-times
                                            | Cancelar
                        
                                    // Botón deshabilitado cuando no hay plazas disponibles
                                    button.no-places-button(v-if="!plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !hasPendingRequest && hasDni" disabled)
                                        i.fas.fa-ban
                                        | No hay plazas
                                        
                                    // Botón "Editar" - solo visible para el creador del plan
                                    button.edit-plan-button(v-if="plan.isCreator" @click="editPlan")
                                        i.fas.fa-edit
                                        | Editar
                                        
                                    // Botón "Salir del plan" - solo visible para pasajeros actuales
                                    button.leave-button(v-if="plan.isPassenger" @click="openLeaveModal")
                                        i.fas.fa-sign-out-alt
                                        | Salir del plan
                        
                    // Vista expandida - solo visible cuando isExpanded es true
                    .expanded-view( v-if="isExpanded")
                        
                        // Sección 1: Información básica del viaje
                        .section-box.expandable-section
                            .section-header(@click="toggleSection('journeyInfo')")
                                h4 
                                    i.fas.fa-map-marked-alt
                                    | Información del viaje
                                span.fas(:class="{'fa-chevron-down': !expandedSections.journeyInfo, 'fa-chevron-up': expandedSections.journeyInfo}")
                            .nature-divider
                            .section-content(v-show="expandedSections.journeyInfo" :class="{ expanded: expandedSections.journeyInfo }")
                                .plan-details
                                    .detail-item
                                        i.fas.fa-route
                                        p  
                                            strong Salida desde: 
                                            | {{ plan.route.location.origin }} 
                                    .detail-item
                                        i.fas.fa-map-pin
                                        p
                                            strong Destino:
                                            | {{ plan.route.location.destination }}
                                    .detail-item
                                        i.fas.fa-road
                                        p  
                                            strong Distancia: 
                                            | {{ plan.route.distance }}
                                    .detail-item
                                        i.fas.fa-clock
                                        p  
                                            strong Duración: 
                                            | {{ plan.route.duration }}
                                
                        // Sección 2: Información del vehículo
                        .section-box.expandable-section
                            .section-header(@click="toggleSection('carInfo')")
                                h4 
                                    i.fas.fa-car
                                    | Vehículo
                                span.fas(:class="{'fa-chevron-down': !expandedSections.carInfo, 'fa-chevron-up': expandedSections.carInfo}")
                            .nature-divider
                            .section-content(v-show="expandedSections.carInfo" :class="{ expanded: expandedSections.carInfo }")
                                .car-details
                                    span 
                                        strong Marca: 
                                        | {{ plan.carInformation.brand }}
                                    span 
                                        strong Modelo: 
                                        | {{ plan.carInformation.model }}
                                    span 
                                        strong Color: 
                                        | {{ plan.carInformation.color }}
                                    span(v-if="plan.carInformation.carIdentifier") 
                                        strong Matrícula: 
                                        | {{ plan.carInformation.carIdentifier }}
                        
                        // Sección 3: Lista de pasajeros actuales
                        .section-box.expandable-section
                            .section-header(@click="toggleSection('passengersInfo')")
                                h4 
                                    i.fas.fa-users
                                    | Pasajeros ({{ plan.passengers.length }})
                                span.fas(:class="{'fa-chevron-down': !expandedSections.passengersInfo, 'fa-chevron-up': expandedSections.passengersInfo}")
                            .nature-divider
                            .section-content(v-show="plan.passengers.length > 0 && expandedSections.passengersInfo" :class="{ expanded: expandedSections.passengersInfo }")
                                ul.passenger-list
                                    li(v-for="p in plan.passengers" :key="p._id") {{ p.nickName }}
                        
                        // Sección de acciones - solo visible cuando está expandida
                        .plan-actions
                            // Contador de plazas disponibles
                            p.places-available
                                i.fas.fa-chair
                                | Plazas disponibles: 
                                strong {{ plan.placesAvailable }}
                            
                            .button-container-expanded
                                // Advertencia si el usuario no tiene DNI registrado
                                .dni-warning-expanded(v-if="!hasDni")
                                    .header-warning-expanded
                                        i.fas.fa-exclamation-triangle
                                        p Documento de identidad requerido
                                    .body-warning-expanded
                                        // Botón que redirige a editar perfil
                                        button(@click="editProfile")
                                            i.fas.fa-user-edit
                                            | Completa tu perfil
                                // Botón "Unirse" - solo si hay plazas, no es creador, no es pasajero, no tiene solicitud pendiente y tiene DNI
                                button.join-button-expanded(
                                    v-if="plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !hasPendingRequest && !showMessageBox && hasDni"
                                    @click="toggleMessageBox"
                                ) 
                                    i.fas.fa-sign-in-alt
                                    | Unirse
                                
                                // Caja de mensaje para enviar solicitud de unión
                                .message-box-expanded(v-if="showMessageBox")
                                    textarea.box-expanded(v-model="message" placeholder="Escribe un mensaje para el creador..." rows="3")
                                    button.send-button-expanded(@click="joinPlanEmit" :disabled="!message.trim()") 
                                        i.fas.fa-paper-plane
                                        | Enviar solicitud
                                // Estado "Solicitud pendiente" - cuando el usuario ya envió una solicitud
                                .section-pending-expanded
                                    p.pending-button-expanded(
                                        v-if="hasPendingRequest"
                                        disabled
                                    )
                                        i.fas.fa-clock
                                        | Solicitud pendiente
                                    button.cancel-request-button-expanded(v-if="hasPendingRequest" @click="cancelRequest")
                                        i.fas.fa-times
                                        | Cancelar
                
                                // Botón "Salir del plan" - solo visible para pasajeros actuales
                                button.leave-button-expanded(v-if="plan.isPassenger" @click="openLeaveModal")
                                    i.fas.fa-sign-out-alt
                                    | Salir del plan
                                    
                                // Botón "Editar" - solo visible para el creador del plan
                                button.edit-plan-button-expanded(v-if="plan.isCreator" @click="editPlan")
                                    i.fas.fa-edit
                                    | Editar
                                    
                                // Botón deshabilitado cuando no hay plazas disponibles
                                button.no-places-button(v-if="!plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !hasPendingRequest && hasDni" disabled)
                                    i.fas.fa-ban
                                    | No hay plazas

        // Overlay de fondo cuando la card está expandida - usando Teleport
        Teleport(to="body")
            .card-overlay(v-if="isExpanded" @click.self="toggleExpansion")

        // Modal de confirmación para salir del plan - SIN TELEPORT
        Teleport(to="body")
            .modal-overlay-exit(v-if="showLeaveConfirmation" @click.self="closeLeaveModal")
                .modal-content-exit
                    .modal-body
                        h3 ¿Estás seguro de que deseas abandonar este plan?
                        h4.warning-text Tu plaza quedará disponible para otros usuarios.
                    .modal-footer
                        button.confirm-button(@click="confirmLeavePlan")
                            i.fas.fa-check
                            | Confirmar
                        button.cancel-button(@click="closeLeaveModal")
                            i.fas.fa-times
                            | Cancelar
</template>

<script setup lang="ts">
import { type IPlan } from '../types/plan'
import { ref, reactive, computed, watch, onUnmounted } from 'vue';
import fishing from '../img/plans/fishing.jpg'
import hiking from '../img/plans/hiking.png'
import climbing from '../img/plans/climbing.jpg'
import defaultImg from '../img/plans/defaultImg.jpg'
import router from '../router';
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'

// Props y tipos
interface Props {
    plan: IPlan,
    hasDni: boolean,
    pendingRequestPlans?: string[]
}

type ExpandableSectionKey = 'journeyInfo' | 'carInfo' | 'passengersInfo'

// Tipado de categorías válidas
type Categoria = 'pesca' | 'senderismo' | 'escalada'

// Función para validar categoría
const isCategoria = (value: string): value is Categoria => {
    return ['pesca', 'senderismo', 'escalada'].includes(value)
}

// Imágenes por categoría con tipado estricto
const images: Record<Categoria, string> = {
    pesca: fishing,
    senderismo: hiking,
    escalada: climbing
}

// Store y props
const { hasDni } = storeToRefs(useRegisterStore())
const props = defineProps<Props>()
const emit = defineEmits(['joinPlan', 'leavePlan', 'cancelRequest'])

// Estados reactivos principales
const isExpanded = ref(false)
const showMessageBox = ref(false)
const message = ref('')
const showLeaveConfirmation = ref(false)

// Función para truncar texto con puntos suspensivos
const truncate = (text: string, length: number) => {
    if (!text) return ''
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
}

//funcion para redirigir al usuario a editar su perfil si no tiene DNI
const editProfile = () => {
    router.push({ name: 'editProfile' })
}

// Control de secciones expandibles - inicializado con valores por defecto
const expandedSections = reactive({
    journeyInfo: true,
    carInfo: false,
    passengersInfo: false
})

// Computed para verificar solicitud pendiente
const hasPendingRequest = computed(() =>
    props.pendingRequestPlans?.includes(props.plan._id) ?? false
)

// Funciones principales
const toggleExpansion = () => isExpanded.value = !isExpanded.value

const toggleSection = (section: ExpandableSectionKey) => {
    expandedSections[section] = !expandedSections[section]
}

// Flujo de unirse al plan
const toggleMessageBox = () => showMessageBox.value = !showMessageBox.value

const joinPlanEmit = () => {
    emit('joinPlan', { planId: props.plan._id, message: message.value })
    message.value = ''
    showMessageBox.value = false
}

const cancelRequest = () => emit('cancelRequest', props.plan._id)

// Flujo de salir del plan
const openLeaveModal = () => showLeaveConfirmation.value = true
const closeLeaveModal = () => showLeaveConfirmation.value = false

const confirmLeavePlan = () => {
    emit('leavePlan', props.plan._id)
    closeLeaveModal()
}

// Utilidades
const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const defaultImage = (category: string) => {
    const key = category.toLowerCase()
    return isCategoria(key) ? images[key] : defaultImg
}

const editPlan = () => {
    if (props.plan?._id) {
        router.push({ name: 'editPlan', params: { id: props.plan._id } })
    }
}

// Watcher para manejar el scroll del body cuando se expande/colapsa
watch(isExpanded, (expanded) => {
    document.body.style.overflow = expanded ? 'hidden' : 'auto'
    document.body.classList.toggle('card-expanded', expanded)

    if (expanded) {
        // Resetear secciones al expandir
        Object.assign(expandedSections, {
            journeyInfo: true,
            carInfo: false,
            passengersInfo: false
        })
    } else {
        // Limpiar estados al colapsar
        showMessageBox.value = false
        message.value = ''
    }
})

// Cleanup al desmontar componente
onUnmounted(() => {
    document.body.style.overflow = 'auto'
    document.body.classList.remove('card-expanded')
})
</script>