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