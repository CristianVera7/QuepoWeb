<template lang="pug">
    .map-container
        .route-info
            // Campos de entrada para las direcciones
            input(
                type="text"
                v-model="address.origin"
                placeholder="Dirección de salida"
                @input="debouncedGeocodeAddress('origin')"
                )
            input(
                type="text"
                v-model="address.destination"
                placeholder="Dirección de destino"
                @input="debouncedGeocodeAddress('destination')"
                )
            // Contenedor del mapa Leaflet
            .map(ref="mapRef")

        // Sistema de notificaciones para mostrar mensajes al usuario
        .notification(v-if="notification.visible" :class="notification.type")
            .notification-content
                span.notification-icon(v-if="notification.type === 'error'") ⚠️
                span.notification-icon(v-else-if="notification.type === 'success'") ✅
                span.notification-icon(v-else) ℹ️
                .notification-message(v-html="notification.message.replace(/\\n/g, '<br>')")

            button.notification-close(@click="notification.visible = false") ×

        // Indicador de carga durante operaciones asíncronas
        .loading-indicator(v-if="loading")
            .loading-spinner
            span Cargando...

        // Botón para calcular/actualizar la ruta
        .containerBtn
            button.confirm-button(
                type="button"
                :disabled="!isRouteReady"
                @click="calculateRoute"
            )
                i.fas.fa-map-marked-alt
                span {{ existingRouteData ? 'Actualizar ruta' : 'Calcular ruta' }}
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import api from '../api/index'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Configuración de iconos de Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

interface Coordinates {
    lat: number | null;
    lng: number | null;
}

interface AddressState {
    origin: string;
    destination: string;
}

interface NotificationState {
    message: string;
    type: 'info' | 'error' | 'success';
    visible: boolean;
}

interface OpenCageResponse {
    results: Array<{
        formatted: string;
        geometry: { lat: number; lng: number };
    }>;
    status: { code: number; message: string };
}

const props = defineProps<{
    initialRoute?: {
        location: { origin: string; destination: string };
        distance: string;
        duration: string;
    } | null;
}>()

const emit = defineEmits<{
    (e: 'route-confirmed', data: {
        origin: string;
        destination: string;
        duration: string;
        distance: string;
    }): void
}>()

// CONFIGURACIÓN DE API KEYS
const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || ''
const OPENROUTE_API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY || '5b3ce3597851110001cf62483f8191c887b24389bc8fbfa5b3f59671'

// REFERENCIAS DEL DOM Y ESTADOS
const mapRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const notification = ref<NotificationState>({ message: '', type: 'info', visible: false })
const address = ref<AddressState>({ origin: '', destination: '' })
const coords = ref({
    origin: { lat: null as number | null, lng: null as number | null },
    destination: { lat: null as number | null, lng: null as number | null },
})
const route = ref({
    origin: '',
    destination: '',
    distance: '',
    duration: '',
})

let leafletMap: L.Map | null = null
let originMarker: L.Marker | null = null
let destinationMarker: L.Marker | null = null
let routeLayer: L.Polyline | null = null

// PROPIEDADES COMPUTADAS
const existingRouteData = computed(() => {
    return props.initialRoute &&
        props.initialRoute.location &&
        props.initialRoute.location.origin &&
        props.initialRoute.location.destination
})

const isRouteReady = computed(() => {
    return !!(coords.value.origin.lat && coords.value.destination.lat)
})

// INICIALIZACIÓN DEL MAPA
const initializeMap = async () => {
    if (!mapRef.value) return
    try {
        leafletMap = L.map(mapRef.value).setView([40.4168, -3.7038], 6)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap) 
        leafletMap.on('click', onMapClick)
        setTimeout(() => {
            if (leafletMap) leafletMap.invalidateSize()
        }, 100)
        updateMapWithExistingCoords()
    } catch (err) {
        console.error('Error al inicializar el mapa:', err)
        showNotification('Error al cargar el mapa.', 'error')
    }
}

// CARGAR DATOS EXISTENTES
const loadExistingRouteData = async () => {
    if (!existingRouteData.value) return
    try {
        loading.value = true
        address.value.origin = props.initialRoute!.location.origin
        address.value.destination = props.initialRoute!.location.destination
        await geocodeAddress('origin', true)
        await geocodeAddress('destination', true)
        if (coords.value.origin.lat && coords.value.destination.lat) {
            await calculateRoute(true)
        }
    } finally {
        loading.value = false
    }
}

// ACTUALIZAR MARCADORES EN EL MAPA
const updateMapWithExistingCoords = () => {
    if (!leafletMap) return
    if (coords.value.origin.lat && coords.value.origin.lng) {
        if (originMarker) originMarker.remove()
        originMarker = L.marker([coords.value.origin.lat, coords.value.origin.lng]).addTo(leafletMap).bindPopup('Origen')
    }
    if (coords.value.destination.lat && coords.value.destination.lng) {
        if (destinationMarker) destinationMarker.remove()
        destinationMarker = L.marker([coords.value.destination.lat, coords.value.destination.lng]).addTo(leafletMap).bindPopup('Destino')
    }
    if (coords.value.origin.lat && coords.value.destination.lat) {
        const bounds = L.latLngBounds(
            [coords.value.origin.lat, coords.value.origin.lng!],
            [coords.value.destination.lat, coords.value.destination.lng!]
        )
        leafletMap.fitBounds(bounds, { padding: [50, 50] })
    }
}

// MANEJADOR DE CLICK EN EL MAPA
const onMapClick = async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    let type: 'origin' | 'destination' = !coords.value.origin.lat ? 'origin' :
        !coords.value.destination.lat ? 'destination' : 'origin'
    coords.value[type] = { lat, lng }

    try {
        loading.value = true
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}&language=es`
        const res = await fetch(url)
        const data = await res.json()

        if (data.results && data.results.length > 0) {
            const formattedAddress = data.results[0].formatted
            address.value[type] = formattedAddress
        } else {
            address.value[type] = `Ubicación: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
        }
    } catch (err) {
        console.error('Error en reverseGeocode:', err)
        address.value[type] = `Ubicación: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } finally {
        loading.value = false
    }
}

// GEOCODIFICACIÓN
const geocodeAddress = async (type: 'origin' | 'destination', skipNotification: boolean = false) => {
    const query = address.value[type]
    if (!query || query.length < 3) return
    try {
        loading.value = true
        const result = await geocodeWithOpenCage(query)
        if (!result) {
            if (!skipNotification) {
                showNotification(`No se encontró la dirección "${query}".`, 'error')
            }
            return
        }
        coords.value[type] = { lat: result.lat, lng: result.lng }
        if (!skipNotification) {
            address.value[type] = result.formatted
        }
        if (type === 'origin') {
            if (originMarker) originMarker.remove()
            originMarker = L.marker([result.lat, result.lng]).addTo(leafletMap!).bindPopup('Origen').openPopup()
        } else {
            if (destinationMarker) destinationMarker.remove()
            destinationMarker = L.marker([result.lat, result.lng]).addTo(leafletMap!).bindPopup('Destino').openPopup()
        }
        leafletMap?.setView([result.lat, result.lng], 13)
    } catch (err) {
        console.error('Error al geocodificar:', err)
    } finally {
        loading.value = false
    }
}

const geocodeWithOpenCage = async (query: string): Promise<{ lat: number; lng: number; formatted: string } | null> => {
    if (!OPENCAGE_API_KEY) return null
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&language=es`
    const response = await api.get<OpenCageResponse>(url, { timeout: 10000 })
    if (response.data.results.length === 0) return null
    const result = response.data.results[0]
    return {
        lat: result.geometry.lat,
        lng: result.geometry.lng,
        formatted: result.formatted
    }
}

// EMITIR RUTA CON DIRECCIONES LEGIBLES
const calculateRoute = async (skipNotification: boolean = false) => {
    const { origin, destination } = coords.value
    if (!origin.lat || !destination.lat) return
    try {
        loading.value = true
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        const response = await api.post(
            'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
            {
                coordinates: [
                    [origin.lng!, origin.lat!],
                    [destination.lng!, destination.lat!],
                ],
            },
            {
                signal: controller.signal,
                headers: { Authorization: OPENROUTE_API_KEY },
            }
        )
        clearTimeout(timeoutId)
        if (!response.data.features || response.data.features.length === 0) {
            if (!skipNotification) {
                showNotification('No se pudo encontrar una ruta entre estos puntos.', 'error')
            }
            return
        }
        const feature = response.data.features[0]
        const summary = feature.properties.summary
        const coordsList = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]])
        if (routeLayer) leafletMap?.removeLayer(routeLayer)
        routeLayer = L.polyline(coordsList, { color: 'blue', weight: 5 }).addTo(leafletMap!)
        leafletMap?.fitBounds(L.latLngBounds(coordsList), { padding: [50, 50] })

        route.value.distance = `${(summary.distance / 1000).toFixed(2)} km`
        const mins = Math.round(summary.duration / 60)
        const hrs = Math.floor(mins / 60)
        route.value.duration = hrs ? `${hrs} h ${mins % 60} min` : `${mins} min`

        // ✅ EMITIR LAS DIRECCIONES CON NOMBRES DE CALLE
        emit('route-confirmed', {
            origin: address.value.origin,
            destination: address.value.destination,
            duration: route.value.duration,
            distance: route.value.distance
        })

        if (!skipNotification) {
            showNotification(existingRouteData.value ? 'Ruta actualizada' : 'Ruta calculada', 'success')
        }
    } catch (err) {
        console.error('Error al calcular la ruta:', err)
        if (!skipNotification) {
            showNotification('Error al calcular la ruta.', 'error')
        }
    } finally {
        loading.value = false
    }
}

// OBSERVADORES
watch([() => coords.value.origin, () => coords.value.destination], () => {
    if (leafletMap) updateMapWithExistingCoords()
}, { deep: true })

watch([() => address.value.origin, () => address.value.destination], ([newO, newD], [oldO, oldD]) => {
    if (newO !== oldO && newO === '') {
        coords.value.origin = { lat: null, lng: null }
        if (originMarker) originMarker.remove()
    }
    if (newD !== oldD && newD === '') {
        coords.value.destination = { lat: null, lng: null }
        if (destinationMarker) destinationMarker.remove()
    }
})

// DEBOUNCE PARA INPUTS
const debounce = (fn: Function, delay: number) => {
    let timeout: number | null = null
    return (...args: any[]) => {
        if (timeout) window.clearTimeout(timeout)
        timeout = window.setTimeout(() => fn(...args), delay)
    }
}
const debouncedGeocodeAddress = debounce((type: 'origin' | 'destination') => geocodeAddress(type), 1000)

// NOTIFICACIONES
const showNotification = (message: string, type: 'info' | 'error' | 'success') => {
    notification.value = { message, type, visible: true }
    setTimeout(() => notification.value.visible = false, 5000)
}

// CICLO DE VIDA
onMounted(async () => {
    await nextTick()
    await initializeMap()
    if (existingRouteData.value) {
        await loadExistingRouteData()
    }
})

onUnmounted(() => {
    leafletMap?.off()
    leafletMap?.remove()
    leafletMap = null
})
</script>