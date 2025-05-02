<template lang="pug">
    Header
    .wrapperPlan
        h2 Crear un nuevo plan

        form.formPlan(@submit.prevent="createPlan")
            input(type="text" placeholder="Título" v-model="plan.title" required)
            select(v-model="plan.category" required)
                option(disabled value="") Selecciona una categoría
                option(value="Pesca") Pesca
                option(value="Senderismo") Senderismo
                option(value="Escalada") Escalada

            textarea(placeholder="Descripción del plan" v-model="plan.description" required)
            //- input(type="text" placeholder="Ubicación" v-model="plan.location" required)
            //- <!-- Aquí agregamos el componente del mapa en lugar del input de ubicación -->
            MapSelector(@route-confirmed="handleRoute")
            input(type="datetime-local" v-model="plan.dateTime" required)
            input(type="number" min="1" placeholder="Plazas disponibles" v-model="plan.placesAvailable" required)
            input(type="number" min="1" placeholder="Precio de la plaza en euros" v-model="plan.price" required) 

            h3 Información del coche (obligatorio)
            .section-card
                input(type="text" placeholder="Matrícula" v-model="plan.carInformation.carIdentifier")
                input(type="text" placeholder="Marca" v-model="plan.carInformation.brand")
                input(type="text" placeholder="Modelo" v-model="plan.carInformation.model")
                input(type="text" placeholder="Color" v-model="plan.carInformation.color")

            .btn-group
                p(v-if="message") {{ message }}
                button.submit(type="submit") Crear plan
</template>

<script setup lang="ts">
import axios from 'axios'
import Header from '../components/Header.vue'
import { onMounted, ref } from 'vue'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'
import MapSelector from '../components/MapSelector.vue'

const { checkUser, tokenStore } = useRegisterStore()
const { hasDni } = storeToRefs(useRegisterStore())
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
    // location: '',
    // duration: '',
    // distance: '',
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

        // AQUÍ ESTÁ EL PROBLEMA - Condición incorrecta con Number(!plan.value.placesAvailable) y OR lógico
        if (!plan.value.title || !plan.value.category || !plan.value.description ||
            !plan.value.route.location.origin || !plan.value.route.location.destination ||
            !plan.value.dateTime || !plan.value.placesAvailable || !plan.value.price ||
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
    } catch (err) {
        console.error('Error al crear el plan:', err)
        message.value = 'Error al crear el plan'
    }
}

onMounted(async () => {
    await checkUser()
})  
</script>

<style lang="scss" scoped>
.wrapperPlan {
    max-width: 700px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #fdfdfd;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    h2 {
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 1.8rem;
        color: #2c3e50;
    }

    form.formPlan {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;

        input,
        select,
        textarea {
            padding: 0.75rem 1rem;
            border: 1px solid #2e7d32;
            border-radius: 8px;
            font-size: 1rem;
            width: 100%;
            transition: border 0.2s ease;
            background: #e0f0e9;
            color: #2e7d32;

            &:focus {
                border-color: #3498db;
                outline: none;
            }
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        h3 {
            margin-top: 1.5rem;
            font-size: 1.2rem;
            color: #34495e;
        }

        .section-card {
            background-color: #f9f9f9;
            padding: 1rem;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
        }

        .passenger {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;

            input {
                flex: 1;
                min-width: 150px;
            }

            button {
                background-color: #e74c3c;
                color: white;
                border: none;
                padding: 0.5rem;
                border-radius: 5px;
                cursor: pointer;

                &:hover {
                    background-color: #c0392b;
                }
            }
        }

        .btn-group {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 1.5rem;

            button {
                padding: 0.75rem 1.2rem;
                font-size: 1rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }

            .add {
                background-color: #27ae60;
                color: white;

                &:hover {
                    background-color: #219150;
                }
            }

            .submit {
                background-color: #2d89ef;
                color: white;

                &:hover {
                    background-color: #2269be;
                }
            }
        }
    }
}
</style>