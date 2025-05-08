<template lang="pug">
    .filters
        .categories(v-if="showFilters")
            label(for="category") Categorías:
            select(v-model="categoryModel" id="category" @change="applyFilters")
                option(value="Ver todo") Ver todo
                option(v-for="option in categories" :key="option" :value="option") {{ option }}
        .dateTime(v-if="showFilters")
            label(for="startDate") Desde:   
                flat-pickr(
                    v-model="startDateModel" 
                    :config="startDateConfig" 
                    id="startDate" 
                    @on-change="onStartDateChange"
                )
    
            label(for="endDate") Hasta:  
                flat-pickr( 
                    v-model="endDateModel" 
                    :config="endDateConfig" 
                    id="endDate" 
                    placeholder="Seleccione fecha " 
                    @on-change="onEndDateChange"
                )
    
        .containerBtns
            router-link(v-if="hasDni && route.path !== '/dashboard'" to="/dashboard")
                button Todos los planes

            router-link(v-if="hasDni && route.path !== '/myPlans'" to="/myPlans")
                button Mis planes

            router-link(v-if="(hasDni && route.path !== '/createPlan') || (!hasDni && route.path !== '/editProfile')" :to="hasDni ? '/createPlan' : '/editProfile'")
                button {{ hasDni ? "+ Crear nuevo plan" : "Completa tu perfil" }}
    .plan-header
        h2 {{headerTitle}}
        .nature-divider
            .leaf-icon
                i.fas.fa-leaf
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import type { IPlan } from '../types/plan';
import FlatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/l10n/es.js';
import { useRoute } from 'vue-router'

const route = useRoute()

const headerTitle = computed(() => {
    if (route.name === 'dashboard') return '¿De qué plan te apetece disfrutar?'
    if (route.name === 'createPlan') return 'Crea un nuevo plan'
    if (route.name === 'myPlans') return 'Mis planes'
    if (route.name === 'editProfile') return 'Aquí puedes editar tu perfil'
    if (route.name === 'editPlan') return 'Modifica tu plan'
    if (route.name === 'requestsPlans') return 'Solicitudes pendientes'

    return ''
})

const showFilters = computed(() => {
    return ['/dashboard', '/myPlans'].includes(route.path);
});


// Props
const props = defineProps<{
    allPlans?: IPlan[],
    hasDni?: boolean
}>();

// Emits
const emit = defineEmits<{
    (e: 'update:filteredPlans', plans: IPlan[]): void
}>();

// Data
const categories = ['Pesca', 'Escalada', 'Senderismo'];
const categoryModel = ref<string>('Ver todo');
const startDateModel = ref<string>('');
const endDateModel = ref<string>('');
const today = ref<string>('');

// Flatpickr configs
const startDateConfig = {
    dateFormat: 'd-m-Y',
    locale: 'es',
    disableMobile: true,
    allowInput: true,
    minDate: 'today' // Establece la fecha mínima como hoy
};

const endDateConfig = {
    dateFormat: 'd-m-Y',
    locale: 'es',
    disableMobile: true,
    allowInput: true,
    minDate: 'today' // Establece la fecha mínima como hoy
};

// Methods
function formatDateToDisplay(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function parseDisplayDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Formato: DD-MM-YYYY
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
}

function onStartDateChange(selectedDates: Date[], dateStr: string) {
    // Verificar que la fecha seleccionada no sea anterior a la fecha actual
    const selectedDate = parseDisplayDate(dateStr);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (selectedDate && selectedDate < currentDate) {
        // Si es anterior, establecer la fecha de hoy
        startDateModel.value = today.value;
    } else {
        startDateModel.value = dateStr;
    }

    // Si la fecha de fin es anterior a la fecha de inicio, actualizarla
    if (endDateModel.value) {
        const startDate = parseDisplayDate(startDateModel.value);
        const endDate = parseDisplayDate(endDateModel.value);

        if (startDate && endDate && endDate < startDate) {
            endDateModel.value = startDateModel.value;
        }
    }

    // Actualizar la configuración del segundo selector para establecer la nueva fecha mínima
    endDateConfig.minDate = startDateModel.value;

    applyFilters();
}

function onEndDateChange(selectedDates: Date[], dateStr: string) {
    // Verificar que la fecha seleccionada no sea anterior a la fecha actual
    const selectedDate = parseDisplayDate(dateStr);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (selectedDate && selectedDate < currentDate) {
        // Si es anterior, establecer la fecha de hoy
        endDateModel.value = today.value;
    } else if (selectedDate && startDateModel.value) {
        // Verificar que no sea anterior a la fecha de inicio
        const startDate = parseDisplayDate(startDateModel.value);

        if (startDate && selectedDate < startDate) {
            endDateModel.value = startDateModel.value;
        } else {
            endDateModel.value = dateStr;
        }
    } else {
        endDateModel.value = dateStr;
    }

    applyFilters();
}

function applyFilters() {
    if (props.allPlans) {
        emit('update:filteredPlans', filteredPlans.value);
    }
}

// Computed
const filteredPlans = computed(() => {
    if (!props.allPlans) return [];
    return props.allPlans.filter(plan => {
        if (!plan || !plan.dateTime || !plan.category) return false;

        const planDate = new Date(plan.dateTime);

        // Filtrado por categoría
        const matchesCategory =
            categoryModel.value === 'Ver todo' ||
            plan.category === categoryModel.value;

        // Filtrado por fecha inicial
        let matchesStart = true;
        if (startDateModel.value) {
            const startDate = parseDisplayDate(startDateModel.value);
            if (startDate) {
                startDate.setHours(0, 0, 0, 0);
                matchesStart = planDate >= startDate;
            }
        }

        // Filtrado por fecha final
        let matchesEnd = true;
        if (endDateModel.value) {
            const endDate = parseDisplayDate(endDateModel.value);
            if (endDate) {
                endDate.setHours(23, 59, 59, 999); // Final del día
                matchesEnd = planDate <= endDate;
            }
        }

        return matchesCategory && matchesStart && matchesEnd;
    });
});

// Watchers
watch(filteredPlans, (newFilteredPlans) => {
    emit('update:filteredPlans', newFilteredPlans);
});

watch(() => props.allPlans, (newPlans) => {
    if (newPlans) {
        applyFilters();
    }
});


// Lifecycle
onMounted(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    today.value = formatDateToDisplay(now);
    startDateModel.value = today.value;

    // Actualizar configuración de flatpickr
    startDateConfig.minDate = 'today';
    endDateConfig.minDate = startDateModel.value;

    // Aplicar filtros iniciales
    applyFilters();
});
</script>

<style scoped lang="scss">
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css');

.filters {
    display: flex;
    align-items: center;
    place-content: center;
    margin: 3em 2rem;
    flex-wrap: wrap;
    gap: 2.5rem;

    .categories {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 1rem;

        label {
            color: white;
            font-size: 1rem;
            font-weight: 600;
            margin-right: 0.3rem;
        }

        select {
            padding: 0.5rem;
            border-radius: 0.5rem;
            border: 1px solid white;
            background-color: rgba(1, 43, 0, 0.7);
            color: white;
            min-width: 140px;
        }

        option {
            background-color: #012b00fa;
            color: #ffffff;
        }
    }

    .dateTime {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 1rem;
        flex-wrap: wrap;

        label {
            color: white;
            font-size: 1rem;
            font-weight: 600;
        }

        input {
            color: white;
            background-color: rgba(1, 43, 0, 0.7);
            padding: 0.5rem;
            border-radius: 0.5rem;
            border: 1px solid white;
            margin-right: 1.5rem;
            width: 140px;

            &::placeholder {
                color: rgba(255, 255, 255, 0.6);
            }

            &::-webkit-calendar-picker-indicator {
                filter: invert(1);
            }
        }
    }

    .containerBtns {
        // margin-left: auto;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-radius: 1rem;
        flex-wrap: wrap; // Mejor adaptación en móviles

        button {
            background-color: #ffffff;
            color: #026800f5;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.3s ease;
            white-space: nowrap;

            &:hover {
                background-color: #d1d3d1;
            }
        }
    }
}

.plan-header {
    text-align: center;
    margin-bottom: 2rem;

    h2 {
        font-size: 2.5rem;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        margin-bottom: 1rem;
        color: #ffffff;
    }

    .nature-divider {
        position: relative;
        height: 4px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
        width: 60%;
        margin: 1.5rem auto;

        .leaf-icon {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(1, 43, 0, 0.961);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);

            i {
                color: #ffffff;
                font-size: 1.5rem;
            }
        }
    }
}

/* Media queries para hacer responsive el header y los filtros */
@media (max-width: 1200px) {
    .plan-header {
        h2 {
            font-size: 2.2rem;
        }

        .nature-divider {
            width: 70%;

            .leaf-icon {
                width: 45px;
                height: 45px;

                i {
                    font-size: 1.3rem;
                }
            }
        }
    }
}

@media (max-width: 992px) {
    .plan-header {
        h2 {
            font-size: 2rem;
        }

        .nature-divider {
            width: 80%;

            .leaf-icon {
                width: 40px;
                height: 40px;

                i {
                    font-size: 1.2rem;
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .filters {
        display: flex;
        justify-content: center;
        place-content: center;
        align-items: center;
        gap: 0rem;

        .dateTime {
            display: flex;
            justify-content: center;
            gap: 0;

            label {
                margin: 0.5rem 0;
            }
        }
    }

    .plan-header {
        margin-bottom: 1.5rem;

        h2 {
            font-size: 1.8rem;
            margin-bottom: 0.75rem;
        }

        .nature-divider {
            width: 90%;
            height: 3px;
            margin: 1rem auto;

            .leaf-icon {
                width: 35px;
                height: 35px;

                i {
                    font-size: 1.1rem;
                }
            }
        }
    }
}

@media (max-width: 576px) {
    .filters {
        margin: 1.5em 0.5rem;
        gap: 1rem;

        .categories,
        .dateTime {
            padding: 0.75rem;

            label {
                font-size: 0.9rem;
            }

            select,
            input {
                padding: 0.4rem;
                font-size: 0.9rem;
            }
        }

        .containerBtns button {
            padding: 0.4rem 0.8rem;
            font-size: 0.9rem;
        }
    }

    .plan-header {
        margin-bottom: 1rem;

        h2 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .nature-divider {
            width: 95%;
            height: 2px;
            margin: 0.75rem auto;

            .leaf-icon {
                width: 30px;
                height: 30px;

                i {
                    font-size: 1rem;
                }
            }
        }
    }
}
</style>

<style lang="scss">
/* Estilos globales para flatpickr */
.flatpickr-calendar {
    background-color: rgba(1, 43, 0, 0.9) !important;
    color: white !important;
    border: 1px solid white;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);

    .flatpickr-months,
    .flatpickr-weekdays,
    .flatpickr-days {
        background-color: transparent;
        color: white;
    }

    .flatpickr-day {
        background: transparent;
        color: white;
        border-radius: 50%;

        &.selected,
        &.startRange,
        &.endRange {
            background: white;
            color: #012b00;
            border-color: white;
        }

        &:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        &.today {
            border-color: white;
            color: #4CAF50;
        }

        &.prevMonthDay,
        &.nextMonthDay {
            color: rgba(255, 255, 255, 0.4);
        }

        &.disabled {
            color: rgba(255, 255, 255, 0.2);
            text-decoration: line-through;
        }
    }

    .flatpickr-current-month {
        color: white;

        .numInputWrapper {
            color: white;
        }

        input.cur-year {
            color: white;
        }
    }

    .flatpickr-monthDropdown-months {
        appearance: none;
        background-color: transparent !important;
        color: white !important;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.2rem 0.5rem;
        border-radius: 0.25rem;
    }

    .flatpickr-monthDropdown-months option {
        background-color: #012b00;
        color: white;
    }

    .flatpickr-weekday {
        color: rgba(255, 255, 255, 0.8);
        font-weight: bold;
    }

    .flatpickr-prev-month,
    .flatpickr-next-month {
        color: white !important;

        svg {
            fill: white !important;
        }

        &:hover svg {
            fill: #4CAF50 !important;
        }
    }

    .numInputWrapper {
        span {
            border-color: rgba(255, 255, 255, 0.3);

            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            &:after {
                border-top-color: white;
            }

            &.arrowUp:after {
                border-bottom-color: white;
            }
        }
    }
}
</style>