import { MapContainer, TileLayer, Popup, useMapEvents, Circle, CircleMarker, Marker } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css"; // solo para leaflet overrides + markers
import { useEffect, useState } from "react";
import type { LatLng, Map as LeafletMap } from "leaflet";
import type { Court } from "../../services/apiMAP";
import { getCiudad, getCourts } from "../../services/apiMAP";

interface MapProps {
  selectedCourtId?: number | null;
  onCourtSelect?: (courtId: number) => void;
}

function getCourtIcon(label: number | string, isSelected = false) {
  return divIcon({
    className: `hc-court-marker${isSelected ? " hc-court-marker--selected" : ""}`,
    html: `
      <div class="hc-court-marker__pin">
        <span class="hc-court-marker__label">${label}</span>
        <span class="hc-court-marker__badge"></span>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 44],
    popupAnchor: [0, -38],
  });
}

function CourtsMarkers({ courts, error, selectedCourtId, onSelectCourt }: {
  courts: Court[];
  error: string;
  selectedCourtId: number | null;
  onSelectCourt: (court: Court) => void;
}) {
  const fallbackPosition: [number, number] = [34.048408, -118.252957];

  return (
    <>
      {error ? (
        <Marker position={fallbackPosition}>
          <Popup>{error}</Popup>
        </Marker>
      ) : null}
      {courts.map((court, index) => (
        <Marker
          key={court.court_id}
          position={[court.latitude, court.longitude]}
          icon={getCourtIcon(index + 1, selectedCourtId === court.court_id)}
          eventHandlers={{ click: () => onSelectCourt(court) }}
        >
          <Popup>
            <b>{court.name}</b><br />
            {court.direction}
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function LocationMarker({ locateRequest, onCityChange }: {
  locateRequest: number;
  onCityChange: (city: string) => void;
}) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string>("");

  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15);
    },
    locationerror() {
      setError("No se pudo obtener tu ubicacion.");
      onCityChange("Ubicacion no disponible");
    },
  });

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 15, enableHighAccuracy: false });
  }, [map]);

  useEffect(() => {
    if (locateRequest === 0) return;
    map.locate({ setView: true, maxZoom: 15, enableHighAccuracy: false });
  }, [map, locateRequest]);

  useEffect(() => {
    if (position === null) return;
    const { lat, lng } = position;
    let isCancelled = false;

    async function loadCurrentCity() {
      try {
        const city = await getCiudad(lat, lng);
        if (!isCancelled) onCityChange(city ?? "Ciudad no disponible");
      } catch {
        if (!isCancelled) onCityChange("Ciudad no disponible");
      }
    }

    loadCurrentCity();
    return () => { isCancelled = true; };
  }, [position, onCityChange]);

  return position === null ? (
    error ? <Popup position={map.getCenter()}>{error}</Popup> : null
  ) : (
    <>
      <Circle
        center={position}
        pathOptions={{ color: "#2b7fff", fillColor: "#2b7fff", fillOpacity: 0.15, weight: 1 }}
      />
      <CircleMarker
        center={position}
        radius={8}
        pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2b7fff", fillOpacity: 1 }}
      >
        <Popup>Tu ubicacion actual</Popup>
      </CircleMarker>
    </>
  );
}

export default function Map({ selectedCourtId: selectedCourtIdProp, onCourtSelect }: MapProps) {
  const fallbackPosition: [number, number] = [34.048408, -118.252957];
  const [courts, setCourts] = useState<Court[]>([]);
  const [error, setError] = useState<string>("");
  const [locateRequest, setLocateRequest] = useState(0);
  const [currentCity, setCurrentCity] = useState("Detectando ciudad...");
  const [selectedCourtIdState, setSelectedCourtIdState] = useState<number | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const isControlled = selectedCourtIdProp !== undefined;
  const selectedCourtId = isControlled ? selectedCourtIdProp : selectedCourtIdState;

  const handleSelectCourt = (court: Court) => {
    if (!isControlled) {
      setSelectedCourtIdState(court.court_id);
    }
    onCourtSelect?.(court.court_id);
  };

  useEffect(() => {
    async function loadCourts() {
      try {
        const data = await getCourts();
        setCourts(data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar.");
      }
    }
    loadCourts();
  }, []);

  useEffect(() => {
    if (map === null || selectedCourtId === null) return;
    const selectedCourt = courts.find((c) => c.court_id === selectedCourtId);
    if (!selectedCourt) return;
    map.flyTo([selectedCourt.latitude, selectedCourt.longitude], Math.max(map.getZoom(), 15));
  }, [courts, map, selectedCourtId]);

  return (
    <section className="w-full max-w-315 rounded-3xl overflow-hidden border border-[#e7e6e8] bg-[#f3f2f5] shadow-[0_28px_52px_rgba(35,17,61,0.3)]">
      
      {/* Topbar */}
      <header className="flex flex-wrap items-center justify-center sm:justify-between gap-3 px-6 py-4.5 bg-[#3b195c] border-b border-[#e7e6e8] text-[#f3f2f3]">
        <p className="flex items-center gap-2.5 text-[0.95rem] font-bold tracking-[0.08em] m-0">
          <span className="w-3 h-3 rounded-full bg-[#fcb136] shrink-0" />
          MAP VIEW
        </p>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="border-0 rounded-full px-5 py-2.5 text-[0.95rem] font-semibold text-[#e7e6e8] bg-[#7e57d7] shadow-[0_10px_18px_rgba(20,10,44,0.35)] cursor-pointer"
          >
            Satellite
          </button>
          <button
            type="button"
            className="border-0 rounded-full px-5 py-2.5 text-[0.95rem] font-semibold text-[rgba(169,157,182,0.83)] bg-[rgba(147,130,164,0.64)] cursor-pointer"
          >
            List
          </button>
        </div>
      </header>

      {/* Map stage */}
      <div className="relative isolate hc-map-stage">
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-320 pointer-events-none bg-[linear-gradient(180deg,rgba(17,6,26,0.3)_0%,rgba(0,0,0,0)_50%,rgba(17,6,26,0.5)_100%)]" />

        <MapContainer
          center={fallbackPosition}
          zoom={13}
          className="w-full h-140 md:h-115 sm:h-90 hc-map-canvas"
          ref={setMap}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker locateRequest={locateRequest} onCityChange={setCurrentCity} />
          <CourtsMarkers
            courts={courts}
            error={error}
            selectedCourtId={selectedCourtId}
            onSelectCourt={handleSelectCourt}
          />
        </MapContainer>

        {/* City chip */}
        <div className="absolute z-500 top-6 left-7 rounded-[14px] border border-[rgba(84,37,129,0.5)] px-4.5 py-3 text-[#f3f2f3] text-[1.02rem] font-bold backdrop-blur-sm bg-[rgba(59,25,92,0.9)] shadow-[0_14px_24px_rgba(29,13,52,0.35)] sm:top-3.5 sm:left-3.5 sm:text-[0.95rem] sm:px-3.5 sm:py-2.5">
          {currentCity}
        </div>

        {/* Location button */}
        <button
          onClick={() => setLocateRequest((prev) => prev + 1)}
          type="button"
          className="absolute z-500 left-7 bottom-6 rounded-[14px] border border-[rgba(148,130,165,0.3)] px-4.5 py-3 text-[#f3f2f3] text-[1.02rem] font-bold backdrop-blur-sm bg-morado-lakers shadow-[0_14px_24px_rgba(29,13,52,0.35)] sm:left-3.5 sm:bottom-3.5 sm:text-[0.95rem] sm:px-3.5 sm:py-2.5 cursor-pointer"
        >
          My Location
        </button>
      </div>

      {/* Courts strip */}
      <div className="flex items-center gap-3 overflow-x-auto px-5 py-4 border-t border-[#e7e6e8] bg-[#f3f2f5] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.75 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(82,47,134,0.35)]">
        {courts.length > 0 ? (
          courts.map((court) => (
            <button
              key={court.court_id}
              type="button"
              onClick={() => handleSelectCourt(court)}
              className={[
                "flex-none rounded-[14px] border px-6 py-3 text-[1.02rem] font-bold bg-white cursor-pointer transition-[transform,box-shadow,border-color,background-color,color] duration-180 ease-in-out",
                "hover:-translate-y-px hover:shadow-[0_8px_16px_rgba(45,23,72,0.16)]",
                "sm:text-[0.94rem] sm:px-4 sm:py-2.5",
                selectedCourtId === court.court_id
                  ? "border-[#7e57d7] text-[#3b195c] bg-[#eee6ff] shadow-[0_10px_20px_rgba(47,20,79,0.25)]"
                  : "border-[#e7e6e8] text-[#6f6975]",
              ].join(" ")}
            >
              {court.name}
            </button>
          ))
        ) : (
          <button
            type="button"
            className="flex-none rounded-[14px] border border-[#e7e6e8] px-6 py-3 text-[1.02rem] font-bold text-[#6f6975] bg-white cursor-not-allowed opacity-60"
            disabled
          >
            {error ? "No se pudieron cargar las canchas" : "Cargando canchas..."}
          </button>
        )}
      </div>
    </section>
  );
}
