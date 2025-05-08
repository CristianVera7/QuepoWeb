<template lang="pug">
    FirstComponent
        PlanFiltersMenu(:hasDni="hasDni" )
        .plan-creation-container
            form.formPlan(@submit.prevent="createPlan")
                .form-group
                    label(for="plan-title") Título
                    input#plan-title(type="text" placeholder="Título de tu aventura" v-model="plan.title" required)
                
                .form-group
                    label(for="plan-category") Categoría
                    select#plan-category(v-model="plan.category" required)
                        option(disabled value="") Selecciona una categoría
                        option(value="Pesca") Pesca
                        option(value="Senderismo") Senderismo
                        option(value="Escalada") Escalada

                .form-group
                    label(for="plan-description") Descripción
                    textarea#plan-description(placeholder="Describe tu plan de aventura" v-model="plan.description" required)
                
                .form-group.map-section
                    label.map-label Selecciona la ruta
                    .map-container
                        MapSelector(@route-confirmed="handleRoute")
                    .route-info(v-if="plan.route.location.origin && plan.route.location.destination")
                        .route-detail
                            i.fas.fa-map-marker-alt
                            span Origen: {{ plan.route.location.origin }}
                        .route-detail
                            i.fas.fa-flag-checkered
                            span Destino: {{ plan.route.location.destination }}
                        .route-stats
                            .route-stat
                                i.fas.fa-road
                                span Distancia: {{ plan.route.distance }}
                            .route-stat
                                i.fas.fa-clock
                                span Duración: {{ plan.route.duration }}
                
                .form-row
                    .form-group.half
                        label(for="plan-date") Fecha y hora
                        input#plan-date(type="datetime-local" v-model="plan.dateTime" required)
                    
                    .form-group.half
                        label(for="plan-places") Plazas disponibles
                        input#plan-places(type="number" min="1" placeholder="Número de plazas" v-model="plan.placesAvailable" required)
                    
                    .form-group.half
                        label(for="plan-price") Precio por plaza
                        .price-input-container
                            input#plan-price(type="number" min="1" placeholder="Precio" v-model="plan.price" required)
                            span.price-currency €

                .form-group.car-section
                    h3 
                        i.fas.fa-car
                        span Información del vehículo
                    .car-info-grid
                        .car-info-item
                            label(for="car-plate") Matrícula
                            input#car-plate(type="text" placeholder="Ej: 12345EFD" v-model="plan.carInformation.carIdentifier")
                        
                        .car-info-item
                            label(for="car-brand") Marca
                            input#car-brand(type="text" placeholder="Ej: Toyota" v-model="plan.carInformation.brand")
                        
                        .car-info-item
                            label(for="car-model") Modelo
                            input#car-model(type="text" placeholder="Ej: Rav4" v-model="plan.carInformation.model")
                        
                        .car-info-item
                            label(for="car-color") Color
                            input#car-color(type="text" placeholder="Azul" v-model="plan.carInformation.color")

                .form-actions
                    .message-container(v-if="message" :class="{ 'success': message.includes('éxito'), 'error': message.includes('Error') || message.includes('campos') }")
                        i.fas(:class="message.includes('éxito') ? 'fa-check-circle' : 'fa-exclamation-circle'")
                        p {{ message }}
                    
                    button.submit-button(type="submit")
                        i.fas.fa-paper-plane
                        span Crear plan
</template>

<script setup lang="ts">
import FirstComponent from '../components/FirstComponent.vue'
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import MapSelector from '../components/MapSelector.vue'
import router from '../router'

const { checkUser, tokenStore } = useRegisterStore()
const { hasDni } = storeToRefs(useRegisterStore())
const plansList = ref([]) // Para PlanFiltersMenu
const plan = ref({
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
})
const message = ref('')

const handleRoute = (routeData: { origin: string, destination: string, duration: string, distance: string }) => {
    plan.value.route.location.origin = routeData.origin
    plan.value.route.location.destination = routeData.destination
    plan.value.route.duration = routeData.duration
    plan.value.route.distance = routeData.distance

    //Redirigir a dashboard

    console.log('Ruta seleccionada:', routeData)
}

const createPlan = async () => {
    try {
        await checkUser()
        if (!tokenStore || !hasDni) {
            console.error('No hay token de usuario disponible')
            return
        }
        console.log('Plan a crear:', plan.value)

        if (!plan.value.title || !plan.value.category || !plan.value.description ||
            !plan.value.route.location.origin || !plan.value.route.location.destination ||
            !plan.value.dateTime ||
            plan.value.placesAvailable === undefined || plan.value.placesAvailable <= 0 ||
            plan.value.price === undefined || plan.value.price <= 0 ||
            !plan.value.carInformation.carIdentifier || !plan.value.carInformation.brand ||
            !plan.value.carInformation.model || !plan.value.carInformation.color) {
            throw new Error('Por favor, complete todos los campos requeridos.')
        }

        await axios.post('http://localhost:8000/plan/create', plan.value, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })
        message.value = 'Plan creado con éxito.'
        plan.value = {
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

        router.push('/dashboard')
    } catch (err) {
        console.error('Error al crear el plan:', err)
        if (err instanceof Error) {
            message.value = err.message || 'Error al crear el plan'
        } else {
            message.value = 'Error al crear el plan'
        }
    }
}

onMounted(async () => {
    await checkUser()
})  
</script>

<style lang="scss" scoped>
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

        .submit-button {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #4CAF50;
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 179, 0, 0.3);

            i {
                margin-right: 0.5rem;
            }

            &:hover {
                background-color: #43a047;
                box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
            }

            &:active {
                transform: translateY(1px);
            }
        }
    }
}

// Ajustes para pantallas pequeñas
@media (max-width: 768px) {
    .plan-creation-container {
        padding: 1.5rem 1rem;
    }

    .plan-header h2 {
        font-size: 2rem;
    }

    .route-stats {
        flex-direction: column;
        gap: 0.5rem;
    }

    // .map-container {
    //     height: 300px;
    // }
}
</style>