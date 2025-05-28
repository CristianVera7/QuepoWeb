<template lang="pug">
    .wrapper
        .plan-card
            // Imagen de fondo con categoría del plan
            .plan-image
                img.background-img(:src="defaultImage(plan.category)" :alt="plan.category")
                .plan-image-overlay
                    .plan-category {{ plan.category }}
            
            .plan-content
                // Header principal del plan - siempre visible, controla la expansión general
                .section-box.plan-header-box
                    .section-header(@click="toggleSection('planHeader')")
                        h4 
                            i.fas.fa-map-marked-alt
                            | {{plan.title}}
                        span.fas(:class="{'fa-chevron-down': !expandedSections.planHeader, 'fa-chevron-up': expandedSections.planHeader}")
                    
                    .nature-divider
                    .plan-header
                        .plan-title {{ plan.description }}
                    
                    // Todo el contenido desplegable se muestra solo cuando planHeader está expandido
                    .section-content(v-show="expandedSections.planHeader" :class="{ expanded: expandedSections.planHeader }")
                        
                        // Sección 1: Información básica del viaje (organiza, fecha, rutas, precio)
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
                                        i.fas.fa-user
                                        p  
                                            strong Organiza: 
                                            | {{ plan.creatorNickName }}
                                    .detail-item
                                        i.fas.fa-calendar 
                                        p
                                            strong Fecha:
                                            | {{ formatDate(plan.dateTime).split(',')[0] }}
                                    .detail-item
                                        i.fas.fa-route
                                        p  
                                            strong Salida desde: 
                                            | {{ plan.route.location.origin }} 
                                    .detail-item
                                        i.fas.fa-map-pin
                                        p
                                            strong Dirección a:
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
                                    .detail-item
                                        i.fas.fa-euro-sign
                                        p
                                            strong Precio: 
                                            | {{ plan.price }}€
                        
                        // Sección 2: Información del vehículo (marca, modelo, color, matrícula)
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
                
                .nature-divider
                
                // Sección de acciones - siempre visible al final
                .plan-actions
                    // Contador de plazas disponibles
                    p.places-available
                        i.fas.fa-chair
                        | Plazas disponibles: 
                        strong {{ plan.placesAvailable }}
                    
                    .button-container
                        // Advertencia si el usuario no tiene DNI registrado
                        .dni-warning(v-if="!hasDni")
                            i.fas.fa-exclamation-triangle  
                            router-link(to="editProfile") Debes tener un DNI registrado en tu cuenta para unirte.
                                p Haga click para completar su perfil
                        
                        // Botón "Unirse" - solo si hay plazas, no es creador, no es pasajero, no tiene solicitud pendiente y tiene DNI
                        button.join-button(
                            v-if="plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !hasPendingRequest && !showMessageBox && hasDni"
                            @click="toggleMessageBox"
                        ) 
                            i.fas.fa-sign-in-alt
                            | Unirse
                        
                        // Estado "Solicitud pendiente" - cuando el usuario ya envió una solicitud
                        p.pending-button(
                            v-if="hasPendingRequest"
                            disabled
                        )
                            i.fas.fa-clock
                            | Solicitud pendiente
        
                        // Caja de mensaje para enviar solicitud de unión
                        .message-box(v-if="showMessageBox")
                            textarea(v-model="message" placeholder="Escribe un mensaje para el creador..." rows="3")
                            button.send-button(@click="joinPlanEmit" :disabled="!message.trim()") 
                                i.fas.fa-paper-plane
                                | Enviar solicitud
        
                        // Botón deshabilitado cuando no hay plazas disponibles
                        button.no-places-button(v-if="!plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !hasPendingRequest && hasDni" disabled)
                            i.fas.fa-ban
                            | No hay plazas
                            
                        // Botón "Editar" - solo visible para el creador del plan
                        button.edit-button(v-if="plan.isCreator" @click="editPlan")
                            i.fas.fa-edit
                            | Editar
                            
                        // Botón "Salir del plan" - solo visible para pasajeros actuales
                        button.leave-button(v-if="plan.isPassenger" @click="openLeaveModal")
                            i.fas.fa-sign-out-alt
                            | Salir del plan
    
    // Modal de confirmación para salir del plan (se renderiza en el body)
    Teleport(to="body")
        .modal-overlay(v-if="showLeaveConfirmation" @click.self="closeLeaveModal")
            .modal-content
                .modal-header
                    h3 
                        i.fas.fa-exclamation-triangle
                        | Confirmar salida
                    button.close-button(@click="closeLeaveModal")
                        i.fas.fa-times
                .modal-body
                    p ¿Estás seguro de que deseas abandonar este plan?
                    p.warning-text Tu plaza quedará disponible para otros usuarios.
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
import { useRegisterStore } from '../stores/registerStore';
import { ref, reactive, computed, onMounted } from 'vue';
import fishing from '../img/plans/fishing.jpg'
import hiking from '../img/plans/hiking.png'
import climbing from '../img/plans/climbing.jpg'
import defaultImg from '../img/plans/defaultImg.jpg'
import { storeToRefs } from 'pinia';
import router from '../router';

// Props del componente
interface Props {
    plan: IPlan,
    hasDni: boolean,
    pendingRequestPlans?: string[]
}

// Definición de tipos para el sistema de secciones expandibles
type ExpandableSectionKey = 'planHeader' | 'journeyInfo' | 'carInfo' | 'passengersInfo';
interface ExpandedSections {
    planHeader: boolean;
    journeyInfo: boolean;
    carInfo: boolean;
    passengersInfo: boolean;
    [key: string]: boolean; // Índice de firma para permitir acceso por string
}

// Acceso al store de registro para verificar DNI
const { hasDni } = storeToRefs(useRegisterStore())
const props = defineProps<Props>()
const emit = defineEmits(['joinPlan', 'leavePlan'])

// Estados reactivos para el flujo de unirse al plan
const showMessageBox = ref(false)  // Controla la visibilidad del textarea para mensaje
const message = ref('')           // Contenido del mensaje del usuario

// Estados reactivos para el flujo de salir del plan
const showLeaveConfirmation = ref(false)  // Controla la visibilidad del modal de confirmación

// Verifica si el usuario tiene una solicitud pendiente para este plan
const hasPendingRequest = computed(() => {
    return props.pendingRequestPlans?.includes(props.plan._id) ?? false;
});

// Estado reactivo para controlar qué secciones están expandidas
// Inicializamos todas las secciones como colapsadas
const expandedSections = reactive<ExpandedSections>({
    planHeader: false,
    journeyInfo: false,
    carInfo: false,
    passengersInfo: false
})

/**
 * FLUJO PRINCIPAL DE EXPANSIÓN DE SECCIONES:
 */
const toggleSection = (section: ExpandableSectionKey) => {
    const isOpening = !expandedSections[section];

    // Paso 1: Cierra todas las secciones primero (excepto planHeader)
    Object.keys(expandedSections).forEach(key => {
        if (key !== 'planHeader') {
            expandedSections[key] = false;
        }
    });

    // Paso 2: Si estamos abriendo una sección específica, ábrela
    if (section !== 'planHeader') {
        expandedSections[section] = isOpening;
    }

    // Paso 3: Manejo especial para el planHeader (sección padre)
    if (section === 'planHeader') {
        expandedSections.planHeader = !expandedSections.planHeader;
        if (expandedSections.planHeader) {
            // Al abrir el header, mostrar por defecto la información del viaje
            expandedSections.journeyInfo = true;
        } else {
            // Al cerrar el header, cierra también todas las secciones hijas
            expandedSections.journeyInfo = false;
            expandedSections.carInfo = false;
            expandedSections.passengersInfo = false;
        }
    }
};

/**
 * FLUJO DE UNIRSE AL PLAN:
 * 1. Usuario hace click en "Unirse" -> se muestra el textarea
 * 2. Usuario escribe mensaje y hace click en "Enviar solicitud"
 * 3. Se emite el evento al componente padre con planId y mensaje
 * 4. Se resetea el estado local
 */
const toggleMessageBox = () => {
    showMessageBox.value = !showMessageBox.value
}

const joinPlanEmit = () => {
    emit('joinPlan', { planId: props.plan._id, message: message.value })
    message.value = ''
    showMessageBox.value = false
}

/**
 * FLUJO DE SALIR DEL PLAN:
 * 1. Usuario hace click en "Salir del plan" -> se abre modal de confirmación
 * 2. Usuario confirma -> se emite evento al padre y se cierra modal
 * 3. Usuario cancela -> solo se cierra modal
 */
const openLeaveModal = () => {
    showLeaveConfirmation.value = true
    // Prevenimos el scroll del body cuando el modal está activo
    document.body.style.overflow = 'hidden'
}

const closeLeaveModal = () => {
    showLeaveConfirmation.value = false
    // Restauramos el scroll del body
    document.body.style.overflow = 'auto'
}

const confirmLeavePlan = () => {
    leavePlanEmit(props.plan._id)
    closeLeaveModal()
}

const leavePlanEmit = (planId: string) => {
    emit('leavePlan', planId)
}

//  Formatea fecha para mostrar solo día/mes/año
const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

//  Retorna la imagen de fondo según la categoría del plan
const defaultImage = (category: string) => {
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
        case 'pesca': return fishing;
        case 'senderismo': return hiking;
        case 'escalada': return climbing;
        default: return defaultImg;
    }
}

//  Redirige a la página de edición del plan
const editPlan = () => {
    if (props.plan && props.plan._id) {
        router.push({ name: 'editPlan', params: { id: props.plan._id } });
    }
};
</script>