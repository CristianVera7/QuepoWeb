import { Request, Response, NextFunction } from 'express'
import axios, { AxiosError } from 'axios';

// Configurar una instancia de axios con timeout y retry
const nominatimClient = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 10000, // 10 segundos
  headers: {
    'User-Agent': 'TuApp/1.0 (tu-email@ejemplo.com)' // Nominatim recomienda incluir contacto
  }
});

// Interfaz para tipar la respuesta de Nominatim
interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
}

async function geocode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q } = req.query;
    
    // Validación más robusta
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({
        message: 'Parámetro de búsqueda "q" es requerido y no puede estar vacío.',
        ok: false
      });
      return;
    }

    // Sanitizar la entrada
    const query = q.trim();
    
    // Validar longitud máxima para evitar abusos
    if (query.length > 200) {
      res.status(400).json({
        message: 'La consulta no puede exceder 200 caracteres.',
        ok: false
      });
      return;
    }

    const response = await nominatimClient.get<NominatimResult[]>('/search', {
      params: {
        format: 'json',
        q: query,
        'accept-language': 'es',
        limit: 5,
        addressdetails: 1, // Incluir detalles de dirección
        extratags: 0, // No incluir tags extra para reducir payload
        namedetails: 0 // No incluir detalles de nombres
      }
    });

    // Transformar la respuesta para incluir solo datos necesarios
    const results = response.data.map(item => ({
      id: item.place_id,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name,
      type: item.type,
      importance: item.importance
    }));

    res.status(200).json({
      ok: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error en geocodificación:', error);

    // Manejo específico de errores de axios
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        res.status(408).json({
          message: 'Timeout en la consulta de geocodificación',
          ok: false
        });
        return;
      }

      if (error.response) {
        // El servidor respondió con un error
        res.status(error.response.status).json({
          message: 'Error del servicio de geocodificación',
          ok: false
        });
        return;
      }

      if (error.request) {
        // No se pudo contactar con el servidor
        res.status(503).json({
          message: 'Servicio de geocodificación no disponible',
          ok: false
        });
        return;
      }
    }

    // Error genérico
    res.status(500).json({
      message: 'Error interno en geocodificación',
      ok: false
    });
  }
}

// Agregar a tu controlador de mapas
async function reverseGeocode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
      res.status(400).json({
        message: 'Parámetros "lat" y "lon" son requeridos.',
        ok: false
      });
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({
        message: 'Las coordenadas deben ser números válidos.',
        ok: false
      });
      return;
    }

    const response = await nominatimClient.get('/reverse', {
      params: {
        format: 'json',
        lat: latitude,
        lon: longitude,
        addressdetails: 1,
        'accept-language': 'es'
      }
    });

    res.status(200).json(response.data);

  } catch (error) {
    console.error('Error en reverse geocoding:', error);
    res.status(500).json({
      message: 'Error en geocodificación inversa',
      ok: false
    });
  }
}

export default { geocode, reverseGeocode };