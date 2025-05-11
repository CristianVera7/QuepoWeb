<template lang="pug">
    .wrapper
        .plan-card
            .plan-image
                img.background-img(:src="defaultImage(plan.category)" :alt="plan.category")
                .plan-image-overlay
                    .plan-category {{ plan.category }}
            
            .plan-content
                .section-box.plan-header-box
                    .section-header(@click="toggleSection('planHeader')")
                        h4 
                            i.fas.fa-map-marked-alt
                            | {{plan.title}}
                        span.fas(:class="{'fa-chevron-down': !expandedSections.planHeader, 'fa-chevron-up': expandedSections.planHeader}")
                    
                    .nature-divider
                    .plan-header
                        .plan-title {{ plan.description }}
                    // Contenido principal y todos los demás desplegables
                    .section-content(v-show="expandedSections.planHeader" :class="{ expanded: expandedSections.planHeader }")
                        
                        // Sección Información del viaje
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
                        
                        // Sección Vehículo
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
                        
                        // Sección Pasajeros
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
                .plan-actions
                    p.places-available
                        i.fas.fa-chair
                        | Plazas disponibles: 
                        strong {{ plan.placesAvailable }}
                    .button-container
                        .dni-warning(v-if="!hasDni")
                            i.fas.fa-exclamation-triangle  
                            router-link(to="editProfile") Debes tener un DNI registrado en tu cuenta para unirte.
                                p Haga click para completar su perfil
                        
                        button.join-button(
                            v-if="plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !hasPendingRequest && !showMessageBox && hasDni"
                            @click="toggleMessageBox"
                        ) 
                            i.fas.fa-sign-in-alt
                            | Unirse
                        
                        button.pending-button(
                            v-if="hasPendingRequest && !plan.isCreator && !plan.isPassenger"
                            disabled
                        )
                            i.fas.fa-clock
                            | Solicitud pendiente
        
                        .message-box(v-if="showMessageBox")
                            textarea(v-model="message" placeholder="Escribe un mensaje para el creador..." rows="3")
                            button.send-button(@click="joinPlanEmit" :disabled="!message.trim()") 
                                i.fas.fa-paper-plane
                                | Enviar solicitud
        
                        button.no-places-button(v-if="!plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !hasPendingRequest && hasDni" disabled)
                            i.fas.fa-ban
                            | No hay plazas
                            
                        button.edit-button(v-if="plan.isCreator" @click="editPlan")
                            i.fas.fa-edit
                            | Editar
                            
                        button.leave-button(v-if="plan.isPassenger" @click="openLeaveModal")
                            i.fas.fa-sign-out-alt
                            | Salir del plan
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

interface Props {
    plan: IPlan,
    hasDni: boolean,
    pendingRequestPlans?: string[]
}

// Definimos el tipo para las secciones expandibles
type ExpandableSectionKey = 'planHeader' | 'journeyInfo' | 'carInfo' | 'passengersInfo';
interface ExpandedSections {
    planHeader: boolean;
    journeyInfo: boolean;
    carInfo: boolean;
    passengersInfo: boolean;
    [key: string]: boolean; // Índice de firma para permitir acceso por string
}

const { hasDni } = storeToRefs(useRegisterStore())
const props = defineProps<Props>()
const emit = defineEmits(['joinPlan', 'leavePlan'])
const showMessageBox = ref(false)
const message = ref('')
const showLeaveConfirmation = ref(false)

// Verificamos si este plan está en la lista de solicitudes pendientes
const hasPendingRequest = computed(() => {
    if (!props.pendingRequestPlans) return false;
    return props.pendingRequestPlans.includes(props.plan._id);
});

// Inicializamos todas las secciones como colapsadas
const expandedSections = reactive<ExpandedSections>({
    planHeader: false,
    journeyInfo: false,
    carInfo: false,
    passengersInfo: false
})

const toggleSection = (section: ExpandableSectionKey) => {
    const isOpening = !expandedSections[section];

    // Cierra todas las secciones primero
    Object.keys(expandedSections).forEach(key => {
        if (key !== 'planHeader') {
            expandedSections[key] = false;
        }
    });

    // Si estamos abriendo una sección específica, ábrela
    if (section !== 'planHeader') {
        expandedSections[section] = isOpening;
    }

    // Manejo especial para el planHeader (mantener como está si es necesario)
    if (section === 'planHeader') {
        expandedSections.planHeader = !expandedSections.planHeader;
        if (expandedSections.planHeader) {
            expandedSections.journeyInfo = true; // Mostrar por defecto si se abre el header
        } else {
            // Cierra también las secciones hijas si se colapsa el header
            expandedSections.journeyInfo = false;
            expandedSections.carInfo = false;
            expandedSections.passengersInfo = false;
        }
    }
};


const toggleMessageBox = () => {
    showMessageBox.value = !showMessageBox.value
}

const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const joinPlanEmit = () => {
    emit('joinPlan', { planId: props.plan._id, message: message.value })
    message.value = ''
    showMessageBox.value = false
}

const leavePlanEmit = (planId: string) => {
    emit('leavePlan', planId)
}

// Funciones separadas para mejor control del modal
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

const defaultImage = (category: string) => {
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
        case 'pesca': return fishing;
        case 'senderismo': return hiking;
        case 'escalada': return climbing;
        default: return defaultImg;
    }
}

const editPlan = () => {
    if (props.plan && props.plan._id) {
        router.push({ name: 'editPlan', params: { id: props.plan._id } });
    }
};
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

.wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 400px));
    justify-content: center;
    gap: 1.5rem;
    align-items: flex-start;

    .plan-card {
        background: rgba(255, 255, 255, 0.95);
        color: #01440a;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
        width: 100%; // ⚠️ Esto asegura que la tarjeta se adapte al contenedor del grid
        max-width: 100%; // ⚠️ No limites a 400px, deja que el grid lo gestione

        &:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 25px rgba(76, 175, 80, 0.15);
        }

        .plan-image {
            height: 200px; // Reducido un poco para tarjeta más compacta
            position: relative;

            .background-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .plan-image-overlay {
                position: absolute;
                top: 0;
                right: 0;
                display: flex;
                justify-content: flex-end;
                padding: 1rem;
                align-items: flex-start;
            }

            .plan-category {
                background-color: rgba(76, 175, 80, 0.9);
                color: #ffffff;
                padding: 0.35rem 0.75rem;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
        }

        .plan-content {
            padding: 1.2rem;
        }

        // Estilo general para todas las secciones
        .section-box {
            background-color: rgba(255, 255, 255, 0.795); // Color más suave
            border-radius: 10px;
            padding: 1rem; // Reducido para tarjetas más compactas
            margin-bottom: 1rem;
            transition: background-color 0.3s ease;

            // &:hover {
            //     background-color: rgb(229, 231, 229);
            // }
        }

        // Estilo específico para la caja del encabezado del plan
        .plan-header-box {
            margin-bottom: 1rem;
            background-color: rgba(76, 175, 79, 0.185);
            position: relative;

            &:hover {
                background-color: rgba(76, 175, 79, 0.25);
            }
        }

        // Estilos para los encabezados de sección
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;

            h4 {
                display: flex;
                align-items: center;
                font-size: 1.05rem;
                font-weight: 600;
                margin: 0;
                color: #006d12;

                i {
                    margin-right: 0.5rem;
                    color: #4CAF50;
                }
            }

            i.fa-chevron-down,
            i.fa-chevron-up {
                color: #4CAF50;
                font-size: 0.9rem;
                transition: transform 0.3s ease;
            }
        }

        .nature-divider {
            position: relative;
            height: 2px;
            background: linear-gradient(90deg, transparent, #006d12, transparent);
            width: 100%;
            margin: 0.5rem auto;
        }

        // Estilos para el contenido de la sección
        .section-content {
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            transition: max-height 0.5s ease, opacity 0.3s ease, padding 0.3s ease;
            padding-top: 0;

            &.expanded {
                max-height: 2000px; // Mayor altura para contener todas las secciones
                opacity: 1;
                padding-top: 0.5rem;
                animation: sectionFadeIn 0.3s ease-out;
            }

            // Estilos específicos para los desplegables dentro del header principal
            .expandable-section {
                margin-top: 1rem;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
                border: 1px solid rgba(76, 175, 80, 0.1);

                .section-content {
                    padding-left: 0.5rem;
                }
            }
        }

        .plan-header {
            .plan-title {
                font-size: 1rem;
                font-weight: 500;
                color: #006d12;
                padding: 0.5rem 0;
            }
        }

        .plan-details {
            display: grid;
            gap: 0.6rem;
            border-radius: 1rem;

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
                background-color: rgba(255, 255, 255, 0.719);
                padding: 0.5rem 0.8rem;
                border-radius: 6px;
                transition: transform 0.2s ease;

                &:hover {
                    transform: translateY(-2px);
                }

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
                background-color: rgba(255, 255, 255, 0.719);
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                font-size: 0.9rem;
                color: #01440a;
                border: 1px solid rgba(76, 175, 80, 0.3);
                transition: all 0.2s ease;

                &:hover {
                    background-color: rgba(76, 175, 80, 0.3);
                    transform: translateY(-2px);
                }
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

                i {
                    color: #4CAF50;
                    margin-right: 0.5rem;
                }

                strong {
                    margin-left: 0.3rem;
                    color: #01440a;
                }
            }

            .button-container {
                display: flex;
                flex-direction: column;
                gap: 1rem;

                .dni-warning {
                    display: flex;
                    justify-content: space-between;
                    background-color: rgba(244, 67, 54, 0.2);
                    color: #ff9b93;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    border-left: 4px solid #F44336;

                    i {
                        display: grid;
                        place-items: center;
                        font-size: 1rem;
                        color: #F44336;
                        padding: 1rem;
                        background-color: #f443362f;
                        border-top-left-radius: 8px;
                        border-bottom-left-radius: 8px;
                    }

                    a {
                        display: grid;
                        place-items: center;
                        color: inherit;
                        color: #e7180a;
                        margin: 1rem;
                        text-align: center;
                        text-decoration: none;

                        &:hover {
                            text-decoration: underline;
                            text-decoration-thickness: 1px;
                            text-decoration-color: #e7180a;
                        }
                    }
                }

                .pending-button {
                    background-color: #f0ad4e;
                    color: white;
                    cursor: not-allowed;
                    opacity: 0.8;

                    &:hover {
                        opacity: 0.8;
                    }
                }

                button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.9rem 2rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 70%;
                    margin: 0 auto;

                    i {
                        margin-right: 0.7rem;
                    }
                }

                .join-button {
                    background-color: #4CAF50;
                    color: white;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);

                    &:hover {
                        background-color: #43a047;
                        box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
                        transform: translateY(-2px);
                    }

                    &:disabled {
                        background-color: rgba(255, 255, 255, 0.2);
                        color: rgba(1, 105, 10, 0.5);
                        cursor: not-allowed;
                        box-shadow: none;
                    }
                }

                .no-places-button {
                    background-color: #015e04a1;
                    color: rgba(255, 255, 255, 0.76);
                    cursor: not-allowed;
                }

                .edit-button {
                    background-color: #2196F3;
                    color: white;
                    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);

                    &:hover {
                        background-color: #1e88e5;
                        box-shadow: 0 6px 15px rgba(33, 150, 243, 0.4);
                        transform: translateY(-2px);
                    }
                }

                .leave-button {
                    background-color: #F44336;
                    color: white;
                    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);

                    &:hover {
                        background-color: #e53935;
                        box-shadow: 0 6px 15px rgba(244, 67, 54, 0.4);
                        transform: translateY(-2px);
                    }
                }

                .message-box {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;

                    textarea {
                        padding: 0.8rem 1rem;
                        border-radius: 8px;
                        border: 1px solid#4CAF50;
                        resize: vertical;
                        min-height: 100px;
                        font-family: inherit;
                        background-color: rgba(76, 175, 79, 0.185);
                        color: #01440a;
                        width: 100%;

                        &:focus {
                            outline: none;
                            border-color: #4CAF50;
                            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
                        }

                        &::placeholder {
                            color: rgba(1, 68, 10, 0.6);
                        }
                    }

                    .send-button {
                        background-color: #4CAF50;
                        color: white;
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);

                        &:hover {
                            background-color: #43a047;
                            box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
                            transform: translateY(-2px);
                        }

                        &:disabled {
                            background-color: rgba(1, 136, 19, 0.34);
                            color: white;
                            cursor: not-allowed;
                            box-shadow: none;
                        }
                    }
                }
            }
        }
    }


    /* Estilos para el modal de confirmación - Ahora en el nivel raíz */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.596);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(3px);

        .modal-content {
            background-color: #01300af5;
            width: 90%;
            max-width: 450px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
            overflow: hidden;
            animation: modalFadeIn 0.3s ease;

            .modal-header {
                background-color: #0157089f;
                padding: 1.2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);

                h3 {
                    color: #F44336;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    font-size: 1.2rem;

                    i {
                        margin-right: 0.5rem;
                    }
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: #6c757d;
                    cursor: pointer;

                    &:hover {
                        color: #F44336;
                    }
                }
            }

            .modal-body {
                padding: 1.5rem;
                text-align: center;

                p {
                    margin: 0 0 0.8rem;
                    color: #ffffff;
                    font-size: 1rem;
                }

                .warning-text {
                    color: #F44336;
                    font-weight: 700;
                    font-size: 0.9rem;
                }
            }

            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                padding: 1rem 1.5rem;
                background-color: #0157089f;
                border-top: 1px solid rgba(0, 0, 0, 0.1);

                button {
                    padding: 0.6rem 1.2rem;
                    border-radius: 6px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;

                    i {
                        margin-right: 0.5rem;
                    }
                }

                .cancel-button {
                    background-color: #e9ecef;
                    color: #495057;

                    &:hover {
                        background-color: #dee2e6;
                        transform: translateY(-2px);
                    }
                }

                .confirm-button {
                    background-color: #F44336;
                    color: white;

                    &:hover {
                        background-color: #e53935;
                        transform: translateY(-2px);
                    }
                }
            }
        }
    }
}

@media (max-width: 992px) {
    .plan-card {
        .plan-image {
            height: 180px;
        }

        .plan-content {
            padding: 1rem;
        }

        .plan-header .plan-title {
            font-size: 0.95rem;
        }

        .section-header h4 {
            font-size: 1rem;
        }
    }
}

@media (max-width: 768px) {
    .plan-card {
        .plan-image {
            height: 160px;
        }

        .plan-content {
            padding: 0.9rem;
        }

        .car-details {
            grid-template-columns: 1fr;
        }

        .plan-actions {
            button {
                width: 95%;
                padding: 0.8rem 1.2rem;
                font-size: 0.95rem;
            }
        }

        .section-box {
            padding: 0.8rem 0.7rem;
            margin-bottom: 1rem;
        }
    }

    .modal-content {
        width: 95%;
        max-width: 400px;
    }
}

@media (max-width: 480px) {
    .wrapper {
        padding: 1rem;

        .plan-card {
            i {
                display: none;
            }

            .plan-image {
                height: 130px;
            }

            .plan-content {
                padding: 0.6rem;
            }

            .plan-header .plan-title {
                font-size: 0.85rem;
                text-align: center;
                font-weight: 100;

            }

            span {
                font-size: 0.75rem;
            }

            .car-details {
                grid-template-columns: 1fr;
                gap: 0.4rem;

                span {
                    font-size: 0.85rem;
                    padding: 0.4rem 0.6rem;
                    font-weight: 100;

                    strong {
                        font-size: 0.9rem;
                        font-weight: 100;
                    }
                }
            }

            .plan-details {
                gap: 0.5rem;

                .detail-item {
                    flex-direction: column;
                    align-items: flex-start;

                    p {
                        font-size: 0.85rem;
                        font-weight: 100;
                    }

                    i {
                        margin-right: 0;
                        margin-bottom: 0.3rem;
                    }
                }
            }

            .plan-actions {

                .places-available {
                    font-size: 0.85rem;
                }

                .button-container {
                    button {
                        width: 100%;
                        font-size: 0.9rem;
                        padding: 0.75rem;
                    }

                    .message-box {
                        textarea {
                            min-height: 80px;
                            font-size: 0.85rem;
                        }
                    }
                }
            }

            .section-box {
                padding: 0.6rem;
            }

            .section-header h4 {
                font-size: 0.9rem;
            }

            .passenger-list li {
                font-size: 0.8rem;
                padding: 0.3rem 0.6rem;
            }
        }

        .modal-content {
            width: 98%;
            max-width: 340px;

            .modal-header h3 {
                font-size: 1rem;
            }

            .modal-body p {
                font-size: 0.95rem;
            }

            .modal-footer {
                flex-direction: column;
                gap: 0.5rem;

                button {
                    width: 100%;
                    justify-content: center;
                }
            }
        }
    }
}
</style>