import axios from 'axios';

// OpenWeatherMap API for weather data
const WEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'your_openweather_api_key';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// OpenCage API for geocoding (free tier available)
const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY || 'your_opencage_api_key';
const OPENCAGE_BASE_URL = 'https://api.opencagedata.com/geocode/v1';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  rainIntensity: number; // mm/h
  forecast: {
    date: string;
    temperature: number;
    description: string;
    rainChance: number;
  }[];
}

export interface NearbyHome {
  id: string;
  name: string;
  address: string;
  distance: number; // in meters
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Get current location using browser geolocation API
export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocode(latitude, longitude);
          resolve(locationData);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

// Convert address to coordinates (geocoding)
export async function geocodeAddress(address: string): Promise<LocationData> {
  try {
    const response = await axios.get(OPENCAGE_BASE_URL + '/json', {
      params: {
        q: address,
        key: OPENCAGE_API_KEY,
        limit: 1,
        no_annotations: 1,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const { lat, lng } = result.geometry;
      const components = result.components;

      return {
        latitude: lat,
        longitude: lng,
        address: result.formatted,
        city: components.city || components.town || components.village || '',
        state: components.state || components.county || '',
        country: components.country || '',
        postalCode: components.postcode || '',
      };
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to find address. Please check the address and try again.');
  }
}

// Convert coordinates to address (reverse geocoding)
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationData> {
  try {
    const response = await axios.get(OPENCAGE_BASE_URL + '/json', {
      params: {
        q: `${latitude},${longitude}`,
        key: OPENCAGE_API_KEY,
        limit: 1,
        no_annotations: 1,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const components = result.components;

      return {
        latitude,
        longitude,
        address: result.formatted,
        city: components.city || components.town || components.village || '',
        state: components.state || components.county || '',
        country: components.country || '',
        postalCode: components.postcode || '',
      };
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to get address from location');
  }
}

// Get weather data for a location
export async function getWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    // Current weather
    const currentResponse = await axios.get(`${WEATHER_BASE_URL}/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'metric',
      },
    });

    // 5-day forecast
    const forecastResponse = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'metric',
      },
    });

    const current = currentResponse.data;
    const forecast = forecastResponse.data;

    // Calculate rain intensity (simplified)
    const rainIntensity = current.rain ? current.rain['1h'] || 0 : 0;

    return {
      temperature: current.main.temp,
      humidity: current.main.humidity,
      pressure: current.main.pressure,
      windSpeed: current.wind.speed,
      windDirection: current.wind.deg,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      rainIntensity,
      forecast: forecast.list.slice(0, 5).map((item: any) => ({
        date: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        description: item.weather[0].description,
        rainChance: item.pop * 100, // Probability of precipitation
      })),
    };
  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error('Failed to fetch weather data');
  }
}

// Find nearby homes within a certain radius
export async function findNearbyHomes(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<NearbyHome[]> {
  try {
    // This would typically fetch from your database
    // For now, we'll return mock data
    const mockHomes: NearbyHome[] = [
      {
        id: '1',
        name: 'Green Villa',
        address: '123 Oak Street, Springfield',
        distance: 250,
        coordinates: { latitude: latitude + 0.001, longitude: longitude + 0.001 },
      },
      {
        id: '2',
        name: 'Blue House',
        address: '456 Pine Avenue, Springfield',
        distance: 1200,
        coordinates: { latitude: latitude + 0.005, longitude: longitude - 0.002 },
      },
      {
        id: '3',
        name: 'Red Cottage',
        address: '789 Maple Drive, Springfield',
        distance: 3200,
        coordinates: { latitude: latitude - 0.003, longitude: longitude + 0.004 },
      },
    ];

    // Filter homes within radius
    const nearbyHomes = mockHomes.filter((home) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        home.coordinates.latitude,
        home.coordinates.longitude
      );
      return distance <= radiusKm * 1000; // Convert km to meters
    });

    // Sort by distance
    return nearbyHomes.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error finding nearby homes:', error);
    return [];
  }
}

// Validate if an address is in a supported area
export function validateAddressSupport(address: string): boolean {
  // This could check against a database of supported areas
  // For now, we'll do basic validation
  const supportedKeywords = [
    'springfield',
    'oak',
    'pine',
    'maple',
    'main',
    'street',
    'avenue',
    'drive',
    'road',
  ];

  return supportedKeywords.some((keyword) =>
    address.toLowerCase().includes(keyword)
  );
}