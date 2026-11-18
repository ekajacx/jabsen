/**
 * Utility Geolokasi dan Geofencing untuk J-Absen
 * Berdasarkan PRD Section 3.2 (Geofencing & Deteksi Fake GPS)
 */

export interface OfficeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // radius toleransi absensi
}

export const OFFICE_LOCATIONS: OfficeLocation[] = [
  {
    id: "hq-jakarta",
    name: "Kantor Pusat Jakarta",
    latitude: -6.175392,
    longitude: 106.827153,
    radiusMeters: 100,
  },
  {
    id: "branch-surabaya",
    name: "Kantor Cabang Surabaya",
    latitude: -7.257472,
    longitude: 112.75209,
    radiusMeters: 100,
  },
  {
    id: "branch-bandung",
    name: "Kantor Cabang Bandung",
    latitude: -6.917464,
    longitude: 107.619123,
    radiusMeters: 100,
  },
];

/**
 * Menghitung jarak antara dua koordinat bumi menggunakan formula Haversine (dalam meter).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Mengecek apakah koordinat pengguna berada dalam radius kantor yang ditentukan.
 */
export function checkGeofence(
  userLat: number,
  userLon: number,
  targetOffice: OfficeLocation
): {
  isWithinRadius: boolean;
  distanceMeters: number;
  toleranceRadius: number;
} {
  const distance = calculateHaversineDistance(
    userLat,
    userLon,
    targetOffice.latitude,
    targetOffice.longitude
  );

  return {
    isWithinRadius: distance <= targetOffice.radiusMeters,
    distanceMeters: distance,
    toleranceRadius: targetOffice.radiusMeters,
  };
}
