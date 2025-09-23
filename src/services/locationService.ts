import { LocationData } from '../types';

export class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationData | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async getCurrentLocation(): Promise<LocationData> {
    const requestPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    const tryWatchPosition = (timeoutMs = 10000): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        let watchId: number | null = null;
        const onSuccess = (pos: GeolocationPosition) => {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          resolve(pos);
        };
        const onError = (err: GeolocationPositionError) => {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          reject(err);
        };
        watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
          enableHighAccuracy: false,
          maximumAge: 300000
        });
        setTimeout(() => {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          reject(new Error('Timed out while watching position'));
        }, timeoutMs);
      });
    };

    return new Promise(async (resolve, reject) => {
      // Secure context check: required by many browsers for geolocation
      const isLocalhost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
      if (!window.isSecureContext && !isLocalhost) {
        reject(new Error('Location requires HTTPS. Please use https or localhost.'));
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const highAccuracy: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      };
      const lowAccuracy: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000
      };

      const returnWithOptionalName = async (latitude: number, longitude: number) => {
        // Return coordinates immediately, try to fetch name without blocking too long
        const base: LocationData = { coordinates: { latitude, longitude } };
        try {
          const name = await Promise.race([
            this.reverseGeocode(latitude, longitude),
            new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 2000))
          ]);
          resolve(name ? { ...base, name } : base);
        } catch {
          resolve(base);
        }
      };

      // Try to provide better diagnostics via Permissions API (best-effort)
      if (navigator.permissions && (navigator.permissions as any).query) {
        (navigator.permissions as any)
          .query({ name: 'geolocation' })
          .then((status: any) => {
            if (status.state === 'denied') {
              reject(new Error('Location permission denied. Enable permissions in browser settings.'));
            }
          })
          .catch(() => {/* ignore */});
      }

      try {
        // 1) Try high accuracy first
        const pos = await requestPosition(highAccuracy);
        const { latitude, longitude } = pos.coords;
        this.currentLocation = { coordinates: { latitude, longitude } };
        await returnWithOptionalName(latitude, longitude);
        return;
      } catch (err1: any) {
        // 2) Fallback to low accuracy
        try {
          const pos2 = await requestPosition(lowAccuracy);
          const { latitude, longitude } = pos2.coords;
          this.currentLocation = { coordinates: { latitude, longitude } };
          await returnWithOptionalName(latitude, longitude);
          return;
        } catch (err2: any) {
          // 3) Last resort: watchPosition briefly
          try {
            const pos3 = await tryWatchPosition(8000);
            const { latitude, longitude } = pos3.coords;
            this.currentLocation = { coordinates: { latitude, longitude } };
            await returnWithOptionalName(latitude, longitude);
            return;
          } catch (err3: any) {
            let message = 'Unable to get your location';
            const error = err1 || err2 || err3;
            if (error && typeof error.code === 'number') {
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  message = 'Location access denied. Please enable location permissions.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  message = 'Location information is unavailable. Try turning on GPS or Wi‑Fi.';
                  break;
                case error.TIMEOUT:
                  message = 'Location request timed out. Try again near a window or outdoors.';
                  break;
              }
            }
            reject(new Error(message));
          }
        }
      }
    });
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      // Extract relevant location information
      const parts = [];
      if (data.locality) parts.push(data.locality);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      if (data.countryName) parts.push(data.countryName);
      
      return parts.length > 0 ? parts.join(', ') : null;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return null;
    }
  }

  getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  clearCachedLocation(): void {
    this.currentLocation = null;
  }

  formatLocationForDisplay(location: LocationData): string {
    if (location.name) {
      return location.name;
    }
    
    if (location.coordinates) {
      const { latitude, longitude } = location.coordinates;
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
    
    return 'Location not available';
  }

  formatCoordinatesForDisplay(coordinates: { latitude: number; longitude: number }): string {
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  }
}

export const locationService = LocationService.getInstance();

