'use client';
import { useEffect } from 'react';
import { reportarUbicacion } from '@/app/(app)/turno/actions';

/** Envía la ubicación cada ~15 s mientras la app esté abierta y el turno activo. No guarda nada en el teléfono. */
export function GpsTracker() {
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    let last = 0;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - last < 15000) return;
        last = now;
        void reportarUbicacion(pos.coords.latitude, pos.coords.longitude);
      },
      () => { /* sin permiso o sin señal: el aviso del turno sigue visible */ },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return null;
}
