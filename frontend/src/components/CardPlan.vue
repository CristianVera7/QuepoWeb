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
                            p.plan-description {{ plan.description }}
                        
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
                                    strong Fecha:
                                .detail
                                    span {{ formatDate(plan.dateTime).split(',')[0] }}
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


<style scoped lang="scss">
@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes sectionFadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes overlayFadeIn {
    from {
        opacity: 0;
        backdrop-filter: blur(0px);
        -webkit-backdrop-filter: blur(0px);
        background: transparent;
    }

    to {
        opacity: 1;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
    }
}

@keyframes contentSlideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes shimmer {
    from {
        left: -100%;
    }

    to {
        left: 100%;
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0) translateX(0);
    }

    25% {
        transform: translateY(-10px) translateX(5px);
    }

    50% {
        transform: translateY(-5px) translateX(-5px);
    }

    75% {
        transform: translateY(-15px) translateX(3px);
    }
}

@mixin button-base {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    i {
        margin-right: 0.5rem;
    }
}

@mixin glass-effect($opacity: 0.8) {
    background: rgba(255, 255, 255, $opacity);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

@mixin gradient-border($color) {
    border: 1px solid rgba($color, 0.3);

    &:hover {
        border-color: rgba($color, 0.6);
    }
}

@mixin hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

    &:hover {
        transform: translateY(-2px);
    }
}

.card-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0);
    z-index: 1000;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(8px);
    cursor: pointer;
    animation: overlayFadeIn 0.4s ease-out;
}

.modal-overlay-exit {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.301);
    z-index: 1009;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: modalFadeIn 0.3s ease-out;

    .modal-content-exit {
        @include glass-effect();
        border-radius: 12px;
        padding: 1.5rem;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        position: relative;
        z-index: 10010;
        transform: translateZ(0);
        background-color: #01440a;

        .modal-body {
            margin: 1rem;
            gap: 1rem;

            h3 {
                text-align: center;
                margin-bottom: 1rem;
                color: #ffffff;
            }

            .warning-text {
                color: #a8a8a8;
                font-weight: bold;
            }

        }

        .modal-footer {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;

            button {
                @include button-base;
                padding: 0.6rem 1.2rem;

                &.confirm-button {
                    background-color: #F44336;
                    color: #ffffff;

                    &:hover {
                        background-color: #e53935;
                    }
                }

                &.cancel-button {
                    background-color: white;
                    color: #444444;

                    &:hover {
                        background-color: rgb(231, 231, 231);
                    }
                }
            }
        }
    }
}

.wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    justify-content: center;
    gap: 1.5rem;
    align-items: flex-start;
    padding: 1rem;

    .plan-card {
        @include glass-effect(0.95);
        color: #01440a;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        width: 100%;
        max-width: 100%;
        position: relative;
        transform: scale(1);

        &.collapsed {
            &:hover {
                transform: scale(1.05) translateY(-4px);
                box-shadow: 0 20px 30px rgba(0, 0, 0, 0.2);
                background: rgba(255, 255, 255, 0.95);
                @include gradient-border(#4CAF50);
            }

            &.expanding {
                transform: scale(1.05) translateY(-5px);
                box-shadow: 0 25px 40px rgba(#4CAF50, 0.4);
                border: 2px solid rgba(#4CAF50, 0.6);
                transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
        }

        &.expanded {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 35vw;
            height: 90vh;
            z-index: 1001;
            border-radius: 16px;
            transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 30px 60px rgba(#4CAF50, 0.3);
            border: 2px solid rgba(#4CAF50, 0.4);

            .card-container {
                width: 100%;
                height: 100%;
                @include glass-effect(0.98);
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                position: relative;
                z-index: 1002;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: contentSlideIn 0.4s ease-out 0.2s both;
            }

            .plan-image {
                flex-shrink: 0;
                position: sticky;
                top: 0;
                z-index: 1003;
                min-height: 200px;
                max-height: 300px;
            }

            .plan-content {
                flex: 1;
                overflow-y: auto;
                height: calc(100% - 200px);

            }
        }

        .card-container {
            display: flex;
            flex-direction: column;
            height: 90%;
            overflow: hidden;
        }

        .plan-image {
            min-height: 200px;
            max-height: 300px;
            position: relative;
            flex-shrink: 0;
            overflow: hidden;

            .background-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }

            .plan-image-overlay {
                position: absolute;
                top: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 1rem;
                width: 100%;
            }

            .plan-category {
                @include glass-effect(0.95);
                background: linear-gradient(135deg, #4CAF50, #43a047);
                color: #ffffff;
                padding: 0.35rem 0.75rem;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .close-button {
                @include glass-effect(0.95);
                background: linear-gradient(135deg, #F44336, #e53935);
                color: #ffffff;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(#F44336, 0.4);

                &:hover {
                    background: linear-gradient(135deg, #F44336, #e53935);
                    transform: scale(1.1) rotate(90deg);
                    box-shadow: 0 6px 20px rgba(#F44336, 0.6);
                }

                i {
                    font-size: 1.2rem;
                    transition: transform 0.3s ease;
                }
            }
        }

        .plan-content {
            padding: 1.2rem;
            flex: 1;
            display: flex;
            flex-direction: column;

            .compact-view {
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                gap: 1rem;

                .plan-header {
                    margin-bottom: 0;

                    .nature-divider {
                        position: relative;
                        height: 2px;
                        background: linear-gradient(90deg, transparent, #4CAF50, #43a047, #006d12, transparent);
                        width: 100%;
                        margin: 0.5rem auto;
                        border-radius: 2px;
                        overflow: hidden;

                        &::after {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: -100%;
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                            animation: shimmer 2s infinite;
                        }
                    }

                    .plan-title {
                        display: flex;
                        align-items: center;
                        font-size: 1.1rem;
                        font-weight: 600;
                        margin: 0 0 0.5rem 0;
                        color: #006d12;
                        gap: 0.25rem;
                    }

                    .plan-description {
                        font-size: 0.95rem;
                        color: #006d12;
                        margin: 0;
                        font-weight: 500;
                    }
                }

                .compact-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.8rem;
                    font-size: 0.75rem;

                    .info-item-card {
                        display: grid;
                        justify-content: center;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        padding: 0.5rem;
                        gap: 0.5rem;


                        .wrapper-info-item {
                            display: flex;
                            align-items: center;
                            gap: 0.3rem;

                            i {
                                color: #4CAF50;
                                text-align: center;
                            }

                            strong {
                                margin: 0;
                                font-weight: 900;
                                color: #006d12;
                            }
                        }

                        .detail {
                            display: flex;
                            align-items: center;
                            place-content: center;

                            span {
                                margin: 0;
                                color: #006d12;
                            }
                        }
                    }
                }

                .plan-footer {
                    .plan-footer__togle-section {
                        display: grid;
                        gap: 0.9rem;

                        .wrapper-divider {
                            .expanded-button {
                                display: flex;
                                align-items: center;
                                justify-content: center;

                                p {
                                    font-size: 0.85rem;
                                    color: #43a047;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    margin: 0.3rem;
                                    padding: 0px;

                                    &:hover {
                                        color: #43a047;
                                        text-decoration: underline;
                                    }
                                }

                            }
                        }

                        .button-container {
                            display: flex;
                            align-items: center;
                            place-content: center;
                            justify-content: center;

                            button {
                                @include button-base;
                                padding: 0.9rem 2rem;
                                width: 70%;
                                margin: 0 auto;
                                font-size: 1rem;
                            }

                            // DNI Warning
                            .dni-warning {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                margin-bottom: 0;

                                .header-warning {
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    padding: auto;

                                    i {
                                        color: #F44336;
                                        font-size: 1.2rem;
                                    }

                                    p {
                                        margin: 0;
                                        font-size: 0.8rem;
                                        font-weight: bold;
                                        color: #F44336;
                                    }
                                }

                                .body-warning {
                                    padding: 1rem;
                                    text-align: center;
                                    color: #F44336;

                                    p {
                                        color: #F44336;
                                        margin: 0;
                                        font-weight: 500;
                                    }

                                    button {
                                        i {
                                            margin-left: 0.5rem;
                                        }

                                        white-space:nowrap;
                                        display:inline-block;
                                        color: white;
                                        font-weight: bold;
                                        width:90%;
                                        border-radius: 8px;
                                        background-color: #ffa931;
                                        @include button-base;
                                        box-shadow: 0 4px 12px rgba(#f0ad4e, 0.3);
                                        transition: background-color 0.3s ease, box-shadow 0.3s ease;

                                        &:hover {
                                            background-color: #ec971f;
                                            box-shadow: 0 4px 12px rgba(#f0ad4e, 0.3);
                                        }
                                        
                                    }
                                }
                            }

                            .join-button {
                                background-color: #4CAF50;
                                color: #ffffff;
                                box-shadow: 0 4px 12px rgba(#4CAF50, 0.3);

                                &:hover {
                                    background-color: #43a047;
                                    box-shadow: 0 6px 15px rgba(#4CAF50, 0.4);
                                    transform: translateY(-2px);
                                }

                                &:disabled {
                                    background-color: rgba(255, 255, 255, 0.2);
                                    color: rgba(#01440a, 0.5);
                                    cursor: not-allowed;
                                    box-shadow: none;
                                }
                            }

                            .message-box {
                                display: flex;
                                flex-direction: column;
                                gap: 1rem;
                                width: 100%;

                                .box {
                                    padding: 0.8rem 1rem;
                                    border-radius: 8px;
                                    border: 1px solid #4CAF50;
                                    resize: vertical;
                                    font-size: 0.95rem;
                                    color: #01440a;
                                    background-color: rgba(255, 255, 255, 0.8);
                                    transition: border-color 0.3s ease;

                                    &:focus {
                                        border-color: #43a047;
                                        outline: none;
                                    }
                                }

                                .send-button {
                                    background-color: #4CAF50;
                                    color: #ffffff;
                                    box-shadow: 0 4px 12px rgba(#4CAF50, 0.3);
                                    @include button-base;
                                    padding: 0.9rem 0;
                                    margin: 0 auto;
                                    width: 70%;

                                    &:hover {
                                        background-color: #43a047;
                                        box-shadow: 0 6px 15px rgba(#4CAF50, 0.4);
                                        transform: translateY(-2px);
                                    }

                                    &:disabled {
                                        background-color: rgba(#006d12, 0.63);

                                        color: rgba(#ffff, 0.5);
                                        cursor: not-allowed;
                                        box-shadow: none;
                                    }
                                }
                            }

                            .no-places-button {
                                background-color: rgba(#006d12, 0.63);
                                color: rgba(255, 255, 255, 0.76);
                                cursor: not-allowed;
                            }

                            .edit-plan-button {
                                background-color: #2196F3;
                                color: #ffffff;
                                box-shadow: 0 4px 12px rgba(#2196F3, 0.3);

                                &:hover {
                                    background-color: #1e88e5;
                                    box-shadow: 0 6px 15px rgba(#2196F3, 0.4);
                                    transform: translateY(-2px);
                                }
                            }

                            .leave-button {
                                background-color: #F44336;
                                color: #ffffff;
                                box-shadow: 0 4px 12px rgba(#F44336, 0.3);

                                &:hover {
                                    background-color: #e53935;
                                    box-shadow: 0 6px 15px rgba(#F44336, 0.4);
                                    transform: translateY(-2px);
                                }
                            }

                            .section-pending {
                                display: flex;
                                flex-direction: column;
                                align-items: center;

                                .pending-button {
                                    color: #f0ad4e;
                                    cursor: not-allowed;
                                    opacity: 0.8;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    margin: 0 0 1rem;
                                    padding: 0px;

                                    i {
                                        margin-right: 0.4rem;
                                    }
                                }

                                .cancel-request-button {
                                    background-color: #ffffff;
                                    color: #727272;
                                    box-shadow: 0 4px 12px rgba(#8b8b8b00, 0.3);
                                    width: 100%;

                                    &:hover {
                                        background-color: #f7f7f7;
                                        box-shadow: 0 6px 15px rgba(#8b8b8b, 0.4);
                                        transform: translateY(-2px);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            .expanded-view {
                margin-top: 1.5rem;
                flex: 1;
                padding-right: 8px;


            }
        }

        .section-box {
            @include glass-effect(0.9);
            @include hover-lift;
            @include gradient-border(#4CAF50);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

            &:hover {
                box-shadow: 0 4px 16px rgba(#4CAF50, 0.15);
            }
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
            transition: all 0.3s ease;

            &:hover h4 {
                color: #4CAF50;
            }

            h4 {
                display: flex;
                align-items: center;
                font-size: 1.05rem;
                font-weight: 600;
                margin: 0;
                color: #006d12;
                transition: color 0.3s ease;

                i {
                    margin-right: 0.5rem;
                    color: #4CAF50;
                    transition: transform 0.3s ease;
                }
            }

            i.fa-chevron-down,
            i.fa-chevron-up {
                color: #4CAF50;
                font-size: 0.9rem;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            }
        }

        .nature-divider {
            position: relative;
            min-height: 2px;
            background: linear-gradient(90deg, transparent, #4CAF50, #43a047, #006d12, transparent);
            width: 100%;
            margin: 0.5rem auto;
            border-radius: 2px;
            overflow: hidden;

            &::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                animation: shimmer 2s infinite;
            }
        }

        .section-content {
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            transition: max-height 0.5s ease, opacity 0.3s ease, padding 0.3s ease;
            padding-top: 0;

            &.expanded {
                max-height: 2000px;
                opacity: 1;
                padding-top: 0.5rem;
                animation: sectionFadeIn 0.3s ease-out;
            }
        }

        .plan-details {
            display: grid;
            gap: 0.6rem;

            .detail-item {
                display: flex;
                align-items: center;

                i {
                    color: #4CAF50;
                    width: 20px;
                    margin-right: 0.5rem;
                    text-align: center;
                }

                p {
                    margin: 0;
                    font-size: 0.95rem;
                    color: #006d12;
                }
            }
        }

        .car-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.8rem;
            font-size: 0.95rem;

            span {
                background-color: rgba(255, 255, 255, 0.8);
                padding: 0.5rem 0.8rem;
                border-radius: 6px;

                strong {
                    color: #4CAF50;
                }
            }
        }

        .passenger-list {
            margin: 0;
            padding: 0;
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;

            li {
                // @include hover-lift;
                background-color: rgba(255, 255, 255, 0.8);
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                font-size: 0.9rem;
                color: #01440a;
                border: 1px solid rgba(#4CAF50, 0.3);
                transition: all 0.2s ease;
            }
        }

        .plan-actions {
            margin-top: 0.7rem;
            padding-top: 1rem;

            .places-available {
                display: flex;
                align-items: center;
                margin-bottom: 1rem;
                font-size: 1.1rem;
                color: #01440a;

                i {
                    color: #4CAF50;
                    margin-right: 0.5rem;
                }

                strong {
                    margin-left: 0.3rem;
                    color: #4CAF50;
                }
            }

            .button-container-expanded {
                display: grid;
                gap: 1rem;
                width: 100%;

                // DNI Warning
                .dni-warning-expanded {
                    display: flex;
                    flex-direction: column;
                    height: auto;

                    .header-warning-expanded {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: auto;

                        i {
                            color: #F44336;
                            font-size: 1.2rem;
                        }

                        p {
                            margin: 0;
                            font-weight: bold;
                            color: #F44336;
                        }
                    }

                    .body-warning-expanded {
                        padding: 1rem;
                        text-align: center;
                        color: #F44336;

                        p {
                            color: #F44336;
                            margin: 0;
                            font-weight: 500;
                        }

                        button {
                            color: white;
                            text-decoration: none;
                            font-weight: bold;
                            padding: 1rem;
                            border-radius: 8px;
                            background-color: #ffa931;
                            @include button-base;
                            //Sombra
                            box-shadow: 0 4px 12px rgba(#f0ad4e, 0.3);
                            transition: background-color 0.3s ease, box-shadow 0.3s ease;

                            &:hover {
                                background-color: #ec971f;
                                box-shadow: 0 4px 12px rgba(#f0ad4e, 0.3);
                            }

                            i {
                                margin-left: 0.5rem;
                            }
                        }
                    }
                }

                button {
                    @include button-base;
                    padding: 0.9rem 0;
                    margin: 0 auto;
                    width: 50%;

                    i {
                        margin-right: 0.7rem;
                    }
                }

                .join-button-expanded {
                    background-color: #4CAF50;
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(#4CAF50, 0.3);

                    &:hover {
                        background-color: #43a047;
                        box-shadow: 0 6px 15px rgba(#4CAF50, 0.4);
                        transform: translateY(-2px);
                    }

                    &:disabled {
                        background-color: rgba(255, 255, 255, 0.2);
                        color: rgba(#01440a, 0.5);
                        cursor: not-allowed;
                        box-shadow: none;
                    }
                }


                .message-box-expanded {
                    display: grid;
                    gap: 1rem;
                    width: 100%;

                    .box-expanded {
                        padding: 0.8rem 1rem;
                        border-radius: 8px;
                        border: 1px solid #4CAF50;
                        resize: vertical;
                        font-size: 0.95rem;
                        color: #01440a;
                        background-color: rgba(255, 255, 255, 0.8);
                        transition: border-color 0.3s ease;
                        width: 100%;

                        &:focus {
                            border-color: #43a047;
                            outline: none;
                        }
                    }

                    .send-button-expanded {
                        background-color: #4CAF50;
                        color: #ffffff;
                        box-shadow: 0 4px 12px rgba(#4CAF50, 0.3);

                        &:hover {
                            background-color: #43a047;
                            box-shadow: 0 6px 15px rgba(#4CAF50, 0.4);
                            transform: translateY(-2px);
                        }

                        &:disabled {
                            background-color: rgb(155, 155, 155);

                            color: rgba(#01440a, 0.5);
                            cursor: not-allowed;
                            box-shadow: none;
                        }
                    }
                }

                .section-pending-expanded {
                    display: grid;
                    width: 100%;

                    .pending-button-expanded {
                        color: #f0ad4e;
                        cursor: not-allowed;
                        opacity: 0.8;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin: 0 0 1rem;
                        padding: 0px;

                        i {
                            margin-right: 0.4rem;
                        }
                    }

                    .cancel-request-button-expanded {
                        background-color: #ffffff;
                        color: #727272;
                        box-shadow: 0 4px 12px rgba(#8b8b8b, 0.3);
                        @include button-base;
                        margin: 0 auto;

                        &:hover {
                            background-color: #f7f7f7;
                            box-shadow: 0 6px 15px rgba(#8b8b8b, 0.4);
                            transform: translateY(-2px);
                        }
                    }
                }

                .leave-button-expanded {
                    background-color: #F44336;
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(#F44336, 0.3);

                    &:hover {
                        background-color: #e53935;
                        box-shadow: 0 6px 15px rgba(#F44336, 0.4);
                        transform: translateY(-2px);
                    }
                }

                .edit-plan-button-expanded {
                    background-color: #2196F3;
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(#2196F3, 0.3);

                    &:hover {
                        background-color: #1e88e5;
                        box-shadow: 0 6px 15px rgba(#2196F3, 0.4);
                        transform: translateY(-2px);
                    }
                }


                .no-places-button {
                    background-color: rgba(#006d12, 0.63);
                    color: rgba(255, 255, 255, 0.76);
                    cursor: not-allowed;
                }
            }
        }
    }
}

:global(body.card-expanded) {
    overflow: hidden;
    height: 100vh;
}
</style>

//COMPARANDO ESTE STYLE CON EL ANTIGUO(COMPONETIZADO), APLICAR LOS BREAKPOINTS Y ESTILOS DE RESPONSIVE DEL
//ANTIGUO(COMPONETIZADO)
//DEJANDO LISTO ESTE ARCHIVO PARA USAR EN EL ARCHIVO DE ESTILOS (COMPONETIZADO) CON LOS BREAKPOINTS QUE EXISTIAN