/**
 * Helper to calculate distance between two lat/lng points in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadius = 6371000; // in meters

    const latDelta = (lat2 - lat1) * (Math.PI / 180);
    const lonDelta = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(lonDelta / 2) *
            Math.sin(lonDelta / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
}
