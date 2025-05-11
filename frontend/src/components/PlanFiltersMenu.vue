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
                    :config="flatpickrConfig" 
                    id="startDate" 
                    @on-change="applyFilters"
                )
    
            label(for="endDate") Hasta:  
                flat-pickr( 
                    v-model="endDateModel" 
                    :config="flatpickrConfig" 
                    id="endDate" 
                    placeholder="Seleccione fecha" 
                    @on-change="applyFilters"
                )
    
        .containerBtns
            router-link(v-if="route.path !== '/dashboard'" to="/dashboard")
                button Volver a inicio

            router-link(v-if="hasDni && route.path !== '/myPlans'" to="/myPlans")
                button Mis planes

            router-link(v-if="(hasDni && route.path !== '/createPlan') || (!hasDni && route.path !== '/editProfile')" :to="hasDni ? '/createPlan' : '/editProfile'")
                button(v-if="hasDni") + Crear nuevo plan
                button(v-else) Completa tu perfil
    .plan-header
        h2 {{headerTitle}}
        .nature-divider
            .leaf-icon
                i.fas.fa-leaf
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import type { IPlan } from '../types/plan';
import FlatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/l10n/es.js';
import { useRoute } from 'vue-router'

const route = useRoute()

const headerTitle = computed(() => {
    switch (route.name) {
        case 'dashboard': return '¿De qué plan te apetece disfrutar?'
        case 'createPlan': return 'Crea un nuevo plan'
        case 'myPlans': return 'Mis planes'
        case 'editProfile': return 'Aquí puedes editar tu perfil'
        case 'editPlan': return 'Modifica tu plan'
        case 'requestsPlans': return 'Solicitudes pendientes'
        default: return ''
    }
})

const showFilters = computed(() =>
    ['/dashboard', '/myPlans'].includes(route.path)
);

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

// Flatpickr config unificada
const flatpickrConfig = {
    dateFormat: 'd-m-Y',
    locale: 'es',
    disableMobile: true,
    allowInput: true,
    minDate: 'today',
    disable: [
        function (date: Date) {
            // Deshabilita cualquier fecha anterior a hoy
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
        }
    ]
};

// Métodos
function parseDisplayDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
}

function applyFilters() {
    if (props.allPlans) {
        emit('update:filteredPlans', filteredPlans.value);
    }
}

// Computed para filtrar planes
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

// Lifecycle
onMounted(() => {
    // Establecemos la fecha de inicio como hoy
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    startDateModel.value = `${day}-${month}-${year}`;

    // Aplicar filtros iniciales
    applyFilters();
});
</script>

<style lang="scss">
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css');

// Variables comunes
$color-bg-main: rgba(1, 43, 0, 0.7);
$color-bg-dark: rgba(1, 43, 0, 0.938);
$color-bg-darkest: #012b00fa;
$color-white: #ffffff;
$color-green: #026800f5;
$color-gray: #d1d3d1;
$border-radius-sm: 0.5rem;
$border-radius-md: 1rem;
$shadow-default: 0 2px 4px rgba(0, 0, 0, 0.3);
$transition-default: all 0.3s ease;

// Filtros
.filters {
    display: flex;
    align-items: center;
    place-content: center;
    margin: 3em 2rem;
    flex-wrap: wrap;
    gap: 2.5rem;

    @media (max-width: 768px) {
        justify-content: center;
        place-content: center;
        align-items: center;
        gap: 0;
    }

    @media (max-width: 576px) {
        margin: 1.5em 0.5rem;
        gap: 1rem;
    }

    // Estilos comunes para categorías y dateTime
    .categories,
    .dateTime {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: $border-radius-md;

        @media (max-width: 576px) {
            padding: 0.75rem;
        }

        label {
            color: $color-white;
            font-size: 1rem;
            font-weight: 600;
            margin-right: 0.3rem;

            @media (max-width: 576px) {
                font-size: 0.9rem;
            }
        }
    }

    // Categorías
    .categories {
        select {
            padding: 0.5rem;
            border-radius: $border-radius-sm;
            border: 1px solid $color-white;
            background-color: $color-bg-main;
            color: $color-white;
            min-width: 140px;

            @media (max-width: 576px) {
                padding: 0.4rem;
                font-size: 0.9rem;
            }

            option {
                background-color: $color-bg-darkest;
                color: $color-white;
            }
        }
    }

    // DateTime
    .dateTime {
        flex-wrap: wrap;

        @media (max-width: 768px) {
            display: flex;
            justify-content: center;
            gap: 0;

            label {
                margin: 0.5rem 0;
            }
        }

        input {
            color: $color-white;
            background-color: $color-bg-main;
            padding: 0.5rem;
            border-radius: $border-radius-sm;
            border: 1px solid $color-white;
            margin-right: 1.5rem;
            width: 140px;

            @media (max-width: 576px) {
                padding: 0.4rem;
                font-size: 0.9rem;
            }

            &::placeholder {
                color: rgba(255, 255, 255, 0.6);
            }

            &::-webkit-calendar-picker-indicator {
                filter: invert(1);
            }
        }
    }

    // Botones
    .containerBtns {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-radius: $border-radius-md;
        flex-wrap: wrap;

        @media (max-width: 576px) {
            padding: 0.75rem;
        }

        button {
            background-color: $color-white;
            color: $color-green;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: $border-radius-sm;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: $transition-default;
            white-space: nowrap;

            @media (max-width: 576px) {
                padding: 0.4rem 0.8rem;
                font-size: 0.9rem;
            }

            &:hover {
                background-color: $color-gray;
            }
        }
    }
}

// Header del plan
.plan-header {
    text-align: center;
    margin-bottom: 2rem;

    @media (max-width: 768px) {
        margin-bottom: 1.5rem;
    }

    @media (max-width: 576px) {
        margin-bottom: 1rem;
    }

    h2 {
        font-size: 2.5rem;
        font-weight: 700;
        text-shadow: $shadow-default;
        margin-bottom: 1rem;
        color: $color-white;

        @media (max-width: 1200px) {
            font-size: 2.2rem;
        }

        @media (max-width: 992px) {
            font-size: 2rem;
        }

        @media (max-width: 768px) {
            font-size: 1.8rem;
            margin-bottom: 0.75rem;
        }

        @media (max-width: 576px) {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
    }

    .nature-divider {
        position: relative;
        height: 4px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
        width: 60%;
        margin: 1.5rem auto;

        @media (max-width: 1200px) {
            width: 70%;
        }

        @media (max-width: 992px) {
            width: 80%;
        }

        @media (max-width: 768px) {
            width: 90%;
            height: 3px;
            margin: 1rem auto;
        }

        @media (max-width: 576px) {
            width: 95%;
            height: 2px;
            margin: 0.75rem auto;
        }

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

            @media (max-width: 1200px) {
                width: 45px;
                height: 45px;
            }

            @media (max-width: 992px) {
                width: 40px;
                height: 40px;
            }

            @media (max-width: 768px) {
                width: 35px;
                height: 35px;
            }

            @media (max-width: 576px) {
                width: 30px;
                height: 30px;
            }

            i {
                color: $color-white;
                font-size: 1.5rem;

                @media (max-width: 1200px) {
                    font-size: 1.3rem;
                }

                @media (max-width: 992px) {
                    font-size: 1.2rem;
                }

                @media (max-width: 768px) {
                    font-size: 1.1rem;
                }

                @media (max-width: 576px) {
                    font-size: 1rem;
                }
            }
        }
    }
}

// Estilos de Flatpickr
.flatpickr-calendar {
    background-color: $color-bg-dark !important;
    color: $color-white !important;
    border: 1px solid $color-white;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    width: 307px;

    @media (max-width: 768px) {
        width: 300px;
    }

    @media (max-width: 480px) {
        width: 290px;
    }

    @media (max-width: 360px) {
        width: 270px;
    }

    // Contenedores principales
    .flatpickr-months,
    .flatpickr-weekdays,
    .flatpickr-days {
        background-color: transparent;
        color: $color-white;
    }

    .flatpickr-days {
        @media (max-width: 360px) {
            padding: 0;
        }
    }

    // Días
    .flatpickr-day {
        background: transparent;
        color: $color-white;
        border-radius: 50%;
        height: 38px;
        line-height: 38px;
        width: 38px;
        margin: 1px;

        @media (max-width: 768px) {
            height: 36px;
            line-height: 36px;
            width: 36px;
            font-size: 0.95rem;
        }

        @media (max-width: 480px) {
            height: 34px;
            line-height: 34px;
            width: 34px;
            font-size: 0.9rem;
            margin: 0.5px;
        }

        @media (max-width: 360px) {
            height: 32px;
            line-height: 32px;
            width: 32px;
            font-size: 0.85rem;
            margin: 0.4px;
        }

        &.selected,
        &.startRange,
        &.endRange {
            background: $color-white;
            color: #012b00;
            border-color: $color-white;
        }

        &:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        &.today {
            border-color: $color-white;
            color: #4CAF50;
            font-weight: bold;
        }

        &.prevMonthDay,
        &.nextMonthDay {
            color: rgba(255, 255, 255, 0.4);
        }

        &.disabled,
        &.flatpickr-disabled {
            color: rgba(192, 192, 192, 0.582);
            text-decoration: line-through;
            background-color: rgba(0, 0, 0, 0.1) !important;
            cursor: not-allowed;

            &:hover {
                background-color: rgba(255, 0, 0, 0.2) !important;
            }
        }
    }

    // Mes actual
    .flatpickr-current-month {
        color: $color-white;
        font-size: 1rem;
        padding: 5px 0;

        @media (max-width: 768px) {
            font-size: 0.95rem;
        }

        @media (max-width: 480px) {
            font-size: 0.9rem;
            padding: 4px 0;
        }

        @media (max-width: 360px) {
            font-size: 0.85rem;
            padding: 3px 0;
        }

        .numInputWrapper {
            color: $color-white;
        }

        input.cur-year {
            color: $color-white;
            font-size: 1rem;

            @media (max-width: 768px) {
                font-size: 0.95rem;
            }

            @media (max-width: 480px) {
                font-size: 0.9rem;
            }

            @media (max-width: 360px) {
                font-size: 0.85rem;
            }
        }
    }

    // Selector de meses
    .flatpickr-monthDropdown-months {
        appearance: none;
        background-color: transparent !important;
        color: $color-white !important;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.2rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 1rem;

        @media (max-width: 768px) {
            font-size: 0.95rem;
        }

        @media (max-width: 480px) {
            font-size: 0.9rem;
            padding: 0.15rem 0.4rem;
        }

        @media (max-width: 360px) {
            font-size: 0.85rem;
            padding: 0.1rem 0.3rem;
        }

        option {
            background-color: #012b00;
            color: $color-white;
        }
    }

    // Día de la semana
    .flatpickr-weekday {
        color: rgba(255, 255, 255, 0.8);
        font-weight: bold;
        font-size: 0.9rem;

        @media (max-width: 768px) {
            font-size: 0.85rem;
        }

        @media (max-width: 480px) {
            font-size: 0.8rem;
        }

        @media (max-width: 360px) {
            font-size: 0.75rem;
        }
    }

    // Botones de navegación
    .flatpickr-prev-month,
    .flatpickr-next-month {
        color: $color-white !important;
        padding: 10px;

        @media (max-width: 480px) {
            padding: 8px;
        }

        @media (max-width: 360px) {
            padding: 6px;
        }

        svg {
            fill: $color-white !important;
            width: 16px;
            height: 16px;

            @media (max-width: 480px) {
                width: 14px;
                height: 14px;
            }

            @media (max-width: 360px) {
                width: 12px;
                height: 12px;
            }
        }

        &:hover svg {
            fill: #4CAF50 !important;
        }
    }

    // Entrada numérica
    .numInputWrapper {
        span {
            border-color: rgba(255, 255, 255, 0.3);

            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            &:after {
                border-top-color: $color-white;
            }

            &.arrowUp:after {
                border-bottom-color: $color-white;
            }
        }
    }
}
</style>