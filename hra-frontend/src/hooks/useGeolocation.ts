import { useState, useCallback } from 'react';

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number; // metres
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  getLocation: () => Promise<GeoPosition>;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback((): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported by your browser.';
        setError(err);
        reject(new Error(err));
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GeoPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setPosition(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let msg = 'Unable to get your location.';
          if (err.code === err.PERMISSION_DENIED) msg = 'Location permission denied. Please allow location access.';
          else if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location information is unavailable.';
          else if (err.code === err.TIMEOUT) msg = 'Location request timed out. Please try again.';
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  return { position, error, loading, getLocation };
};
