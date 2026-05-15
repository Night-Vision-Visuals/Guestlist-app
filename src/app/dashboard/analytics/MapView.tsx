"use client"

import { useEffect, useRef } from "react"

export type MapPoint = {
  type: "qr" | "link"
  source: string
  lat: number
  lng: number
  city: string
  country: string
  timestamp: string
  label: string
}

interface MapViewProps {
  points: MapPoint[]
}

const QR_COLOR   = "#f59e0b"
const LINK_COLOR = "#3b82f6"

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return ts
  }
}

function popupHtml(p: MapPoint, color: string): string {
  return `
    <div style="font-family:'Space Mono',monospace;font-size:12px;min-width:200px;line-height:1.7;color:#e2e8f0;">
      <div style="font-size:10px;letter-spacing:1.5px;color:${color};margin-bottom:6px;text-transform:uppercase;">
        ${p.type === "qr" ? "QR Scan" : "Link Click"}
      </div>
      <div style="font-weight:700;margin-bottom:4px;">${p.label.replace(/_/g, " ")}</div>
      <div style="color:#94a3b8;font-size:11px;">
        <div>&#x1F4CD; ${p.city}, ${p.country}</div>
        <div style="margin-top:2px;">&#x23F0; ${formatTimestamp(p.timestamp)}</div>
      </div>
    </div>
  `
}

export default function MapView({ points }: MapViewProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  // Synchronous flag — prevents double-init in React strict mode / hot-reload
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return

    // Mark as initializing synchronously so a second effect invocation is blocked
    initializedRef.current = true

    import("leaflet").then((L) => {
      // Guard again in case the component unmounted before the import resolved
      if (!containerRef.current) return

      // Fix broken default icon paths from webpack bundling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(containerRef.current, {
        center: [20, 10],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
      })

      mapRef.current = map

      // CartoDB Dark Matter — free, no API key needed
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map)

      // Add initial points
      addMarkers(L, map, points)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      initializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-draw markers whenever points array changes after initial mount
  useEffect(() => {
    if (!mapRef.current) return
    import("leaflet").then((L) => {
      if (!mapRef.current) return

      // Remove existing circle markers
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) {
          mapRef.current.removeLayer(layer)
        }
      })

      addMarkers(L, mapRef.current, points)
    })
  }, [points])

  return (
    <div className="relative w-full" style={{ height: 480 }}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />

      <style>{`
        .nv-popup .leaflet-popup-content-wrapper {
          background: #0d1014 !important;
          color: #e2e8f0 !important;
          border: 1px solid rgba(148,163,184,0.2) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.8) !important;
          border-radius: 4px !important;
        }
        .nv-popup .leaflet-popup-tip { background: #0d1014 !important; }
        .nv-popup .leaflet-popup-content { margin: 12px 14px !important; }
        .leaflet-control-attribution {
          background: rgba(10,12,15,0.85) !important;
          color: #64748b !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: #64748b !important; }
        .leaflet-control-zoom a {
          background: #0d1014 !important;
          color: #94a3b8 !important;
          border-color: rgba(148,163,184,0.2) !important;
        }
        .leaflet-control-zoom a:hover {
          background: #11151a !important;
          color: #e2e8f0 !important;
        }
      `}</style>

      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {points.length === 0 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ background: "rgba(10,12,15,0.7)" }}
        >
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "#475569", fontFamily: "'Space Mono', monospace" }}
          >
            No geo data yet
          </p>
          <p
            className="text-xs mt-2"
            style={{ color: "#334155", fontFamily: "'Space Mono', monospace" }}
          >
            Points will appear after new QR scans or link clicks
          </p>
        </div>
      )}
    </div>
  )
}

function addMarkers(L: any, map: any, points: MapPoint[]) {
  points.forEach((p) => {
    const color = p.type === "qr" ? QR_COLOR : LINK_COLOR
    L.circleMarker([p.lat, p.lng], {
      radius: 8,
      fillColor: color,
      color: color,
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.55,
    })
      .bindPopup(popupHtml(p, color), { className: "nv-popup" })
      .addTo(map)
  })

  if (points.length > 0) {
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 })
  }
}
