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
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Define la estructura de coordenadas geográficas
interface Coordinates {
    lat: number | null;
    lng: number | null;
}

// Estado de las direcciones de texto ingresadas por el usuario
interface AddressState {
    origin: string;
    destination: string;
}

// Estado del sistema de notificaciones
interface NotificationState {
    message: string;
    type: 'info' | 'error' | 'success';
    visible: boolean;
}

// Respuesta de la API de geocodificación Nominatim
interface NominatimResponse {
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        road?: string;
        street?: string;
        path?: string;
        city?: string;
        town?: string;
        village?: string;
        country?: string;
        [key: string]: string | undefined;
    };
}

// Props: recibe datos de ruta existente del componente padre
const props = defineProps<{
    initialRoute?: {
        location: {
            origin: string;
            destination: string;
        };
        distance: string;
        duration: string;
    } | null;
}>()

// Emit: comunica datos de ruta calculada al componente padre
const emit = defineEmits<{
    (e: 'route-confirmed', data: {
        origin: string
        destination: string
        duration: string
        distance: string
    }): void
}>()

const mapRef = ref<HTMLElement | null>(null) // Referencia al elemento DOM del mapa
const apiKey = '5b3ce3597851110001cf62483f8191c887b24389bc8fbfa5b3f59671' // API key para OpenRouteService
const loading = ref(false) // Estado de carga global
const notification = ref<NotificationState>({ message: '', type: 'info', visible: false }) // Sistema de notificaciones
const address = ref<AddressState>({ origin: '', destination: '' }) // Direcciones de texto
const coords = ref({
    origin: { lat: null as number | null, lng: null as number | null },
    destination: { lat: null as number | null, lng: null as number | null },
}) // Coordenadas geográficas
const route = ref({
    origin: '',
    destination: '',
    distance: '',
    duration: '',
}) // Datos de la ruta calculada

// Referencias a elementos del mapa que se manejan imperativamente
let leafletMap: L.Map | null = null
let originMarker: L.Marker | null = null
let destinationMarker: L.Marker | null = null
let routeLayer: L.Polyline | null = null

// Verifica si hay datos de ruta existente del componente padre
const existingRouteData = computed(() => {
    return props.initialRoute &&
        props.initialRoute.location &&
        props.initialRoute.location.origin &&
        props.initialRoute.location.destination
})

// Determina si se puede calcular una ruta (ambas coordenadas están disponibles)
const isRouteReady = computed(() => {
    return !!(coords.value.origin.lat && coords.value.destination.lat)
})

// Configura el mapa Leaflet y sus event listeners
const initializeMap = () => {
    if (!mapRef.value) return

    // Crear instancia del mapa centrado en Madrid
    leafletMap = L.map(mapRef.value).setView([40.4168, -3.7038], 6)
    
    // Agregar capa de tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap)

    // Event listener para clics en el mapa
    leafletMap.on('click', onMapClick)
    
    // Actualizar mapa con coordenadas existentes si las hay
    updateMapWithExistingCoords()
}

// Procesa y carga datos de ruta existente cuando el componente recibe props iniciales
const loadExistingRouteData = async () => {
    if (!existingRouteData.value) return

    try {
        loading.value = true

        // Copiar datos de la prop inicial al estado local
        address.value.origin = props.initialRoute!.location.origin
        address.value.destination = props.initialRoute!.location.destination
        route.value.origin = props.initialRoute!.location.origin
        route.value.destination = props.initialRoute!.location.destination
        route.value.distance = props.initialRoute!.distance
        route.value.duration = props.initialRoute!.duration

        // Convertir direcciones de texto a coordenadas
        await geocodeAddress('origin', true)
        await geocodeAddress('destination', true)

        // Dibujar la ruta en el mapa si ambas coordenadas están disponibles
        if (coords.value.origin.lat && coords.value.destination.lat) {
            await calculateRoute(true)
        }
    } catch (error) {
        console.error('Error al cargar datos de ruta existente:', error)
        showNotification('No se pudieron cargar los datos de la ruta existente', 'error')
    } finally {
        loading.value = false
    }
}

// Actualiza marcadores y vista del mapa basado en las coordenadas actuales
const updateMapWithExistingCoords = () => {
    if (!leafletMap) return

    // Crear/actualizar marcador de origen
    if (coords.value.origin.lat && coords.value.origin.lng) {
        if (originMarker) originMarker.remove()
        originMarker = L.marker([coords.value.origin.lat, coords.value.origin.lng])
            .addTo(leafletMap)
            .bindPopup('Origen')
    }

    // Crear/actualizar marcador de destino
    if (coords.value.destination.lat && coords.value.destination.lng) {
        if (destinationMarker) destinationMarker.remove()
        destinationMarker = L.marker([coords.value.destination.lat, coords.value.destination.lng])
            .addTo(leafletMap)
            .bindPopup('Destino')
    }

    // Ajustar la vista del mapa para mostrar ambos puntos o uno si solo hay uno
    if (coords.value.origin.lat && coords.value.destination.lat) {
        const bounds = L.latLngBounds(
            [coords.value.origin.lat, coords.value.origin.lng!],
            [coords.value.destination.lat, coords.value.destination.lng!]
        )
        leafletMap.fitBounds(bounds, { padding: [50, 50] })
    } else if (coords.value.origin.lat) {
        leafletMap.setView([coords.value.origin.lat, coords.value.origin.lng!], 13)
    } else if (coords.value.destination.lat) {
        leafletMap.setView([coords.value.destination.lat, coords.value.destination.lng!], 13)
    }
}

// Maneja clics del usuario en el mapa para establecer origen/destino
const onMapClick = async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng

    // Lógica para determinar si el clic establece origen o destino
    // Si no hay origen, establece origen; si no hay destino, establece destino; si ambos existen, reemplaza origen
    let type: 'origin' | 'destination' = !coords.value.origin.lat ? 'origin' :
        !coords.value.destination.lat ? 'destination' : 'origin'

    // Actualizar coordenadas en el estado
    coords.value[type] = { lat, lng }

    try {
        loading.value = true
        // Convertir coordenadas a dirección legible (geocodificación inversa)
        address.value[type] = await reverseGeocode(lat, lng)

        // Crear y mostrar marcador en el mapa
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

// Convierte direcciones de texto a coordenadas usando la API de Nominatim
const geocodeAddress = async (type: 'origin' | 'destination', skipNotification: boolean = false) => {
    const query = address.value[type]
    if (!query || query.length < 3) return // Validación mínima de entrada

    try {
        loading.value = true
        await handleNominatimRateLimit() // Respetar límites de la API

        // Llamada a la API de geocodificación
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=es&limit=5`
        const response = await axios.get<NominatimResponse[]>(url)

        if (response.data.length === 0) {
            if (!skipNotification) {
                showNotification(`No se encontró la dirección "${query}". Intenta con una dirección más general o revisa si hay errores.`, 'error')
            }
            return
        }

        // Mostrar alternativas al usuario si hay múltiples resultados significativamente diferentes
        if (response.data.length > 1 && !skipNotification) {
            const firstResult = response.data[0]
            const alternatives = response.data.slice(1, 3)

            // Verificar si las alternativas son realmente diferentes
            const areAlternativesDifferent = alternatives.some((alt: NominatimResponse) => {
                return alt.display_name.split(',')[0] !== firstResult.display_name.split(',')[0]
            })

            if (areAlternativesDifferent) {
                const mainAddress = firstResult.display_name
                const altAddresses = alternatives.map(a => a.display_name).join('\n- ')
                showNotification(`Usando: ${mainAddress}\nAlternativas encontradas:\n- ${altAddresses}`, 'info')
            }
        }

        // Procesar el resultado principal y actualizar el estado
        const { lat, lon } = response.data[0]
        const parsedLat = parseFloat(lat)
        const parsedLng = parseFloat(lon)

        coords.value[type] = { lat: parsedLat, lng: parsedLng }

        // Simplificar la dirección mostrada al usuario
        if (!skipNotification) {
            address.value[type] = response.data[0].display_name.split(',').slice(0, 3).join(',')
        }

        // Crear/actualizar marcador en el mapa
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

        // Centrar mapa en la nueva ubicación
        leafletMap?.setView([parsedLat, parsedLng], 13)
    } catch (error) {
        console.error('Error al geocodificar:', error)
        if (!skipNotification) {
            showNotification('Error al buscar la dirección. Por favor, intenta de nuevo.', 'error')
        }
    } finally {
        loading.value = false
    }
}

// Convierte coordenadas a direcciones legibles
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
        await handleNominatimRateLimit()

        // Llamada a la API de geocodificación inversa
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
        const response = await axios.get<NominatimResponse>(url)

        if (!response.data || !response.data.address) {
            showNotification('No se pudo determinar la dirección de esta ubicación', 'error')
            return 'Ubicación desconocida'
        }

        // Construir dirección legible desde los componentes de dirección
        const a = response.data.address
        return [a.road || a.street || a.path || '', a.city || a.town || a.village || '', a.country || ''].filter(Boolean).join(', ')
    } catch (error) {
        console.error('Error en reverseGeocode:', error)
        showNotification('Error al obtener la dirección de esta ubicación', 'error')
        return 'Ubicación desconocida'
    }
}

// Calcula la ruta entre origen y destino usando OpenRouteService
const calculateRoute = async (skipNotification: boolean = false) => {
    const { origin, destination } = coords.value
    if (!origin.lat || !destination.lat) return

    try {
        loading.value = true
        
        // Llamada a la API de cálculo de rutas
        const response = await axios.post(
            'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
            {
                coordinates: [
                    [origin.lng!, origin.lat!], // Nota: OpenRouteService usa [lng, lat]
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
            if (!skipNotification) {
                showNotification('No se pudo encontrar una ruta entre estos puntos. Intenta con ubicaciones más cercanas o accesibles por carretera.', 'error')
            }
            return
        }

        // Procesar datos de la ruta obtenida
        const feature = response.data.features[0]
        const summary = feature.properties.summary
        const coordsList = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]]) // Convertir de [lng, lat] a [lat, lng]

        // Dibujar la ruta en el mapa
        if (routeLayer) leafletMap?.removeLayer(routeLayer)
        routeLayer = L.polyline(coordsList, { color: 'blue', weight: 5 }).addTo(leafletMap!)
        leafletMap?.fitBounds(L.latLngBounds(coordsList), { padding: [50, 50] })

        // Actualizar información de distancia y duración
        if (!existingRouteData.value || !skipNotification) {
            route.value.distance = `${(summary.distance / 1000).toFixed(2)} km`
            const mins = Math.round(summary.duration / 60)
            const hrs = Math.floor(mins / 60)
            route.value.duration = hrs ? `${hrs} h ${mins % 60} min` : `${mins} min`
        }

        route.value.origin = address.value.origin
        route.value.destination = address.value.destination

        // Comunicar datos de ruta al componente padre
        emit('route-confirmed', {
            origin: route.value.origin,
            destination: route.value.destination,
            duration: route.value.duration,
            distance: route.value.distance
        })

        if (!skipNotification) {
            showNotification(existingRouteData.value ? '¡Ruta actualizada correctamente!' : '¡Ruta calculada correctamente!', 'success')
        }

    } catch (error: any) {
        console.error('Error al calcular la ruta:', error)
        if (!skipNotification) {
            // Manejo específico de errores de la API
            if (error.response?.status === 403) {
                showNotification('Error de autenticación con el servicio de rutas. Verifica la API key.', 'error')
            } else if (error.response?.status === 400) {
                showNotification('Las ubicaciones seleccionadas no son válidas para calcular una ruta. Intenta con puntos accesibles por carretera.', 'error')
            } else {
                showNotification('Error al calcular la ruta. Por favor, intente con otras ubicaciones.', 'error')
            }
        }
    } finally {
        loading.value = false
    }
}

// Observa cambios en coordenadas para actualizar el mapa automáticamente
watch(
    [() => coords.value.origin, () => coords.value.destination],
    () => {
        if (leafletMap) {
            updateMapWithExistingCoords()
        }
    },
    { deep: true }
)

// Observa cuando el usuario borra direcciones para limpiar coordenadas y marcadores correspondientes
watch(
    [() => address.value.origin, () => address.value.destination],
    ([newOrigin, newDestination], [oldOrigin, oldDestination]) => {
        // Limpiar origen si se borra la dirección
        if (newOrigin !== oldOrigin && newOrigin === '') {
            coords.value.origin = { lat: null, lng: null }
            if (originMarker) {
                originMarker.remove()
                originMarker = null
            }
        }

        // Limpiar destino si se borra la dirección
        if (newDestination !== oldDestination && newDestination === '') {
            coords.value.destination = { lat: null, lng: null }
            if (destinationMarker) {
                destinationMarker.remove()
                destinationMarker = null
            }
        }
    }
)

// Implementa debounce para evitar llamadas excesivas a la API durante escritura
const debounce = (fn: Function, delay: number) => {
    let timeout: number | null = null
    return (...args: any[]) => {
        if (timeout) window.clearTimeout(timeout)
        timeout = window.setTimeout(() => {
            fn(...args)
        }, delay) as unknown as number
    }
}

// Versión debounced de geocodeAddress para usar en el input
const debouncedGeocodeAddress = debounce((type: 'origin' | 'destination') => geocodeAddress(type), 800)

// Sistema centralizado de notificaciones al usuario
const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    notification.value = {
        message,
        type,
        visible: true
    }

    // Auto-ocultar notificación después de un tiempo (más tiempo para errores)
    setTimeout(() => {
        notification.value.visible = false
    }, type === 'error' ? 8000 : 5000)
}

// Manejo de límites de velocidad de la API de Nominatim
const handleNominatimRateLimit = () => {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 500) + 500))
}

// Hook de montaje: inicializa el mapa y carga datos existentes si los hay
onMounted(() => {
    // Pequeño delay para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
        initializeMap()
        if (existingRouteData.value) {
            loadExistingRouteData()
        }
    }, 100)
})
</script>