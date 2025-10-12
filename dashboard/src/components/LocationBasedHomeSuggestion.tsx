import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Home,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  CloudRain,
  Thermometer,
  Wind,
  Eye,
  Navigation,
  Loader2,
} from 'lucide-react';
import {
  getCurrentLocation,
  geocodeAddress,
  getWeatherData,
  findNearbyHomes,
  validateAddressSupport,
  LocationData,
  WeatherData,
  NearbyHome,
} from '../services/geolocation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface LocationBasedHomeSuggestionProps {
  onHomeAdded?: (homeData: any) => void;
  onClose?: () => void;
}

const LocationBasedHomeSuggestion: React.FC<LocationBasedHomeSuggestionProps> = ({
  onHomeAdded,
  onClose,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'location' | 'weather' | 'nearby' | 'confirm'>('location');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Location data
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [nearbyHomes, setNearbyHomes] = useState<NearbyHome[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [homeName, setHomeName] = useState('');

  // Auto-detect location on component mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await getCurrentLocation();
      setLocationData(location);
      setSelectedAddress(location.address);
      setHomeName(`${location.city} Home`);
      
      // Get weather data
      const weather = await getWeatherData(location.latitude, location.longitude);
      setWeatherData(weather);
      
      // Find nearby homes
      const nearby = await findNearbyHomes(location.latitude, location.longitude);
      setNearbyHomes(nearby);
      
      if (nearby.length > 0) {
        setStep('nearby');
      } else {
        setStep('weather');
      }
    } catch (error: any) {
      setError(error.message);
      setStep('location');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Validate address support
      if (!validateAddressSupport(selectedAddress)) {
        setError('This area is not yet supported. Please try a different address.');
        return;
      }

      const location = await geocodeAddress(selectedAddress);
      setLocationData(location);
      setHomeName(`${location.city} Home`);

      // Get weather data
      const weather = await getWeatherData(location.latitude, location.longitude);
      setWeatherData(weather);

      // Find nearby homes
      const nearby = await findNearbyHomes(location.latitude, location.longitude);
      setNearbyHomes(nearby);

      if (nearby.length > 0) {
        setStep('nearby');
      } else {
        setStep('weather');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHome = async () => {
    if (!user || !locationData) return;

    setLoading(true);
    try {
      // Create home in database
      const { data: home, error } = await supabase
        .from('homes')
        .insert({
          user_id: user.id,
          name: homeName,
          address: locationData.address,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
        })
        .select()
        .single();

      if (error) throw error;

      // Create town if it doesn't exist
      const { data: town, error: townError } = await supabase
        .from('towns')
        .upsert({
          name: locationData.city,
          state: locationData.state,
          country: locationData.country,
        })
        .select()
        .single();

      if (townError) throw townError;

      // Update home with town_id
      await supabase
        .from('homes')
        .update({ town_id: town.id })
        .eq('id', home.id);

      onHomeAdded?.(home);
      setStep('confirm');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLocationStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <MapPin className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Add Your Home Location
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Enter your address to get weather data and connect with nearby homes
        </p>
      </div>

      <form onSubmit={handleAddressSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Home Address
          </label>
          <input
            type="text"
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            placeholder="Enter your full address..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={detectLocation}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <Navigation className="h-4 w-4" />
            Use Current Location
          </button>
          <button
            type="submit"
            disabled={loading || !selectedAddress.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            Find Location
          </button>
        </div>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderWeatherStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <CloudRain className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Weather Information
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Current weather conditions for your location
        </p>
      </div>

      {weatherData && (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{weatherData.temperature.toFixed(1)}°C</div>
              <div className="text-sm opacity-90 capitalize">{weatherData.description}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{weatherData.rainIntensity.toFixed(1)} mm/h</div>
              <div className="text-sm opacity-90">Rain Intensity</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Thermometer className="h-5 w-5 mx-auto mb-1" />
              <div className="text-sm opacity-90">Humidity</div>
              <div className="font-semibold">{weatherData.humidity}%</div>
            </div>
            <div>
              <Wind className="h-5 w-5 mx-auto mb-1" />
              <div className="text-sm opacity-90">Wind</div>
              <div className="font-semibold">{weatherData.windSpeed} m/s</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Pressure</div>
              <div className="font-semibold">{weatherData.pressure} hPa</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep('location')}
          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep('nearby')}
          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );

  const renderNearbyStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <Home className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Nearby Homes Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          We found {nearbyHomes.length} homes near your location. Would you like to join this community?
        </p>
      </div>

      <div className="space-y-3">
        {nearbyHomes.map((home, index) => (
          <motion.div
            key={home.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{home.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{home.address}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {home.distance < 1000 
                    ? `${home.distance}m away` 
                    : `${(home.distance / 1000).toFixed(1)}km away`
                  }
                </p>
              </div>
              <Eye className="h-5 w-5 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Join the Community
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              By adding your home, you'll be able to see water usage patterns, share resources, 
              and get community alerts about water management.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('weather')}
          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep('confirm')}
          className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Add My Home
        </button>
      </div>
    </motion.div>
  );

  const renderConfirmStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Home Added Successfully!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your home has been added to the water management system.
        </p>
      </div>

      {locationData && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Home Details</h3>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <p><strong>Name:</strong> {homeName}</p>
            <p><strong>Address:</strong> {locationData.address}</p>
            <p><strong>City:</strong> {locationData.city}, {locationData.state}</p>
            {nearbyHomes.length > 0 && (
              <p><strong>Nearby Homes:</strong> {nearbyHomes.length} found</p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Continue to Dashboard
      </button>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Add New Home
            </h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'location' && renderLocationStep()}
            {step === 'weather' && renderWeatherStep()}
            {step === 'nearby' && renderNearbyStep()}
            {step === 'confirm' && renderConfirmStep()}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LocationBasedHomeSuggestion;