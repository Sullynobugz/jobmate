'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip } from 'react-leaflet'
import { divIcon } from 'leaflet'
import type { Job } from '@/types'
import 'leaflet/dist/leaflet.css'

// Distanz-Ringe in km (Task-Vorgabe: 15 / 30 / 50)
const RADIUS_RINGS = [15, 30, 50]

interface JobRadarMapProps {
  center: { lat: number; lng: number }
  jobs: Job[]
  savedIds: Set<string>
  /** Nutzer-Suchradius in km — bestimmt das initiale Zoom-Level */
  radius: number
}

function dotIcon(color: string, big: boolean) {
  const size = big ? 16 : 12
  return divIcon({
    className: 'jobmate-radar-dot',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid #ffffff;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function userIcon() {
  return divIcon({
    className: 'jobmate-radar-user',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:#ef4444;border:3px solid #ffffff;
      box-shadow:0 0 0 4px rgba(239,68,68,0.18);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

// Grobe Zoom-Heuristik abhängig vom Suchradius — größerer Umkreis → weiter raus
function zoomForRadius(radiusKm: number): number {
  if (radiusKm <= 10) return 11
  if (radiusKm <= 25) return 10
  if (radiusKm <= 50) return 9
  if (radiusKm <= 100) return 8
  return 7
}

export default function JobRadarMap({ center, jobs, savedIds, radius }: JobRadarMapProps) {
  const centerTuple = useMemo<[number, number]>(() => [center.lat, center.lng], [center.lat, center.lng])
  const jobsWithCoords = useMemo(() => jobs.filter(j => j.lat != null && j.lng != null), [jobs])

  return (
    <MapContainer
      center={centerTuple}
      zoom={zoomForRadius(radius)}
      scrollWheelZoom
      style={{ height: 360, width: '100%', borderRadius: 16, zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={18}
      />

      {/* Distanz-Ringe um den Nutzer-Standort */}
      {RADIUS_RINGS.map(km => (
        <Circle
          key={km}
          center={centerTuple}
          radius={km * 1000}
          pathOptions={{
            color: '#4f46e5',
            weight: 1,
            opacity: 0.4,
            fillColor: '#4f46e5',
            fillOpacity: 0.04,
            dashArray: '4 4',
          }}
        />
      ))}

      {/* Nutzer-Standort als Mittelpunkt */}
      <Marker position={centerTuple} icon={userIcon()} zIndexOffset={1000}>
        <Tooltip direction="top" offset={[0, -10]}>Dein Standort</Tooltip>
      </Marker>

      {/* Jobs als Pins */}
      {jobsWithCoords.map(job => {
        const isSaved = savedIds.has(job.id)
        return (
          <Marker
            key={job.id}
            position={[job.lat!, job.lng!]}
            icon={dotIcon(isSaved ? '#10b981' : '#4f46e5', isSaved)}
          >
            <Popup>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{job.title}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>
                {job.company}
                {job.distance != null && ` · ${job.distance} km`}
              </div>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4f46e5', fontSize: 12 }}
              >
                Stelle öffnen
              </a>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
