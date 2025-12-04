import React, { useState } from "react";
import "./OptimizationPanel.css";

const OptimizationPanel = ({ ports, vessels, onOptimize, optimizationResult }) => {
  const [selectedVessels, setSelectedVessels] = useState([]);
  const [selectedPorts, setSelectedPorts] = useState([]);

  // **PERBAIKAN DI SINI** - Menambahkan constraints yang lebih realistis
  const [constraints, setConstraints] = useState({
    // Budget & Cost Constraints
    maxCostPerVessel: 50000,
    maxTotalCost: 150000,
    maxFuelCost: 30000,

    // Time Constraints
    maxDaysPerTrip: 14,
    maxWaitingTimeHours: 24,
    minSpeedKnots: 12,
    maxSpeedKnots: 20,

    // Operational Constraints
    minVesselUtilization: 70, // percentage
    maxPortDelayHours: 6,
    considerWeatherImpact: true,
    avoidStormAreas: true,

    // Route Constraints
    returnToStart: true,
    respectTimeWindows: true,
    prioritizeHighDemand: false,
    optimizeForFuel: true,

    // Capacity Constraints
    minCargoFillRate: 80, // percentage
    maxLoadUnloadTime: 8, // hours per port
  });

  const [optimizationType, setOptimizationType] = useState("balanced");

  // **TAMBAHKAN FUNGSI INI** - Fungsi untuk toggle vessel
  const handleVesselToggle = (vesselId) => {
    setSelectedVessels((prev) => (prev.includes(vesselId) ? prev.filter((id) => id !== vesselId) : [...prev, vesselId]));
  };

  // **TAMBAHKAN FUNGSI INI** - Fungsi untuk toggle port
  const handlePortToggle = (portId) => {
    setSelectedPorts((prev) => (prev.includes(portId) ? prev.filter((id) => id !== portId) : [...prev, portId]));
  };

  // **FUNGSI BARU** - Untuk mengupdate constraint dengan validasi
  const handleConstraintChange = (key, value) => {
    // Validasi berdasarkan tipe constraint
    let validatedValue = value;

    if (key.includes("Cost") || key.includes("cost")) {
      validatedValue = Math.max(0, Math.min(value, 1000000));
    } else if (key.includes("Days") || key.includes("Time")) {
      validatedValue = Math.max(1, Math.min(value, 90));
    } else if (key.includes("Utilization") || key.includes("FillRate")) {
      validatedValue = Math.max(10, Math.min(value, 100));
    } else if (key.includes("Speed")) {
      validatedValue = Math.max(5, Math.min(value, 30));
    }

    setConstraints((prev) => ({
      ...prev,
      [key]: validatedValue,
    }));
  };

  // Fungsi untuk menghitung estimasi berdasarkan constraints
  const calculateEstimates = () => {
    const selectedVesselData = vessels.filter((v) => selectedVessels.includes(v.id));
    const selectedPortData = ports.filter((p) => selectedPorts.includes(p.id));

    if (selectedVesselData.length === 0 || selectedPortData.length === 0) {
      return null;
    }

    // Hitung total demand dan kapasitas
    const totalDemand = selectedPortData.reduce((sum, p) => sum + (p.demand?.solar || 0), 0);
    const totalCapacity = selectedVesselData.reduce((sum, v) => sum + (v.capacity || 0), 0);

    // Hitung perkiraan biaya
    const estimatedTrips = Math.ceil(totalDemand / totalCapacity);
    const estimatedDistance = selectedPortData.length * 800; // nm per port
    const estimatedFuelCost = estimatedDistance * 15; // $15 per nm

    return {
      totalDemand,
      totalCapacity,
      utilization: (totalDemand / totalCapacity) * 100,
      estimatedTrips,
      estimatedDistance,
      estimatedFuelCost,
      minVesselsNeeded: Math.ceil(totalDemand / Math.max(...selectedVesselData.map((v) => v.capacity || 0))),
    };
  };

  const handleOptimize = () => {
    const selectedVesselData = vessels.filter((v) => selectedVessels.includes(v.id));
    const selectedPortData = ports.filter((p) => selectedPorts.includes(p.id));

    // Validasi sebelum optimasi
    const estimates = calculateEstimates();

    if (!estimates) {
      alert("Please select at least one vessel and one port!");
      return;
    }

    // Cek apakah kapasitas cukup
    if (estimates.totalDemand > estimates.totalCapacity * 2) {
      if (!window.confirm(`Demand (${estimates.totalDemand.toLocaleString()} ton) exceeds available capacity. Do you want to proceed anyway?`)) {
        return;
      }
    }

    // Kirim data dengan constraints yang diperbarui
    onOptimize({
      vessels: selectedVesselData,
      ports: selectedPortData,
      constraints,
      optimizationType,
      estimates,
    });
  };

  const estimates = calculateEstimates();

  return (
    <div className="optimization-panel">
      <h2>⚙️ Optimization Configuration</h2>

      <div className="optimization-grid">
        {/* Vessel Selection */}
        <div className="optimization-section">
          <h3>Pilih Kapal</h3>
          <div className="selection-list">
            {vessels.map((vessel) => (
              <div key={vessel.id} className="selection-item">
                <label>
                  <input type="checkbox" checked={selectedVessels.includes(vessel.id)} onChange={() => handleVesselToggle(vessel.id)} />
                  <div className="item-details">
                    <strong>{vessel.name}</strong>
                    <span className="vessel-type">Type: {vessel.vesselType || "General Cargo"}</span>
                    <span>Kapasitas: {vessel.capacity?.toLocaleString()} ton</span>
                    <span>Kecepatan: {vessel.speed} knot</span>
                    <span>Fuel Rate: {vessel.fuelConsumption || 25} L/nm</span>
                    <span>
                      Status: <span className={`status-${vessel.status}`}>{vessel.status}</span>
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Port Selection */}
        <div className="optimization-section">
          <h3>Pilih Pelabuhan</h3>
          <div className="selection-list">
            {ports.map((port) => (
              <div key={port.id} className="selection-item">
                <label>
                  <input type="checkbox" checked={selectedPorts.includes(port.id)} onChange={() => handlePortToggle(port.id)} />
                  <div className="item-details">
                    <strong>{port.name}</strong>
                    <span>Type: {port.type?.replace("_", " ") || "Port"}</span>
                    <span>Solar Demand: {port.demand?.solar?.toLocaleString() || 0} ton</span>
                    <span>Draft: {port.capacity?.depth || "N/A"}m</span>
                    <span>Berthing Cost: ${port.charges?.berthing?.toLocaleString() || 0}</span>
                    <span>Load Rate: {port.capacity?.loading || 50} ton/hour</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints & Parameters yang lebih fungsional */}
        <div className="optimization-section">
          <h3>⚡ Constraints & Parameters</h3>

          {/* Quick Estimates */}
          {estimates && (
            <div className="constraint-estimates">
              <div className="estimate-badge">
                <span>Estimated Demand: {estimates.totalDemand.toLocaleString()} ton</span>
                <span>Capacity: {estimates.totalCapacity.toLocaleString()} ton</span>
                <span>Utilization: {estimates.utilization.toFixed(1)}%</span>
              </div>
            </div>
          )}

          <div className="constraints-grid">
            {/* Optimization Goal */}
            <div className="constraint-item">
              <label>
                <span className="constraint-icon">🎯</span>
                Optimization Goal:
              </label>
              <select value={optimizationType} onChange={(e) => setOptimizationType(e.target.value)} className="constraint-select">
                <option value="min_cost">💰 Minimize Cost</option>
                <option value="min_time">⏱️ Minimize Time</option>
                <option value="min_fuel">⛽ Minimize Fuel</option>
                <option value="max_utilization">🚢 Maximize Utilization</option>
                <option value="balanced">⚖️ Balanced (Recommended)</option>
                <option value="eco_friendly">🌱 Eco-Friendly</option>
              </select>
            </div>

            {/* Cost Constraints */}
            <div className="constraint-item">
              <label>
                <span className="constraint-icon">💰</span>
                Max Total Budget:
              </label>
              <div className="slider-container">
                <input type="range" min="50000" max="500000" step="10000" value={constraints.maxTotalCost} onChange={(e) => handleConstraintChange("maxTotalCost", parseInt(e.target.value))} className="constraint-slider" />
                <span className="slider-value">${constraints.maxTotalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="constraint-item">
              <label>
                <span className="constraint-icon">⛽</span>
                Max Fuel Budget:
              </label>
              <div className="slider-container">
                <input type="range" min="10000" max="100000" step="5000" value={constraints.maxFuelCost} onChange={(e) => handleConstraintChange("maxFuelCost", parseInt(e.target.value))} className="constraint-slider" />
                <span className="slider-value">${constraints.maxFuelCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Time Constraints */}
            <div className="constraint-item">
              <label>
                <span className="constraint-icon">⏱️</span>
                Max Trip Duration:
              </label>
              <div className="slider-container">
                <input type="range" min="1" max="30" step="1" value={constraints.maxDaysPerTrip} onChange={(e) => handleConstraintChange("maxDaysPerTrip", parseInt(e.target.value))} className="constraint-slider" />
                <span className="slider-value">{constraints.maxDaysPerTrip} days</span>
              </div>
            </div>

            {/* Vessel Speed */}
            <div className="constraint-item">
              <label>
                <span className="constraint-icon">🚢</span>
                Vessel Speed Range:
              </label>
              <div className="range-inputs">
                <div className="range-input-group">
                  <span>Min:</span>
                  <input type="number" min="5" max="30" value={constraints.minSpeedKnots} onChange={(e) => handleConstraintChange("minSpeedKnots", parseInt(e.target.value))} className="range-input" />
                  <span>knots</span>
                </div>
                <div className="range-input-group">
                  <span>Max:</span>
                  <input type="number" min="10" max="30" value={constraints.maxSpeedKnots} onChange={(e) => handleConstraintChange("maxSpeedKnots", parseInt(e.target.value))} className="range-input" />
                  <span>knots</span>
                </div>
              </div>
            </div>

            {/* Operational Constraints */}
            <div className="constraint-item">
              <label>
                <span className="constraint-icon">📊</span>
                Min Vessel Utilization:
              </label>
              <div className="slider-container">
                <input type="range" min="20" max="100" step="5" value={constraints.minVesselUtilization} onChange={(e) => handleConstraintChange("minVesselUtilization", parseInt(e.target.value))} className="constraint-slider" />
                <span className="slider-value">{constraints.minVesselUtilization}%</span>
              </div>
            </div>

            <div className="constraint-item">
              <label>
                <span className="constraint-icon">📦</span>
                Min Cargo Fill Rate:
              </label>
              <div className="slider-container">
                <input type="range" min="50" max="100" step="5" value={constraints.minCargoFillRate} onChange={(e) => handleConstraintChange("minCargoFillRate", parseInt(e.target.value))} className="constraint-slider" />
                <span className="slider-value">{constraints.minCargoFillRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Estimates Panel */}
      {estimates && (
        <div className="estimates-panel">
          <h4>📈 Quick Estimates</h4>
          <div className="estimates-grid">
            <div className="estimate-card">
              <span className="estimate-label">Total Demand</span>
              <span className="estimate-value">{estimates.totalDemand.toLocaleString()} ton</span>
            </div>
            <div className="estimate-card">
              <span className="estimate-label">Vessel Utilization</span>
              <span className="estimate-value">{estimates.utilization.toFixed(1)}%</span>
            </div>
            <div className="estimate-card">
              <span className="estimate-label">Estimated Trips</span>
              <span className="estimate-value">{estimates.estimatedTrips}</span>
            </div>
            <div className="estimate-card">
              <span className="estimate-label">Min Vessels Needed</span>
              <span className="estimate-value">{estimates.minVesselsNeeded}</span>
            </div>
            <div className="estimate-card">
              <span className="estimate-label">Estimated Distance</span>
              <span className="estimate-value">{estimates.estimatedDistance.toLocaleString()} nm</span>
            </div>
            <div className="estimate-card">
              <span className="estimate-label">Estimated Fuel Cost</span>
              <span className="estimate-value">${estimates.estimatedFuelCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="optimization-actions">
        <button className="optimize-btn" onClick={handleOptimize} disabled={selectedVessels.length === 0 || selectedPorts.length === 0}>
          🚀 Run Advanced Optimization
        </button>

        <div className="selection-summary">
          <p>
            <strong>Selected:</strong>
            <span className="summary-value">{selectedVessels.length} vessels</span>
            <span className="summary-value">{selectedPorts.length} ports</span>
          </p>
          {estimates && (
            <p>
              <strong>Capacity Utilization:</strong>
              <span className="summary-value">{estimates.utilization.toFixed(1)}%</span>
            </p>
          )}
        </div>
      </div>

      {/* Results Display */}
      {optimizationResult && optimizationResult.routes && (
        <div className="optimization-results">
          <h3>📊 Optimization Results</h3>
          <div className="results-grid">
            <div className="result-card">
              <h4>Total Cost</h4>
              <p className="result-value">${optimizationResult.totalCost?.toLocaleString() || "N/A"}</p>
            </div>
            <div className="result-card">
              <h4>Total Distance</h4>
              <p className="result-value">{optimizationResult.totalDistance?.toLocaleString() || "N/A"} nm</p>
            </div>
            <div className="result-card">
              <h4>Total Time</h4>
              <p className="result-value">{optimizationResult.totalTime ? optimizationResult.totalTime.toFixed(1) + " days" : "N/A"}</p>
            </div>
            <div className="result-card">
              <h4>Vessel Utilization</h4>
              <p className="result-value">{optimizationResult.vesselUtilization ? optimizationResult.vesselUtilization.toFixed(1) + "%" : "N/A"}</p>
            </div>
          </div>

          {optimizationResult.routes && optimizationResult.routes.length > 0 && (
            <div className="routes-details">
              <h4>Routes Details:</h4>
              {optimizationResult.routes.map((route, idx) => (
                <div key={idx} className="route-detail">
                  <p>
                    <strong>{route.vesselName || `Vessel ${route.vessel}`}:</strong> {route.portSequence || "Route tidak tersedia"}
                  </p>
                  <p>
                    Distance: {(route.distance || 0).toLocaleString()} nm | Cost: ${(route.cost || 0).toLocaleString()} | Ports: {route.ports || 0} | Time: {(route.time || 0).toFixed(1)} hours
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizationPanel;
