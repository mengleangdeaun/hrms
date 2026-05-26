import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getDeviceId } from '../utils/device';
import { pwaFetch } from '@/lib/pwa-fetch';
import { isEmployeeAppRoute } from '@/utils/routeHelper';

interface GeolocationState {
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
    isPrecise: boolean;
    timestamp: number | null;
}

interface AttendanceContextType {
    location: GeolocationState;
    isWarmingUp: boolean;
    error: string | null;
    requestWarmup: () => void;
    syncQueue: () => Promise<void>;
    startWatching: () => void;
    stopWatching: () => void;
    permissions: {
        location: 'granted' | 'denied' | 'prompt';
        camera: 'granted' | 'denied' | 'prompt';
    };
    checkPermissions: (cameraGranted?: boolean) => Promise<void>;
    requestLocationPermission: () => Promise<boolean>;
    todayShift: any | null;
    fetchTodayShift: () => Promise<void>;
    setTodayShift: (data: any) => void;
    deviceId: string;
    rebindDevice: (force?: boolean) => Promise<boolean>;
    refreshLocation: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation('pwa');
    const [location, setLocation] = useState<GeolocationState>({
        lat: null,
        lng: null,
        accuracy: null,
        isPrecise: false,
        timestamp: null,
    });
    const [isWarmingUp, setIsWarmingUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<AttendanceContextType['permissions']>(() => {
        if (typeof window === 'undefined') return { location: 'prompt', camera: 'prompt' };
        const cached = localStorage.getItem('pwa_permission_cache');
        let initial = { location: 'prompt' as const, camera: 'prompt' as const };
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                initial.location = parsed.location || 'prompt';
                initial.camera = parsed.camera || 'prompt';
            } catch (e) {
                console.warn('Failed to parse cached permissions', e);
            }
        }
        return initial;
    });
    const [todayShift, setTodayShift] = useState<any | null>(null);
    const [deviceId] = useState(() => getDeviceId());
    const watchIdRef = useRef<number | null>(null);

    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported');
            setIsWarmingUp(false);
            return;
        }

        if (watchIdRef.current !== null) {
            console.log('📡 GPS already watching...');
            return;
        }

        console.log('📡 Starting GPS watch...');
        setIsWarmingUp(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const accuracy = pos.coords.accuracy;
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: accuracy,
                    isPrecise: accuracy < 100, // Threshold for "Precise" location
                    timestamp: pos.timestamp,
                });
                setIsWarmingUp(false);
                setError(null);
                
                // Update permission state and persist so next launch skips the banner
                setPermissions(prev => {
                    const newState = { ...prev, location: 'granted' as const };
                    localStorage.setItem('pwa_permission_cache', JSON.stringify(newState));
                    return newState;
                });
            },
            (err) => {
                console.warn('Geolocation Error:', err);
                if (err.code === 1) { // Permission Denied
                    setError('LOCATION_PERMISSION_DENIED');
                    setPermissions(prev => ({ ...prev, location: 'denied' }));
                } else if (err.code === 2) {
                    setError('LOCATION_UNAVAILABLE');
                } else if (err.code === 3) {
                    setError('LOCATION_TIMEOUT');
                } else {
                    setError('LOCATION_ERROR');
                }
                setIsWarmingUp(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000, 
                maximumAge: 0, 
            }
        );
    }, []);

    const refreshLocation = useCallback(async () => {
        setIsWarmingUp(true);
        return new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const accuracy = pos.coords.accuracy;
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: accuracy,
                        isPrecise: accuracy < 100,
                        timestamp: pos.timestamp,
                    });
                    setIsWarmingUp(false);
                    setError(null);
                    setPermissions(prev => ({ ...prev, location: 'granted' }));
                    resolve();
                },
                (err) => {
                    console.warn('Location refresh error:', err);
                    setIsWarmingUp(false);
                    resolve();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }, []);

    const checkPermissions = useCallback(async (cameraGranted?: boolean) => {
        try {
            let locationState: 'granted' | 'denied' | 'prompt' = 'prompt';
            let cameraState: 'granted' | 'denied' | 'prompt' = 'prompt';

            if ('permissions' in navigator) {
                // Check Geolocation
                try {
                    const geoPerm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                    locationState = geoPerm.state as any;
                    
                    // Only update if it's a definitive state or if we're changing from prompt
                    setPermissions(prev => {
                        const newState = { ...prev, location: locationState };
                        localStorage.setItem('pwa_permission_cache', JSON.stringify(newState));
                        return newState;
                    });

                    geoPerm.onchange = () => {
                        setPermissions(prev => {
                            const newState = { ...prev, location: geoPerm.state as any };
                            localStorage.setItem('pwa_permission_cache', JSON.stringify(newState));
                            return newState;
                        });
                    };
                } catch (e) {
                    console.warn('Geolocation permission query unsupported');
                }

                // Check Camera
                try {
                    const camPerm = await navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => null);
                    if (camPerm) {
                        cameraState = camPerm.state as any;
                        
                        setPermissions(prev => {
                            const newState = { ...prev, camera: cameraState };
                            localStorage.setItem('pwa_permission_cache', JSON.stringify(newState));
                            return newState;
                        });

                        camPerm.onchange = () => {
                            setPermissions(prev => {
                                const newState = { ...prev, camera: camPerm.state as any };
                                localStorage.setItem('pwa_permission_cache', JSON.stringify(newState));
                                return newState;
                            });
                        };
                    } else if (cameraGranted) {
                        cameraState = 'granted';
                    }
                } catch (e) {
                    console.warn('Camera permission query unsupported');
                    if (cameraGranted) cameraState = 'granted';
                }
            } else if (cameraGranted) {
                cameraState = 'granted';
            }

            // Final sync for UI consistency
            if (cameraGranted || locationState !== 'prompt') {
                setPermissions(prev => {
                    const newState = {
                        location: locationState !== 'prompt' ? locationState : prev.location,
                        camera: cameraState !== 'prompt' ? cameraState : (cameraGranted ? 'granted' : prev.camera)
                    };
                    localStorage.setItem('pwa_permission_cache', JSON.stringify(newState));
                    return newState;
                });
            }
        } catch (e) {
            console.warn('Permission check failed', e);
        }
    }, []);

    const requestLocationPermission = useCallback(async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                setError('Geolocation not supported');
                resolve(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        isPrecise: pos.coords.accuracy < 100,
                        timestamp: pos.timestamp,
                    });
                    setPermissions(prev => {
                        const newState = { ...prev, location: 'granted' as const };
                        localStorage.setItem('pwa_permission_cache', JSON.stringify(newState));
                        return newState;
                    });
                    setError(null);
                    resolve(true);
                },
                (err) => {
                    console.warn('Location request error:', err);
                    if (err.code === 1) { // Permission Denied
                        setPermissions(prev => {
                            const newState = { ...prev, location: 'denied' as const };
                            localStorage.setItem('pwa_permission_cache', JSON.stringify(newState));
                            return newState;
                        });
                    }
                    resolve(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }, []);

    const requestWarmup = useCallback(() => {
        if (permissions.location === 'granted') {
            startWatching();
        } else {
            requestLocationPermission();
        }
    }, [permissions.location, startWatching, requestLocationPermission]);

    const fetchTodayShift = useCallback(async () => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) return;

        try {
            const res = await pwaFetch('/api/employee-app/attendance/shift-today', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setTodayShift(data);
                
                // Auto-bind device if unbound (Silent binding on first use)
                if (data.device_binding?.status === 'unbound') {
                    const bindRes = await pwaFetch('/api/employee-app/attendance/device-bind', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ device_id: deviceId })
                    });

                    if (!bindRes.ok) {
                        const bindData = await bindRes.json();
                        if (bindData.code === 'DEVICE_TAKEN') {
                            toast.error(bindData.message || t('device_taken_error', 'This device is already registered to another account.'));
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch today shift', e);
        }
    }, [deviceId]);

    const rebindDevice = useCallback(async (force = true) => {
        const token = localStorage.getItem('employee_auth_token');
        if (!token) return false;

        try {
            const res = await pwaFetch('/api/employee-app/attendance/device-bind', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ device_id: deviceId, force })
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success(t('device_bound_success', 'Device successfully registered to your account'));
                fetchTodayShift();
                return true;
            } else {
                if (data.code === 'DEVICE_TAKEN') {
                    toast.error(data.message || t('device_taken_error', 'This device is already registered to another account.'));
                } else {
                    toast.error(data.message || t('device_bind_failed', 'Failed to register device'));
                }
                return false;
            }
        } catch (e) {
            console.error('Device re-bind error', e);
            toast.error(t('network_error', 'Network error occurred'));
            return false;
        }
    }, [deviceId, fetchTodayShift, t]);

    const syncQueue = useCallback(async () => {
        const queueString = localStorage.getItem('attendance_sync_queue');
        if (!queueString) return;

        let queue = JSON.parse(queueString);
        if (queue.length === 0) return;

        const authToken = localStorage.getItem('employee_auth_token');
        if (!authToken) return;

        const successfulIndices: number[] = [];

        for (let i = 0; i < queue.length; i++) {
            const scan = queue[i];
            try {
                const body: any = {
                    ...scan,
                    auth_token: authToken
                };

                // Ensure we don't send nulls that might trigger validation errors
                if (body.payload === null) delete body.payload;
                if (body.branch_code === null) delete body.branch_code;

                const res = await pwaFetch('/api/employee-app/attendance/clock-in', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(body),
                });

                if (res.ok) {
                    successfulIndices.push(i);
                }
            } catch (e) {
                console.warn('Sync failed for item', i, e);
            }
        }

        // Remove successful items
        if (successfulIndices.length > 0) {
            queue = queue.filter((_: any, index: number) => !successfulIndices.includes(index));
            localStorage.setItem('attendance_sync_queue', JSON.stringify(queue));
            toast.success(`Synced ${successfulIndices.length} offline scans`);
        }
    }, []);

    useEffect(() => {
        checkPermissions();
        fetchTodayShift();
        
        const path = window.location.pathname;
        const isPwa = isEmployeeAppRoute(path);
        
        const tryStart = async () => {
            if (isPwa) {
                // Check if already granted
                if ('permissions' in navigator) {
                    const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                    if (res.state === 'granted') {
                        startWatching();
                    }
                } else {
                    // Fallback for browsers that don't support permission query
                    startWatching();
                }
            }
        };

        tryStart();
        
        // Interval for offline sync
        const interval = setInterval(syncQueue, 60000);
        
        // We still listen to 'online' here to trigger an immediate sync
        window.addEventListener('online', syncQueue);

        // Visibility change listener: Restart watch if app returns to foreground
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isPwa) {
                console.log('📱 App visible, refreshing GPS...');
                stopWatching();
                startWatching();
            }
        };
        window.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopWatching();
            clearInterval(interval);
            window.removeEventListener('online', syncQueue);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [startWatching, stopWatching, checkPermissions, syncQueue, fetchTodayShift]);

    return (
        <AttendanceContext.Provider value={{ 
            location, 
            isWarmingUp, 
            error, 
            requestWarmup, 
            syncQueue, 
            startWatching, 
            stopWatching,
            permissions,
            checkPermissions,
            requestLocationPermission,
            todayShift,
            fetchTodayShift,
            setTodayShift,
            deviceId,
            rebindDevice,
            refreshLocation
        }}>
            {children}
        </AttendanceContext.Provider>
    );
};

export const useAttendance = () => {
    const context = useContext(AttendanceContext);
    if (!context) {
        return {
            location: { lat: null, lng: null, accuracy: null, isPrecise: false, timestamp: null },
            isWarmingUp: false,
            error: null,
            requestWarmup: () => {},
            syncQueue: async () => {},
            startWatching: () => {},
            stopWatching: () => {},
            permissions: { location: 'prompt', camera: 'prompt' } as const,
            checkPermissions: async () => {},
            requestLocationPermission: async () => false,
            todayShift: null,
            fetchTodayShift: async () => {},
            setTodayShift: () => {},
            deviceId: '',
            rebindDevice: async () => false,
            refreshLocation: async () => {},
        };
    }
    return context;
};
