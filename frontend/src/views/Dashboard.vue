<template lang="pug">
    Header
    .filters
        .categories
            label(for="category") Categoría: 
            select(v-model="selectedCategory" id="category" )
                option(disabled value="") Selecciona una categoría
                option(v-for="option in categories" :key="option") {{ option }}
        .dateTime
            label(for="startDate") Desde:
            input(type="date" v-model="startDate" id="startDate" :min="today")

            label(for="endDate") Hasta:
            input(type="date" v-model="endDate" id="endDate" :min="startDate")

        .createPlan
            router-link(:to="hasDni ? '/createPlan' : '/editProfile'") 
                 button {{hasDni ?"+ Crear nuevo plan" : "Completa tu perfil"}} 
    .plan-list
        template(v-if="filteredPlans.length ")
            .plan-card(v-for="plan in filteredPlans" :key="plan._id"  )
                .plan-header
                    .plan-title {{ plan.title }}
                    .plan-category {{ plan.category }}

                .plan-details
                    p {{ plan.description }}
                    p Ubicacion origen: {{ plan.route.location.origin }}
                    p Ubicacion destino: {{ plan.route.location.destination }}
                    p Distancia: {{ plan.route.distance }}
                    p Duración: {{ plan.route.duration }}
                    p Precio: {{ plan.price }}€
                    p Fecha: {{ new Date(plan.dateTime).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                    p Organiza: {{ plan.creatorNickName }}

                .section-box
                    h4 🚗 Coche
                    ul
                        li Marca: {{ plan.carInformation.brand }}
                        li Modelo: {{ plan.carInformation.model }}
                        li Color: {{ plan.carInformation.color }}
                        li Matrícula: {{ plan.carInformation.carIdentifier }}

                .section-box
                    h4 👥 Pasajeros ({{ plan.passengers.length }})
                    ul
                        li(v-for="p in plan.passengers" :key="p._id") {{ p.nickName }}

                .section-box
                    p Lugares disponibles: 
                        strong {{ plan.placesAvailable }}
                .button-join
                    p(v-if="!hasDni") Debes tener un DNI registrado en tu cuenta para unirte.
                    button(v-if="plan.placesAvailable" @click="joinPlan(plan._id)" :disabled="!hasDni") Unirse
                    button(v-else disabled) Sin plazas disponibles   
        p(v-else) No hay planes disponibles para esta categoria y/o fecha.
</template>

<script setup lang="ts">
import Header from '../components/Header.vue'
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { type IPlan } from '../types/plan'
import { useRegisterStore } from '../stores/registerStore'
import { storeToRefs } from 'pinia'

const store = useRegisterStore()
const { checkUser, tokenStore } = store
const { hasDni } = storeToRefs(useRegisterStore())
const plansList = ref<IPlan[]>([])
const categories = ['Ver todo', 'Pesca', 'Escalada', 'Senderismo']
const selectedCategory = ref('')
const startDate = ref('')
const endDate = ref('')
const today = ref('')


function formatDateToInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const listOfPlans = async () => {
    try {
        const response = await axios.get('http://localhost:8000/plan/list')

        if (response.data.ok) {
            plansList.value = response.data.data
        } else {
            console.log('ERROR AL OBTENER LOS PLANES')
        }
    } catch (error) {
        console.log(error)
    }
}

const filteredPlans = computed(() => {
    return plansList.value.filter(plan => {
        if (!plan || !plan.dateTime || !plan.category) return false

        const planDate = new Date(plan.dateTime)

        const matchesCategory =
            selectedCategory.value === 'Ver todo' || selectedCategory.value === '' ||
            plan.category === selectedCategory.value

        const matchesStart = !startDate.value || planDate >= new Date(startDate.value)
        const matchesEnd = !endDate.value || planDate <= new Date(endDate.value)

        return matchesCategory && matchesStart && matchesEnd
    })
})

const joinPlan = async (planId: string) => {
    await checkUser()
    try {
        const response = await axios.post(`http://localhost:8000/plan/join/${planId}`, {}, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenStore}`
            }
        })
        console.log(response.data)
        if (response.data.ok) {
            console.log('Te has unido al plan')
            await listOfPlans()
        } else {
            console.log('ERROR AL UNIRSE AL PLAN')
        }
    } catch (error) {
        console.log(error)
    }
}


watch(startDate, (newStartDate) => {
    if (endDate.value && new Date(endDate.value) < new Date(newStartDate)) {
        endDate.value = newStartDate
    }
})

onMounted(async () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const todayString = formatDateToInput(now)
    today.value = todayString
    startDate.value = todayString

    await checkUser()
    await listOfPlans()
})
</script>

<style scoped lang="scss">
.filters {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin: 2em;

    .dateTime {
        display: flex;
        align-items: center;

        label {
            font-size: 1.2rem;
            font-weight: 600;
            margin-right: 1rem;
        }

        input {
            padding: 0.5rem;
            border-radius: 0.5rem;
            border: 1px solid #ccc;
            margin-right: 1rem;
        }
    }

    .categories {
        display: flex;
        align-items: center;

        label {
            font-size: 1.2rem;
            font-weight: 600;
            margin-right: 1rem;
        }

        select {
            padding: 0.5rem;
            border-radius: 0.5rem;
            border: 1px solid #ccc;
        }
    }

    .createPlan {
        display: flex;
        align-items: center;

        button {
            background-color: #4CAF50;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.3s ease;

            &:hover {
                background-color: #45a049;
            }
        }
    }
}

.plan-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;

    .plan-card {
        background: white;
        color: #2e2e2e;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        border-radius: 16px;
        padding: 1.5rem;
        margin: 1rem;
        // margin: 1rem auto;
        width: 420px;
        box-shadow: 5px 7px 3px rgba(0, 0, 0, 0.08);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        border: 1px solid #e0e0e0;

        .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 0.5rem;

            .plan-title {
                font-size: 1.3rem;
                font-weight: 600;
            }

            .plan-category {
                background-color: #e0f0e9;
                color: #2e7d32;
                padding: 0.25rem 0.6rem;
                border-radius: 6px;
                font-size: 0.85rem;
                font-weight: 500;
                margin-left: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: 1px solid #c4decf;
            }

        }

        .plan-details {
            font-size: 0.95rem;
            line-height: 1.4;
            color: #555;
        }

        .section-box {
            background-color: #e0f0e9;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.25rem 1.5rem;
            margin-top: 1rem;
            transition: border 0.2s ease, box-shadow 0.2s ease;

            h4 {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 0.75rem;
                color: #1f2937;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 0.5rem;
            }

            ul {
                margin: 0;
                padding: 0;
                list-style: none;

                li {
                    position: relative;
                    padding-left: 1.5rem;
                    margin-bottom: 0.6rem;
                    font-size: 0.96rem;
                    color: #374151;

                    &::before {
                        content: '';
                        position: absolute;
                        top: 0.5rem;
                        left: 0;
                        width: 8px;
                        height: 8px;
                        background-color: #4b5563;
                        border-radius: 50%;
                    }
                }
            }

            &:hover {
                border-color: #d1d5db;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            }
        }

        .button-join {
            display: grid;
            justify-content: center;
            margin-top: auto;
            border-top: 1px solid #e5e7eb;
            padding-top: 1.5rem;
            gap: 0.5rem;

            input {
                padding: 0.5rem;
                border-radius: 0.5rem;
                border: 1px solid #ccc;
                width: 100%;
            }

            button {
                background-color: #4CAF50;
                color: white;
                padding: 0.5rem 1.5rem;
                border: none;
                border-radius: 0.5rem;
                font-size: 1.2rem;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.3s ease;

                &:hover {
                    background-color: #45a049;
                }

                &:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
            }
        }
    }

    .plan-card:hover {
        transform: translateY(-6px);
        box-shadow: 8px 10px 5px rgba(0, 0, 0, 0.10);
    }
}
</style>
