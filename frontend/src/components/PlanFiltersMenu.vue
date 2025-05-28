<template lang="pug">
    // Sección de filtros visibles solo si 'showFilters' es true (en ciertas rutas)
    .filters
        .categories(v-if="showFilters")
            // Filtro por categoría
            label(for="category") Categorías:
            select(v-model="categoryModel" id="category" @change="applyFilters")
                option(value="Ver todo") Ver todo
                option(v-for="option in categories" :key="option" :value="option") {{ option }}
        .dateTime(v-if="showFilters")
            // Filtro por fecha de inicio
            label(for="startDate") Desde:   
                flat-pickr(
                    v-model="startDateModel" 
                    :config="flatpickrConfig" 
                    id="startDate" 
                    @on-change="applyFilters"
                )

            // Filtro por fecha de fin
            label(for="endDate") Hasta:  
                flat-pickr( 
                    v-model="endDateModel" 
                    :config="flatpickrConfig" 
                    id="endDate" 
                    placeholder="Seleccione fecha" 
                    @on-change="applyFilters"
                )

        .containerBtns
            // Botón para volver a inicio si no estamos en /dashboard
            router-link(v-if="route.path !== '/dashboard'" to="/dashboard")
                button Volver a inicio

            // Botón a "Mis planes" si el usuario tiene DNI y no está en esa ruta
            router-link(v-if="hasDni && route.path !== '/myPlans'" to="/myPlans")
                button Mis planes

            // Botón para crear nuevo plan (si tiene DNI) o completar perfil (si no)
            router-link(v-if="(hasDni && route.path !== '/createPlan') || (!hasDni && route.path !== '/editProfile')" :to="hasDni ? '/createPlan' : '/editProfile'")
                button(v-if="hasDni") + Crear nuevo plan
                button(v-else) Completa tu perfil

    // Cabecera de la sección, cambia según la ruta actual
    .plan-header
        h2 {{headerTitle}}
        .nature-divider
            .leaf-icon
                i.fas.fa-leaf
</template>

<script setup lang="ts">
// Composables de Vue
import { onMounted, ref, computed } from 'vue';
// Tipado para planes
import type { IPlan } from '../types/plan';
// Picker de fechas
import FlatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/l10n/es.js';
// Ruta actual
import { useRoute } from 'vue-router'

const route = useRoute()

// Título dinámico en base a la ruta actual
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

// Determina si mostrar filtros según la ruta actual
const showFilters = computed(() =>
    ['/dashboard', '/myPlans'].includes(route.path)
);

// Props recibidas del componente padre
const props = defineProps<{
    allPlans?: IPlan[],
    hasDni?: boolean
}>();

// Emite evento al componente padre con los planes filtrados
const emit = defineEmits<{
    (e: 'update:filteredPlans', plans: IPlan[]): void
}>();

// Variables reactivas para filtros
const categories = ['Pesca', 'Escalada', 'Senderismo'];
const categoryModel = ref<string>('Ver todo');
const startDateModel = ref<string>('');
const endDateModel = ref<string>('');

// Configuración compartida para Flatpickr
const flatpickrConfig = {
    dateFormat: 'd-m-Y',
    locale: 'es',
    disableMobile: true,
    allowInput: true,
    minDate: 'today',
    disable: [
        function (date: Date) {
            // Deshabilita fechas anteriores a hoy
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
        }
    ]
};

// Utilidad para convertir string de fecha a objeto Date
function parseDisplayDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Meses van de 0 a 11
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
}

// Llama a la función de filtrado y emite resultados
function applyFilters() {
    if (props.allPlans) {
        emit('update:filteredPlans', filteredPlans.value);
    }
}

// Computed que filtra los planes en base a categoría y fechas seleccionadas
const filteredPlans = computed(() => {
    if (!props.allPlans) return [];

    return props.allPlans.filter(plan => {
        if (!plan || !plan.dateTime || !plan.category) return false;

        const planDate = new Date(plan.dateTime);

        // Filtro por categoría
        const matchesCategory =
            categoryModel.value === 'Ver todo' ||
            plan.category === categoryModel.value;

        // Filtro por fecha de inicio
        let matchesStart = true;
        if (startDateModel.value) {
            const startDate = parseDisplayDate(startDateModel.value);
            if (startDate) {
                startDate.setHours(0, 0, 0, 0);
                matchesStart = planDate >= startDate;
            }
        }

        // Filtro por fecha final
        let matchesEnd = true;
        if (endDateModel.value) {
            const endDate = parseDisplayDate(endDateModel.value);
            if (endDate) {
                endDate.setHours(23, 59, 59, 999); // Fin del día
                matchesEnd = planDate <= endDate;
            }
        }

        return matchesCategory && matchesStart && matchesEnd;
    });
});

// Al montar el componente, inicializa fecha de inicio con el día actual y aplica filtros
onMounted(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    startDateModel.value = `${day}-${month}-${year}`;

    applyFilters();
});
</script>
