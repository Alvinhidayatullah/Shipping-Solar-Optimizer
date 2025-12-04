import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapVisualization.css";

// Fix for default icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const MapVisualization = ({ ports, routes, selectedPorts, vessels }) => {
  const [center] = useState([-2.5, 118]); // Center of Indonesia
  const [zoom] = useState(5);
  const [routeLines, setRouteLines] = useState([]);

  // Port icons based on type
  const getPortIcon = (portType) => {
    const iconSize = [30, 30];

    const icons = {
      main_port: L.divIcon({
        html: `<div class="port-marker main-port">⛴️</div>`,
        className: "custom-div-icon",
        iconSize,
      }),
      oil_terminal: L.divIcon({
        html: `<div class="port-marker oil-terminal">🛢️</div>`,
        className: "custom-div-icon",
        iconSize,
      }),
      transit_port: L.divIcon({
        html: `<div class="port-marker transit-port">⚓</div>`,
        className: "custom-div-icon",
        iconSize,
      }),
      river_port: L.divIcon({
        html: `<div class="port-marker river-port">🌊</div>`,
        className: "custom-div-icon",
        iconSize,
      }),
    };

    return icons[portType] || icons.main_port;
  };

  // Vessel icons
  const getVesselIcon = (vesselType) => {
    return L.divIcon({
      html: `<div class="vessel-marker">🚢</div>`,
      className: "vessel-div-icon",
      iconSize: [40, 40],
    });
  };

  // Calculate route lines
  useEffect(() => {
    if (routes && routes.length > 0) {
      const lines = routes.map((route) => ({
        coordinates: route.path.map((p) => [p.lat, p.lng]),
        color: route.color || "#3498db",
        weight: 4,
      }));
      setRouteLines(lines);
    }
  }, [routes]);

  return (
    <div className="map-container">
      <h2>🗺️ Peta Pelayaran & Rute Kapal</h2>
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-icon main-port">⛴️</span>
          <span>Pelabuhan Utama</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon oil-terminal">🛢️</span>
          <span>Terminal Minyak</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon vessel">🚢</span>
          <span>Posisi Kapal</span>
        </div>
      </div>

      <MapContainer center={center} zoom={zoom} style={{ height: "600px", width: "100%", borderRadius: "10px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />

        {/* Draw routes */}
        {routeLines.map((line, idx) => (
          <Polyline key={idx} pathOptions={{ color: line.color, weight: line.weight }} positions={line.coordinates} />
        ))}

        {/* Port markers */}
        {ports.map((port) => (
          <Marker key={port.id} position={[port.location.lat, port.location.lng]} icon={getPortIcon(port.type)}>
            <Popup>
              <div className="port-popup">
                <h3>{port.name}</h3>
                <p>
                  <strong>Kode:</strong> {port.code}
                </p>
                <p>
                  <strong>Kebutuhan Solar:</strong> {port.demand.solar.toLocaleString()} ton/bulan
                </p>
                <p>
                  <strong>Kedalaman:</strong> {port.capacity.depth} m
                </p>
                <p>
                  <strong>Operasional:</strong> {port.operatingHours}
                </p>
                {selectedPorts.includes(port.id) && <div className="selected-badge">✓ Terpilih untuk pengiriman</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Vessel markers */}
        {vessels &&
          vessels.map((vessel) => {
            const port = ports.find((p) => p.code === vessel.currentLocation);
            if (!port) return null;

            return (
              <Marker key={vessel.id} position={[port.location.lat, port.location.lng]} icon={getVesselIcon(vessel.type)}>
                <Popup>
                  <div className="vessel-popup">
                    <h3>{vessel.name}</h3>
                    <p>
                      <strong>Status:</strong> <span className={`status-${vessel.status}`}>{vessel.status}</span>
                    </p>
                    <p>
                      <strong>Lokasi:</strong> {port.name}
                    </p>
                    <p>
                      <strong>Tersedia sejak:</strong> {vessel.nextAvailable}
                    </p>
                    <p>
                      <strong>Reliabilitas:</strong> {vessel.operationalHistory.reliability}%
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

export default MapVisualization;
