<template lang="pug">
    .plan-card
        .plan-image
            img.background-img(:src="defaultImage(plan.category)" :alt="plan.category")
            .plan-image-overlay
                .plan-category {{ plan.category }}
        
        .plan-content
            .section-box.plan-header-box
                .plan-header
                    .plan-title {{ plan.description }}
    
            .section-box.passengers-info.expandable-section
                .section-header(@click="toggleSection('journeyInfo')")
                        h4 
                            i.fas.fa-car
                            | Informacion del viaje
                        i.fas(:class="{'fa-chevron-down': !expandedSections.journeyInfo, 'fa-chevron-up': expandedSections.journeyInfo}")
                    
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
            
            .section-box.car-info.expandable-section
                .section-header(@click="toggleSection('carInfo')")
                    h4 
                        i.fas.fa-car
                        | Vehículo
                    i.fas(:class="{'fa-chevron-down': !expandedSections.carInfo, 'fa-chevron-up': expandedSections.carInfo}")
                
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
        
            .section-box.passengers-info.expandable-section
                .section-header(@click="toggleSection('passengersInfo')")
                    h4 
                        i.fas.fa-users
                        | Pasajeros ({{ plan.passengers.length }})
                    i.fas(:class="{'fa-chevron-down': !expandedSections.passengersInfo, 'fa-chevron-up': expandedSections.passengersInfo}")
                
                .section-content(v-show="plan.passengers.length > 0 && expandedSections.passengersInfo" :class="{ expanded: expandedSections.passengersInfo }")
                    ul.passenger-list
                        li(v-for="p in plan.passengers" :key="p._id") {{ p.nickName }}
        
            .plan-actions
                p.places-available
                    i.fas.fa-chair
                    | Plazas disponibles: 
                    strong {{ plan.placesAvailable }}
                
                .button-container
                    .dni-warning(v-if="!hasDni")
                        i.fas.fa-exclamation-triangle  
                        p Debes tener un DNI registrado en tu cuenta para unirte.Completa tu perfil
                    
                    button.join-button(
                        v-if="plan.placesAvailable && !plan.isCreator && !plan.isPassenger && !showMessageBox && hasDni"
                        @click="toggleMessageBox"
                    ) 
                        i.fas.fa-sign-in-alt
                        | Unirse
    
                    .message-box(v-if="showMessageBox")
                        textarea(v-model="message" placeholder="Escribe un mensaje para el creador..." rows="3")
                        button.send-button(@click="joinPlanEmit" :disabled="!message.trim()") 
                            i.fas.fa-paper-plane
                            | Enviar solicitud
    
                    button.no-places-button(v-if="!plan.placesAvailable && !plan.isCreator && !plan.isPassenger && hasDni " disabled)
                        i.fas.fa-ban
                        | Unirse
                        
                    button.edit-button(v-if="plan.isCreator" @click="editPlan")
                            i.fas.fa-edit
                            | Editar
                        
                    button.leave-button(v-if="plan.isPassenger" @click="leavePlanEmit(plan._id)")
                        i.fas.fa-sign-out-alt
                        | Salir del plan
</template>

<script setup lang="ts">
import { type IPlan } from '../types/plan'
import { useRegisterStore } from '../stores/registerStore';
import { ref, reactive } from 'vue';
import fishing from '../img/plans/fishing.jpg'
import hiking from '../img/plans/hiking.png'
import climbing from '../img/plans/climbing.jpg'
import defaultImg from '../img/plans/defaultImg.jpg'
import { storeToRefs } from 'pinia';
import router from '../router';

interface Props {
    plan: IPlan,
    hasDni: boolean
}

// Definimos el tipo para las secciones expandibles
type ExpandableSectionKey = 'journeyInfo' | 'carInfo' | 'passengersInfo';
interface ExpandedSections {
    journeyInfo:boolean;
    carInfo: boolean;
    passengersInfo: boolean;
    [key: string]: boolean; // Añadimos un índice de firma para permitir acceso por string
}

const { hasDni } = storeToRefs(useRegisterStore())
const props = defineProps<Props>()
const emit = defineEmits(['joinPlan', 'leavePlan'])
const showMessageBox = ref(false)
const message = ref('')

// Control de secciones expandibles
const expandedSections = reactive<ExpandedSections>({
    journeyInfo: true,
    carInfo: false,
    passengersInfo: false
})

const toggleSection = (section: ExpandableSectionKey) => {
    expandedSections[section] = !expandedSections[section]
}

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

const defaultImage = (category: string) => {
    switch (category.toLowerCase()) {
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
.plan-card {
    background: rgba(255, 255, 255, 0.938);
    color: #01440a;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 25px rgba(76, 175, 80, 0.15);
    }

    .plan-image {
        height: 220px;
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
        padding: 1.5rem;
    }

    .plan-header-box {
        margin-bottom: 1.5rem;
        border-left: 4px solid #4CAF50;
        height: 6rem;
        display: grid;
        place-content: center;
    }

    .plan-header {
        .plan-title {
            font-size: 1rem;
            font-weight: 500;
            color: #006d12;
        }
    }

    .plan-location {
        display: grid;
        justify-content: space-between;
        margin-bottom: 1.2rem;
        padding: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 0.95rem;
        background-color: rgba(76, 175, 79, 0.185);
        border-radius: 1rem;

        p {
            display: flex;
            /* align-items: center; */
            margin: 0.5rem;

            i {
                margin-right: 0.5rem;
                color: #4CAF50;
            }
        }
    }

    .plan-details {
        display: grid;
        gap: 0.75rem;
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
            }
        }
    }

    .section-box {
        background-color: rgba(76, 175, 79, 0.185);
        border-radius: 10px;
        padding: 1.2rem;
        margin-bottom: 1.5rem;
        border: 1px solid rgba(76, 175, 80, 0.2);

        h4 {
            display: flex;
            align-items: center;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #006d12;
            padding-bottom: 0.7rem;
            border-bottom: 1px solid rgba(76, 175, 80, 0.5);

            i {
                margin-right: 0.5rem;
                color: #4CAF50;
            }
        }
    }

    // Estilos para secciones expandibles
    .expandable-section {
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            padding-bottom: 0;

            h4 {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
                flex-grow: 1;
            }

            i.fa-chevron-down,
            i.fa-chevron-up {
                color: #4CAF50;
                font-size: 0.9rem;
                transition: transform 0.3s ease;
            }
        }

        .section-content {
            overflow: hidden;
            padding-top: 1rem;
            transition: max-height 0.3s ease, opacity 0.3s ease;
            opacity: 1;

            &:not(.expanded) {
                max-height: 0;
                opacity: 0;
            }

            &.expanded {
                max-height: 500px; // Altura máxima suficiente
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
            }
        }
    }

    .plan-actions {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);

        .places-available {
            display: flex;
            align-items: center;
            margin-bottom: 1.2rem;
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
        }

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

            p {
                display: grid;
                place-items: center;
                color: #F44336;
                margin: 1rem;
                text-align: center;
            }
        }

        button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 70%;
            margin-left: 4rem;
            margin-bottom: 0;

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

            a {
                text-decoration: none;
                color: inherit;
            }

            &:hover {
                background-color: #1e88e5;
                box-shadow: 0 6px 15px rgba(33, 150, 243, 0.4);
            }
        }

        .leave-button {
            background-color: #F44336;
            color: white;
            box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);

            &:hover {
                background-color: #e53935;
                box-shadow: 0 6px 15px rgba(244, 67, 54, 0.4);
            }
        }

        .message-box {
            display: flex;
            flex-direction: column;
            gap: 1rem;

            textarea {
                padding: 0.8rem 1rem;
                border-radius: 8px;
                border: 1px solid#4CAF50;
                resize: vertical;
                min-height: 100px;
                font-family: inherit;
                background-color: rgba(76, 175, 79, 0.185);
                color: #01440a;

                &:focus {
                    outline: none;
                    border-color: #4CAF50;
                    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
                }

                &::placeholder {
                    color: #01440a;
                }
            }

            .send-button {
                background-color: #4CAF50;
                color: white;
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);

                &:hover {
                    background-color: #43a047;
                    box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
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

/* Responsive adjustments */
@media (max-width: 1200px) {
    .plan-card {
        .plan-content {
            padding: 1.25rem;
        }

        .section-box {
            padding: 1rem;
        }
    }
}

@media (max-width: 992px) {
    .plan-card {
        .plan-image {
            height: 200px;
        }

        .plan-content {
            padding: 1.25rem 1rem;
        }

        .plan-header .plan-title {
            font-size: 0.95rem;
        }

        .section-box h4 {
            font-size: 1rem;
        }
    }
}

@media (max-width: 768px) {
    .plan-card {
        .plan-image {
            height: 180px;
        }

        .plan-content {
            padding: 1rem;
        }

        .plan-location {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }

        .car-details {
            grid-template-columns: 1fr;
        }

        .plan-actions {
            button {
                width: 90%;
                margin-left: auto;
                margin-right: auto;
                padding: 0.9rem 1.5rem;
                font-size: 0.95rem;
            }
        }

        .section-box {
            padding: 1rem 0.8rem;
            margin-bottom: 1.2rem;
        }
    }
}

@media (max-width: 576px) {
    .plan-card {
        .plan-image {
            height: 160px;
        }

        .plan-category {
            font-size: 0.7rem;
            padding: 0.3rem 0.6rem;
        }

        .plan-content {
            padding: 0.8rem;
        }

        .plan-header-box {
            margin-bottom: 1rem;
            border-left-width: 3px;
        }

        .plan-header .plan-title {
            font-size: 0.9rem;
        }

        .plan-location,
        .plan-details {
            font-size: 0.85rem;
            padding: 0.4rem;
            margin-bottom: 1rem;

            p {
                margin: 0.4rem;
            }
        }

        .section-box {
            padding: 0.8rem;
            margin-bottom: 1rem;

            h4 {
                font-size: 0.95rem;
                margin-bottom: 0.8rem;
                padding-bottom: 0.5rem;
            }
        }

        .car-details {
            gap: 0.6rem;
            font-size: 0.85rem;

            span {
                padding: 0.4rem 0.6rem;
            }
        }

        .passenger-list li {
            padding: 0.3rem 0.6rem;
            font-size: 0.85rem;
        }

        .plan-actions {
            margin-top: 1rem;
            padding-top: 0.8rem;

            .places-available {
                font-size: 1rem;
                margin-bottom: 1rem;
            }

            button {
                width: 100%;
                padding: 0.8rem 1rem;
                font-size: 0.9rem;

                i {
                    margin-right: 0.5rem;
                }
            }

            .message-box textarea {
                min-height: 80px;
                padding: 0.6rem 0.8rem;
            }
        }
    }
}
</style>