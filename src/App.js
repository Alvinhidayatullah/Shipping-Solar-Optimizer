import React, { useState } from "react";
import "./App.css";

// Import komponen
import MapVisualization from "./components/MapVisualization";
import OptimizationPanel from "./components/OptimizationPanel";
import CostAnalysis from "./components/CostAnalysis";
import TimeSchedule from "./components/TimeSchedule";

// Import data
import { indonesiaPorts } from "./data/indonesiaPorts";
import { vessels } from "./data/vesselData";

function App() {
  const [ports] = useState(indonesiaPorts);
  const [vesselsData] = useState(vessels);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [selectedPorts, setSelectedPorts] = useState([1, 2, 3]);
  const [selectedVessels, setSelectedVessels] = useState(["V001", "V002"]);
  const [activeMapFilter, setActiveMapFilter] = useState("ports"); // State untuk filter peta

  // Debug log
  React.useEffect(() => {
    console.log("Vessels data loaded:", vesselsData);
    console.log(
      "Vessel names:",
      vesselsData.map((v) => v.name)
    );
  }, [vesselsData]);

  const handleOptimize = (optimizationParams) => {
    console.log("Optimization params:", optimizationParams);

    const selectedVesselData = optimizationParams?.vessels || [];
    const selectedPortData = optimizationParams?.ports || [];

    // Pastikan ada data yang dipilih
    if (selectedVesselData.length === 0 || selectedPortData.length === 0) {
      alert("Please select at least one vessel and one port!");
      return;
    }

    // Generate routes berdasarkan data yang dipilih
    const generateRoutes = () => {
      const routes = [];

      selectedVesselData.forEach((vessel, index) => {
        // Ambil beberapa pelabuhan untuk setiap kapal
        const assignedPorts = selectedPortData.slice(index * 2, index * 2 + 2 + (index % 2));

        if (assignedPorts.length > 0) {
          const distance = assignedPorts.length * 500 + Math.random() * 200;
          const cost = assignedPorts.length * 30000 + Math.random() * 20000;

          routes.push({
            vessel: vessel.id,
            vesselName: vessel.name,
            route: assignedPorts,
            distance: Math.round(distance),
            cost: Math.round(cost),
            fuelConsumption: 40 + Math.random() * 20,
            ports: assignedPorts.length,
            time: assignedPorts.length * 24 + Math.random() * 12,
            portSequence: assignedPorts.map((p) => p.name).join(" → "),
          });
        }
      });

      return routes;
    };

    const routes = generateRoutes();

    const mockResult = {
      totalCost: routes.reduce((sum, r) => sum + r.cost, 0),
      totalDistance: routes.reduce((sum, r) => sum + r.distance, 0),
      totalTime: routes.reduce((sum, r) => sum + r.time, 0) / 24, // convert to days
      vesselUtilization: (routes.length / selectedVesselData.length) * 100,
      routes: routes,
    };

    console.log("Generated optimization result:", mockResult);
    setOptimizationResult(mockResult);
  };

  const handlePortSelection = (portIds) => {
    setSelectedPorts(portIds);
  };

  // Fungsi untuk menghitung routes untuk peta
  const calculateRoutesForMap = () => {
    if (!optimizationResult || !optimizationResult.routes) {
      console.log("No optimization result or routes");
      return [];
    }

    try {
      return optimizationResult.routes
        .filter((route) => route && route.route && Array.isArray(route.route))
        .map((route) => {
          const routePorts = route.route;

          if (!Array.isArray(routePorts) || routePorts.length === 0) {
            console.warn("Invalid routePorts:", routePorts);
            return null;
          }

          const path = routePorts
            .map((port) => {
              if (!port || !port.location) {
                console.warn("Invalid port in route:", port);
                return null;
              }
              return {
                lat: port.location.lat,
                lng: port.location.lng,
              };
            })
            .filter(Boolean);

          if (path.length === 0) {
            return null;
          }

          return {
            path,
            color: "#3498db",
            label: route.vesselName || `Vessel ${route.vessel}`,
            vesselId: route.vessel,
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error("Error calculating routes for map:", error);
      return [];
    }
  };

  // Fungsi untuk mendapatkan data port yang dipilih
  const getSelectedPortsData = () => {
    return ports.filter((port) => selectedPorts.includes(port.id));
  };

  // Fungsi untuk mendapatkan data vessel yang dipilih
  const getSelectedVesselsData = () => {
    return vesselsData.filter((vessel) => selectedVessels.includes(vessel.id));
  };

  // Hitung statistik
  const calculateTotalDemand = () => {
    return ports.reduce((sum, p) => sum + (p.demand?.solar || 0), 0);
  };

  const calculateTotalCapacity = () => {
    return vesselsData.reduce((sum, v) => sum + (v.capacity || 0), 0);
  };

  const calculateAveragePortCharge = () => {
    if (ports.length === 0) return 0;
    const totalCharges = ports.reduce((sum, p) => sum + (p.charges?.berthing || 0), 0);
    return Math.round(totalCharges / ports.length);
  };

  // Fungsi untuk filter tombol peta
  const handleMapFilter = (filterType) => {
    setActiveMapFilter(filterType);
  };

  return (
    <div className="App">
      {/* ✨ FLOATING DECORATIVE SHIPS */}
      <div className="floating-ship">🚢</div>
      <div className="floating-ship">⛵</div>
      <div className="floating-ship">🛳️</div>
      <div className="floating-ship">🛥️</div>

      <header className="App-header">
        <div className="header-content">
          <h1>🚢 Shipping Solar Optimizer</h1>
          <p>Advanced System for Solar Fuel Distribution Across Indonesian Archipelago</p>
          <div className="header-stats">
            <span>📊 {ports.length} Ports</span>
            <span>🛳️ {vesselsData.length} Vessels</span>
            <span>⛽ {calculateTotalDemand().toLocaleString()} ton/month demand</span>
          </div>
        </div>
      </header>

      <main className="dashboard">
        {/* ✨ Peta Pelayaran & Rute Kapal Section - VERSI BARU */}
        <div className="map-visualization-container">
          <div className="map-header">
            <h2 className="map-title">Peta Pelayaran & Rute Kapal</h2>
          </div>

          <div className="map-area">
            <MapVisualization ports={ports} routes={calculateRoutesForMap()} selectedPorts={selectedPorts} vessels={getSelectedVesselsData()} activeFilter={activeMapFilter} />
          </div>

          {/* Informasi Kapal */}
          <div className="vessels-info">
            {vesselsData.slice(0, 3).map((vessel) => (
              <div key={vessel.id} className="vessel-card">
                <div className="vessel-header">
                  <div className="vessel-icon">🚢</div>
                  <div>
                    <h3 className="vessel-name">{vessel.name}</h3>
                    <p className="vessel-id">{vessel.id}</p>
                  </div>
                </div>
                <div className="vessel-stats">
                  <div className="vessel-stat">
                    <span className="stat-label">Kapasitas</span>
                    <span className="stat-value">{vessel.capacity?.toLocaleString()} ton</span>
                  </div>
                  <div className="vessel-stat">
                    <span className="stat-label">Kecepatan</span>
                    <span className="stat-value">{vessel.speed} knot</span>
                  </div>
                  <div className="vessel-stat">
                    <span className="stat-label">Bahan Bakar</span>
                    <span className="stat-value">{vessel.fuelConsumption} L/jam</span>
                  </div>
                  <div className="vessel-stat">
                    <span className="stat-label">Status</span>
                    <span className="stat-value" style={{ color: vessel.status === "available" ? "#2ecc71" : "#f39c12" }}>
                      {vessel.status === "available" ? "Siap" : "Dalam Perjalanan"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan Pelabuhan */}
          <div className="ports-summary">
            <div className="port-summary-card">
              <h3 className="port-summary-title">
                <span>⚓</span> Pelabuhan Utama
              </h3>
              <div className="port-summary-count">{ports.filter((p) => p.type === "main_port").length}</div>
              <p className="port-summary-desc">Pusat distribusi utama dengan fasilitas lengkap</p>
            </div>
            <div className="port-summary-card">
              <h3 className="port-summary-title">
                <span>🛢️</span> Terminal Minyak
              </h3>
              <div className="port-summary-count">{ports.filter((p) => p.type === "oil_terminal").length}</div>
              <p className="port-summary-desc">Penyimpanan solar dengan kapasitas besar</p>
            </div>
            <div className="port-summary-card">
              <h3 className="port-summary-title">
                <span>📍</span> Total Pelabuhan
              </h3>
              <div className="port-summary-count">{ports.length}</div>
              <p className="port-summary-desc">Jaringan distribusi di seluruh Indonesia</p>
            </div>
          </div>
        </div>

        {/* Main Optimization Section */}
        <OptimizationPanel ports={ports} vessels={vesselsData} onOptimize={handleOptimize} optimizationResult={optimizationResult} />

        {/* Results Section */}
        {optimizationResult && (
          <div className="results-section">
            <h2 style={{ color: "#f8f8f8ff", marginBottom: "20px" }}>📊 Optimization Results</h2>
            <div className="results-grid">
              <CostAnalysis result={optimizationResult} vessels={vesselsData} />
              <TimeSchedule routes={optimizationResult.routes || []} ports={ports} />
            </div>
          </div>
        )}

        {/* Port Details Table */}
        <div className="port-details">
          <h2>📋 Port Details & Specifications</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Port Name</th>
                  <th>Type</th>
                  <th>Solar Demand (ton/month)</th>
                  <th>Draft Limit (m)</th>
                  <th>Operating Hours</th>
                  <th>Berthing Cost (USD)</th>
                  <th>Loading Rate (ton/hr)</th>
                </tr>
              </thead>
              <tbody>
                {ports.map((port) => (
                  <tr key={port.id}>
                    <td>
                      <strong>{port.name}</strong>
                      <div className="port-code">{port.code}</div>
                    </td>
                    <td>
                      <span className={`port-type ${port.type}`}>{port.type ? port.type.replace("_", " ") : "N/A"}</span>
                    </td>
                    <td>{(port.demand?.solar || 0).toLocaleString()}</td>
                    <td>{port.capacity?.depth || "N/A"}</td>
                    <td>{port.operatingHours || "24/7"}</td>
                    <td>${(port.charges?.berthing || 0).toLocaleString()}</td>
                    <td>{port.capacity?.berth ? `${port.capacity.berth * 100}/hr` : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="App-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Maritime Solar Optimizer</h4>
            <p>Advanced planning system for efficient solar distribution across Indonesia</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>Multi-vessel Route Optimization</li>
              <li>Real-time Cost Analysis</li>
              <li>Port Capacity Management</li>
              <li>Weather Integration</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Data Sources</h4>
            <p>Port Data • Vessel Tracking • Weather API • Market Rates</p>
            <p className="version">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Shipping Solar Optimizer - Vinzz Prototype v1.0</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
