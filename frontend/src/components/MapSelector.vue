<template>
    <div class="map-container">
        <div class="route-info">
            <input type="text" v-model="address.origin" placeholder="Dirección de salida"
                @input="debouncedGeocodeAddress('origin')" />
            <input type="text" v-model="address.destination" placeholder="Dirección de destino"
                @input="debouncedGeocodeAddress('destination')" />
            <div class="map" ref="mapRef"></div>

            <!-- Sistema de notificaciones -->
            <div class="notification" v-if="notification.visible" :class="notification.type">
                <div class="notification-content">
                    <span v-if="notification.type === 'error'" class="notification-icon">⚠️</span>
                    <span v-else-if="notification.type === 'success'" class="notification-icon">✅</span>
                    <span v-else class="notification-icon">ℹ️</span>
                    <div class="notification-message" v-html="notification.message.replace(/\n/g, '<br>')"></div>
                </div>
                <button class="notification-close" @click="notification.visible = false">×</button>
            </div>

            <div class="loading-indicator" v-if="loading">
                <div class="loading-spinner"></div>
                <span>Cargando...</span>
            </div>

            <button type="button" :disabled="!isRouteReady" @click="calculateRoute" class="confirm-button">
                Confirmar ruta
            </button>

            <div class="route-details" v-if="hasRouteInfo">
                <p><strong>Origen:</strong> {{ route.origin }}</p>
                <p><strong>Destino:</strong> {{ route.destination }}</p>
                <p><strong>Distancia:</strong> {{ route.distance }}</p>
                <p><strong>Duración:</strong> {{ route.duration }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Define interfaces for better TypeScript support
interface Coordinates {
    lat: number | null;
    lng: number | null;
}

interface AddressState {
    origin: string;
    destination: string;
}

interface RouteState {
    origin: string;
    destination: string;
    distance: string;
    duration: string;
}

interface NotificationState {
    message: string;
    type: 'info' | 'error' | 'success';
    visible: boolean;
}

// Define interfaces for Nominatim API responses
interface NominatimResponse {
    display_name: string;
    lat: string;
    lon: string;
    address?: NominatimAddress;
}

interface NominatimAddress {
    road?: string;
    street?: string;
    path?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    [key: string]: string | undefined;
}

const mapRef = ref<HTMLElement | null>(null)
const apiKey = '5b3ce3597851110001cf62483f8191c887b24389bc8fbfa5b3f59671'
const loading = ref(false)
const notification = ref<NotificationState>({ message: '', type: 'info', visible: false })

const address = ref<AddressState>({
    origin: '',
    destination: '',
})

const coords = ref({
    origin: { lat: null as number | null, lng: null as number | null },
    destination: { lat: null as number | null, lng: null as number | null },
})

const route = ref<RouteState>({
    origin: '',
    destination: '',
    distance: '',
    duration: '',
})

const emit = defineEmits<{
    (e: 'route-confirmed', data: {
        origin: string
        destination: string
        duration: string
        distance: string
    }): void
}>()


let leafletMap: L.Map | null = null
let originMarker: L.Marker | null = null
let destinationMarker: L.Marker | null = null
let routeLayer: L.Polyline | null = null

// Computed para habilitar el botón solo si ambas direcciones están definidas
const isRouteReady = computed(() => {
    return !!(coords.value.origin.lat && coords.value.destination.lat)
})

// Computed para mostrar la información de la ruta solo cuando existe
const hasRouteInfo = computed(() => {
    return !!(route.value.distance && route.value.duration)
})

// Inicialización del mapa
const initializeMap = () => {
    if (!mapRef.value) return

    leafletMap = L.map(mapRef.value).setView([40.4168, -3.7038], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap)

    leafletMap.on('click', onMapClick)

    // Verificar si ya hay coordenadas existentes y establecer marcadores
    updateMapWithExistingCoords()
}

// Actualizar el mapa con coordenadas existentes
const updateMapWithExistingCoords = () => {
    if (!leafletMap) return

    // Comprobar y mostrar el marcador de origen
    if (coords.value.origin.lat && coords.value.origin.lng) {
        if (originMarker) originMarker.remove()
        originMarker = L.marker([coords.value.origin.lat, coords.value.origin.lng])
            .addTo(leafletMap)
            .bindPopup('Origen')
    }

    // Comprobar y mostrar el marcador de destino
    if (coords.value.destination.lat && coords.value.destination.lng) {
        if (destinationMarker) destinationMarker.remove()
        destinationMarker = L.marker([coords.value.destination.lat, coords.value.destination.lng])
            .addTo(leafletMap)
            .bindPopup('Destino')
    }

    // Si ambas coordenadas existen, ajusta la vista para mostrar ambos puntos
    if (coords.value.origin.lat && coords.value.destination.lat) {
        const bounds = L.latLngBounds(
            [coords.value.origin.lat, coords.value.origin.lng!],
            [coords.value.destination.lat, coords.value.destination.lng!]
        )
        leafletMap.fitBounds(bounds, { padding: [50, 50] })
    }
    // Si solo existe una coordenada, enfoca en ella
    else if (coords.value.origin.lat) {
        leafletMap.setView([coords.value.origin.lat, coords.value.origin.lng!], 13)
    }
    else if (coords.value.destination.lat) {
        leafletMap.setView([coords.value.destination.lat, coords.value.destination.lng!], 13)
    }
}

// Manejador de clics en el mapa para establecer los marcadores de origen y destino
const onMapClick = async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng

    // Determinar si configuramos origen o destino basado en lo que falta
    let type: 'origin' | 'destination' = 'origin'

    if (!coords.value.origin.lat) {
        type = 'origin'
    } else if (!coords.value.destination.lat) {
        type = 'destination'
    } else {
        // Si ambos ya están configurados, actualiza el origen por defecto
        type = 'origin'
    }

    // Actualizar coordenadas y marcador
    coords.value[type] = { lat, lng }

    try {
        loading.value = true
        // Obtener dirección del punto y actualizar el campo de texto
        address.value[type] = await reverseGeocode(lat, lng)

        // Actualizar marcador en el mapa
        if (type === 'origin') {
            if (originMarker) originMarker.remove()
            originMarker = L.marker([lat, lng])
                .addTo(leafletMap!)
                .bindPopup('Origen')
                .openPopup()
        } else {
            if (destinationMarker) destinationMarker.remove()
            destinationMarker = L.marker([lat, lng])
                .addTo(leafletMap!)
                .bindPopup('Destino')
                .openPopup()
        }
    } catch (error) {
        console.error('Error al obtener la dirección:', error)
    } finally {
        loading.value = false
    }
}

// Función para geocodificar las direcciones cuando se escribe en los inputs
const geocodeAddress = async (type: 'origin' | 'destination') => {
    const query = address.value[type]
    if (!query || query.length < 3) return // Evitar consultas muy cortas

    try {
        loading.value = true
        await handleNominatimRateLimit() // Añadir un retraso para evitar límites de API

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=es&limit=5`
        const response = await axios.get<NominatimResponse[]>(url)

        if (response.data.length === 0) {
            // No se encontraron resultados
            showNotification(`No se encontró la dirección "${query}". Intenta con una dirección más general o revisa si hay errores.`, 'error')
            return
        }

        // Si hay resultados múltiples y son diferentes, mostrar alternativas
        if (response.data.length > 1) {
            const firstResult = response.data[0]
            const alternatives = response.data.slice(1, 3) // Tomar solo 2 alternativas como máximo

            // Verificar si las alternativas son significativamente diferentes
            const areAlternativesDifferent = alternatives.some((alt: NominatimResponse) => {
                // Comprobar si el nombre del lugar o la ciudad es diferente
                return alt.display_name.split(',')[0] !== firstResult.display_name.split(',')[0]
            })

            if (areAlternativesDifferent) {
                const mainAddress = firstResult.display_name
                const altAddresses = alternatives.map(a => a.display_name).join('\n- ')
                showNotification(`Usando: ${mainAddress}\nAlternativas encontradas:\n- ${altAddresses}`, 'info')
            }
        }

        const { lat, lon } = response.data[0]
        const parsedLat = parseFloat(lat)
        const parsedLng = parseFloat(lon)

        // Actualizar coordenadas
        coords.value[type] = { lat: parsedLat, lng: parsedLng }

        // Actualizar dirección con el resultado completo para mayor precisión
        address.value[type] = response.data[0].display_name.split(',').slice(0, 3).join(',')

        // Actualizar marcador en el mapa
        if (type === 'origin') {
            if (originMarker) originMarker.remove()
            originMarker = L.marker([parsedLat, parsedLng])
                .addTo(leafletMap!)
                .bindPopup('Origen')
                .openPopup()
        } else {
            if (destinationMarker) destinationMarker.remove()
            destinationMarker = L.marker([parsedLat, parsedLng])
                .addTo(leafletMap!)
                .bindPopup('Destino')
                .openPopup()
        }

        // Centrar el mapa en la nueva ubicación
        leafletMap?.setView([parsedLat, parsedLng], 13)
    } catch (error) {
        console.error('Error al geocodificar:', error)
        showNotification('Error al buscar la dirección. Por favor, intenta de nuevo.', 'error')
    } finally {
        loading.value = false
    }
}

// Función para realizar la geocodificación inversa
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
        await handleNominatimRateLimit() // Añadir un retraso para evitar límites de API

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
        const response = await axios.get<NominatimResponse>(url)

        if (!response.data || !response.data.address) {
            showNotification('No se pudo determinar la dirección de esta ubicación', 'error')
            return 'Ubicación desconocida'
        }

        const a: NominatimAddress = response.data.address
        return [a.road || a.street || a.path || '', a.city || a.town || a.village || '', a.country || ''].filter(Boolean).join(', ')
    } catch (error) {
        console.error('Error en reverseGeocode:', error)
        showNotification('Error al obtener la dirección de esta ubicación', 'error')
        return 'Ubicación desconocida'
    }
}

// Función para calcular la ruta entre origen y destino
const calculateRoute = async () => {
    const { origin, destination } = coords.value
    if (!origin.lat || !destination.lat) return

    try {
        loading.value = true
        const response = await axios.post(
            'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
            {
                coordinates: [
                    [origin.lng!, origin.lat!],
                    [destination.lng!, destination.lat!],
                ],
            },
            {
                headers: {
                    Authorization: apiKey,
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.data.features || response.data.features.length === 0) {
            showNotification('No se pudo encontrar una ruta entre estos puntos. Intenta con ubicaciones más cercanas o accesibles por carretera.', 'error')
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
        route.value.origin = address.value.origin
        route.value.destination = address.value.destination

        // Emitimos los datos al padre
        emit('route-confirmed', {
            origin: route.value.origin,
            destination: route.value.destination,
            duration: route.value.duration,
            distance: route.value.distance
        })

        showNotification('¡Ruta calculada correctamente!', 'success')

    } catch (error: any) {
        console.error('Error al calcular la ruta:', error)

        // Detectar tipos específicos de errores
        if (error.response && error.response.status === 403) {
            showNotification('Error de autenticación con el servicio de rutas. Verifica la API key.', 'error')
        } else if (error.response && error.response.status === 400) {
            showNotification('Las ubicaciones seleccionadas no son válidas para calcular una ruta. Intenta con puntos accesibles por carretera.', 'error')
        } else {
            showNotification('Error al calcular la ruta. Por favor, intente con otras ubicaciones.', 'error')
        }
    } finally {
        loading.value = false
    }
}

// Añadir observadores para actualizar el mapa cuando cambian las coordenadas
watch(
    () => [
        { ...coords.value.origin },
        { ...coords.value.destination }
    ],
    () => {
        if (leafletMap) {
            updateMapWithExistingCoords()
        }
    },
    { deep: true }
)

// Observador para las direcciones
watch(
    () => [address.value.origin, address.value.destination],
    ([newOrigin, newDestination], [oldOrigin, oldDestination]) => {
        if (newOrigin !== oldOrigin && newOrigin === '') {
            // Si se borró la dirección de origen, limpiar el marcador
            coords.value.origin = { lat: null, lng: null }
            if (originMarker) {
                originMarker.remove()
                originMarker = null
            }
        }

        if (newDestination !== oldDestination && newDestination === '') {
            // Si se borró la dirección de destino, limpiar el marcador
            coords.value.destination = { lat: null, lng: null }
            if (destinationMarker) {
                destinationMarker.remove()
                destinationMarker = null
            }
        }
    }
)

// Debounce para evitar demasiadas peticiones
const debounce = (fn: Function, delay: number) => {
    let timeout: number | null = null
    return (...args: any[]) => {
        if (timeout) window.clearTimeout(timeout)
        timeout = window.setTimeout(() => {
            fn(...args)
        }, delay) as unknown as number
    }
}

// Versión con debounce de la función geocodeAddress
const debouncedGeocodeAddress = debounce(geocodeAddress, 800)

// Función para mostrar notificaciones
const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    notification.value = {
        message,
        type,
        visible: true
    }

    // Auto-ocultar después de un tiempo
    setTimeout(() => {
        notification.value.visible = false
    }, type === 'error' ? 8000 : 5000) // Mostrar errores por más tiempo
}

// Función para manejar los límites de la API de Nominatim
const handleNominatimRateLimit = () => {
    // Añadir un retraso aleatorio para evitar bloqueos
    const randomDelay = Math.floor(Math.random() * 500) + 500
    return new Promise(resolve => setTimeout(resolve, randomDelay))
}

// Cargar el mapa cuando se monta el componente
onMounted(() => {
    setTimeout(() => {
        initializeMap()
    }, 100) // Pequeño retraso para asegurar que el DOM esté listo
})
</script>

<style scoped>
.map-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
}

.route-info {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
}

.map {
    width: 100%;
    height: 500px;
    border-radius: 8px;
    margin: 15px 0;
    border: 1px solid #ddd;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.route-info input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
}

.confirm-button {
    background-color: #4285f4;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: background-color 0.3s;
}

.confirm-button:hover:not(:disabled) {
    background-color: #3367d6;
}

.confirm-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.route-details {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    margin-top: 15px;
    border-left: 4px solid #4285f4;
}

.route-details p {
    margin: 8px 0;
    font-size: 16px;
}

.loading-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
}

.notification {
    margin: 10px 0;
    padding: 15px;
    border-radius: 4px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    animation: fadeIn 0.3s ease-in;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.notification-content {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex: 1;
}

.notification-icon {
    font-size: 20px;
}

.notification-message {
    flex: 1;
    line-height: 1.4;
}

.notification-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 0 5px;
    color: #666;
}

.notification.info {
    background-color: #e3f2fd;
    border-left: 4px solid #2196f3;
    color: #0d47a1;
}

.notification.error {
    background-color: #ffebee;
    border-left: 4px solid #f44336;
    color: #b71c1c;
}

.notification.success {
    background-color: #e8f5e9;
    border-left: 4px solid #4caf50;
    color: #1b5e20;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(66, 133, 244, 0.3);
    border-radius: 50%;
    border-top-color: #4285f4;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>