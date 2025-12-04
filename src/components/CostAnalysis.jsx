import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import "./CostAnalysis.css";

const CostAnalysis = ({ result, vessels }) => {
  const [activeTab, setActiveTab] = useState("breakdown");
  const [costBreakdown, setCostBreakdown] = useState({});
  const [vesselCosts, setVesselCosts] = useState([]);
  const [costTrends, setCostTrends] = useState([]);
  const [savingsPotential, setSavingsPotential] = useState(0);

  // Initialize data when result changes
  useEffect(() => {
    if (!result) return;

    // Calculate detailed cost breakdown
    const breakdown = calculateCostBreakdown();
    setCostBreakdown(breakdown);

    // Calculate vessel-specific costs
    const vesselCostData = calculateVesselCosts();
    setVesselCosts(vesselCostData);

    // Generate cost trends
    const trends = generateCostTrends();
    setCostTrends(trends);

    // Calculate savings potential
    const savings = calculateSavingsPotential(breakdown.total);
    setSavingsPotential(savings);
  }, [result, vessels]);

  const calculateCostBreakdown = () => {
    if (!result?.routes) return { total: 0 };

    const baseFuelPrice = 600; // USD per ton of fuel
    const basePortCharge = 5000; // USD per port call
    const dailyOperatingRate = 10000; // USD per day
    const dailyCrewCost = 2250; // 15 crew * $150 per day

    let totalFuel = 0;
    let totalPortCharges = 0;
    let totalOperating = 0;
    let totalCrew = 0;
    let totalMaintenance = 0;

    result.routes.forEach((route) => {
      const vessel = vessels.find((v) => v.id === route.vessel);
      const voyageDays = (route.time || 0) / 24;

      // Fuel cost (more realistic calculation)
      const fuelCost = (route.fuelConsumption || 40) * baseFuelPrice * voyageDays;
      totalFuel += fuelCost;

      // Port charges (based on port type and duration)
      const portCharge = (route.ports || 0) * basePortCharge * (voyageDays > 5 ? 1.2 : 1);
      totalPortCharges += portCharge;

      // Operating costs
      const operatingCost = voyageDays * (vessel?.dailyOperatingCost || dailyOperatingRate);
      totalOperating += operatingCost;

      // Crew costs
      const crewCost = voyageDays * (vessel?.crew || 15) * 150;
      totalCrew += crewCost;

      // Maintenance (based on distance)
      const maintenanceCost = (route.distance || 0) * 0.8;
      totalMaintenance += maintenanceCost;
    });

    const total = totalFuel + totalPortCharges + totalOperating + totalCrew + totalMaintenance;

    return {
      total,
      fuel: Math.round(totalFuel),
      portCharges: Math.round(totalPortCharges),
      operating: Math.round(totalOperating),
      crew: Math.round(totalCrew),
      maintenance: Math.round(totalMaintenance),
    };
  };

  const calculateVesselCosts = () => {
    if (!result?.routes) return [];

    return result.routes.map((route) => {
      const vessel = vessels.find((v) => v.id === route.vessel);
      const voyageDays = (route.time || 0) / 24;
      const fuelCost = (route.fuelConsumption || 40) * 600 * voyageDays;
      const portCost = (route.ports || 0) * 5000;
      const operatingCost = voyageDays * (vessel?.dailyOperatingCost || 10000);
      const crewCost = voyageDays * (vessel?.crew || 15) * 150;
      const maintenanceCost = (route.distance || 0) * 0.8;

      const total = fuelCost + portCost + operatingCost + crewCost + maintenanceCost;

      return {
        name: vessel?.name || `Vessel ${route.vessel}`,
        vesselId: route.vessel,
        total: Math.round(total),
        fuel: Math.round(fuelCost),
        port: Math.round(portCost),
        operating: Math.round(operatingCost),
        crew: Math.round(crewCost),
        maintenance: Math.round(maintenanceCost),
        distance: route.distance || 0,
        ports: route.ports || 0,
        utilization: route.utilization || 75,
      };
    });
  };

  const generateCostTrends = () => {
    return [
      { month: "Jan", cost: 120000, savings: 15000 },
      { month: "Feb", cost: 135000, savings: 18000 },
      { month: "Mar", cost: 142000, savings: 22000 },
      { month: "Apr", cost: 128000, savings: 16000 },
      { month: "May", cost: 155000, savings: 25000 },
      { month: "Jun", cost: result?.totalCost || 185000, savings: 28000 },
    ];
  };

  const calculateSavingsPotential = (currentCost) => {
    // Calculate potential savings based on optimization
    const fuelSavings = currentCost * 0.15; // 15% fuel savings potential
    const portSavings = currentCost * 0.1; // 10% port optimization
    const routeSavings = currentCost * 0.08; // 8% route optimization

    return Math.round(fuelSavings + portSavings + routeSavings);
  };

  const getOptimizationSuggestions = () => {
    const suggestions = [];
    const breakdown = costBreakdown;

    if (breakdown.fuel / breakdown.total > 0.35) {
      suggestions.push({
        type: "high",
        title: "High Fuel Costs",
        description: "Fuel accounts for more than 35% of total costs. Consider reducing speed by 10% to save ~15% on fuel.",
        action: "Implement slow steaming",
        savings: Math.round(breakdown.fuel * 0.15),
        icon: "⛽",
      });
    }

    if (breakdown.portCharges / breakdown.total > 0.25) {
      suggestions.push({
        type: "medium",
        title: "Port Charges Optimization",
        description: "High port charges detected. Consolidate shipments and negotiate better rates.",
        action: "Port charge negotiation",
        savings: Math.round(breakdown.portCharges * 0.2),
        icon: "⚓",
      });
    }

    const vesselUtilization = result?.vesselUtilization || 0;
    if (vesselUtilization < 70) {
      suggestions.push({
        type: "low",
        title: "Low Vessel Utilization",
        description: `Vessel utilization at ${vesselUtilization}%. Consider route optimization.`,
        action: "Route consolidation",
        savings: Math.round(breakdown.total * 0.08),
        icon: "🚢",
      });
    }

    // Add general suggestions
    suggestions.push({
      type: "info",
      title: "Maintenance Schedule",
      description: "Regular maintenance can reduce operating costs by 5-10%.",
      action: "Schedule maintenance",
      savings: Math.round(breakdown.total * 0.05),
      icon: "🔧",
    });

    suggestions.push({
      type: "info",
      title: "Crew Optimization",
      description: "Optimal crew scheduling can reduce labor costs by 12%.",
      action: "Review crew schedules",
      savings: Math.round(breakdown.crew * 0.12),
      icon: "👥",
    });

    return suggestions;
  };

  const getVesselEfficiencyScore = (vessel) => {
    // Calculate efficiency score based on cost per distance
    const efficiency = vessel.distance > 0 ? vessel.total / vessel.distance : 100;
    if (efficiency < 50) return { score: 95, label: "Excellent", color: "#27ae60" };
    if (efficiency < 80) return { score: 80, label: "Good", color: "#3498db" };
    if (efficiency < 120) return { score: 65, label: "Average", color: "#f39c12" };
    return { score: 45, label: "Needs Improvement", color: "#e74c3c" };
  };

  if (!result) {
    return (
      <div className="cost-analysis no-data">
        <div className="no-data-content">
          <div className="no-data-icon">💰</div>
          <h3>No Cost Data Available</h3>
          <p>Run optimization to generate cost analysis</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Fuel", value: costBreakdown.fuel || 0, color: "#3498db" },
    { name: "Port Charges", value: costBreakdown.portCharges || 0, color: "#27ae60" },
    { name: "Operating", value: costBreakdown.operating || 0, color: "#9b59b6" },
    { name: "Crew", value: costBreakdown.crew || 0, color: "#f39c12" },
    { name: "Maintenance", value: costBreakdown.maintenance || 0, color: "#e74c3c" },
  ];

  const suggestions = getOptimizationSuggestions();

  return (
    <div className="cost-analysis">
      <div className="cost-header">
        <div className="header-content">
          <h2>
            <span className="header-icon">💰</span>
            Cost Analysis
          </h2>
          <div className="cost-tabs">
            <button className={`tab-btn ${activeTab === "breakdown" ? "active" : ""}`} onClick={() => setActiveTab("breakdown")}>
              <span className="tab-icon">📊</span>
              Breakdown
            </button>
            <button className={`tab-btn ${activeTab === "vessels" ? "active" : ""}`} onClick={() => setActiveTab("vessels")}>
              <span className="tab-icon">🚢</span>
              Vessels
            </button>
            <button className={`tab-btn ${activeTab === "trends" ? "active" : ""}`} onClick={() => setActiveTab("trends")}>
              <span className="tab-icon">📈</span>
              Trends
            </button>
            <button className={`tab-btn ${activeTab === "savings" ? "active" : ""}`} onClick={() => setActiveTab("savings")}>
              <span className="tab-icon">💸</span>
              Savings
            </button>
          </div>
        </div>
      </div>

      {/* Cost Summary Card */}
      <div className="cost-summary-card">
        <div className="summary-main">
          <div className="total-cost">
            <div className="total-label">Total Estimated Cost</div>
            <div className="total-amount">${(costBreakdown.total || 0).toLocaleString()}</div>
            <div className="cost-per-ton">${((costBreakdown.total || 0) / 1000).toFixed(2)} per ton</div>
          </div>
          <div className="summary-stats">
            <div className="stat-item">
              <div className="stat-label">Savings Potential</div>
              <div className="stat-value savings">${savingsPotential.toLocaleString()}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Vessel Utilization</div>
              <div className="stat-value">{result.vesselUtilization?.toFixed(1) || 0}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Cost per NM</div>
              <div className="stat-value">${(result.totalDistance ? costBreakdown.total / result.totalDistance : 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "breakdown" && (
          <div className="breakdown-content">
            <div className="chart-section">
              <h3>Cost Distribution</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Cost"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="breakdown-grid">
              {pieData.map((item, index) => {
                const percentage = ((item.value / costBreakdown.total) * 100).toFixed(1);
                return (
                  <div key={index} className="cost-breakdown-card">
                    <div className="cost-card-header">
                      <div className="cost-color" style={{ backgroundColor: item.color }}></div>
                      <div className="cost-title">{item.name}</div>
                    </div>
                    <div className="cost-card-body">
                      <div className="cost-amount">${item.value.toLocaleString()}</div>
                      <div className="cost-percentage">{percentage}%</div>
                    </div>
                    <div className="cost-card-footer">
                      <div className="cost-bar">
                        <div
                          className="cost-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "vessels" && (
          <div className="vessels-content">
            <h3>Vessel Cost Analysis</h3>
            <div className="vessel-costs-grid">
              {vesselCosts.map((vessel, index) => {
                const efficiency = getVesselEfficiencyScore(vessel);
                return (
                  <div key={index} className="vessel-cost-card">
                    <div className="vessel-card-header">
                      <div className="vessel-info">
                        <div className="vessel-name">{vessel.name}</div>
                        <div className="vessel-details">
                          <span>{vessel.distance.toLocaleString()} NM</span>
                          <span>•</span>
                          <span>{vessel.ports} Ports</span>
                        </div>
                      </div>
                      <div className="efficiency-badge" style={{ backgroundColor: efficiency.color }}>
                        {efficiency.score}%
                      </div>
                    </div>

                    <div className="vessel-cost-total">${vessel.total.toLocaleString()}</div>

                    <div className="vessel-cost-breakdown">
                      <div className="breakdown-item">
                        <span className="breakdown-label">Fuel</span>
                        <span className="breakdown-value">${vessel.fuel.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Port</span>
                        <span className="breakdown-value">${vessel.port.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Operating</span>
                        <span className="breakdown-value">${vessel.operating.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Crew</span>
                        <span className="breakdown-value">${vessel.crew.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="vessel-card-footer">
                      <div className="utilization-bar">
                        <div className="utilization-fill" style={{ width: `${vessel.utilization}%` }}></div>
                        <span>Utilization: {vessel.utilization}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <div className="trends-content">
            <h3>Cost Trends & Analysis</h3>
            <div className="trends-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#bbdefb" />
                  <YAxis stroke="#bbdefb" formatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, "Cost"]}
                    contentStyle={{
                      backgroundColor: "rgba(10, 25, 47, 0.95)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "10px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cost" name="Monthly Cost" fill="#3498db" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="savings" name="Potential Savings" fill="#27ae60" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="trends-insights">
              <div className="insight-card">
                <div className="insight-icon">📈</div>
                <div className="insight-content">
                  <h4>Monthly Trend</h4>
                  <p>Costs have increased by 15% compared to last month, mainly due to fuel price hikes.</p>
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-icon">💰</div>
                <div className="insight-content">
                  <h4>Savings Opportunity</h4>
                  <p>Implementing suggested optimizations could reduce costs by ${savingsPotential.toLocaleString()} this month.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "savings" && (
          <div className="savings-content">
            <h3>Optimization Suggestions</h3>
            <div className="savings-summary">
              <div className="savings-card total">
                <div className="savings-icon">💸</div>
                <div className="savings-content">
                  <div className="savings-label">Total Savings Potential</div>
                  <div className="savings-amount">${savingsPotential.toLocaleString()}</div>
                </div>
              </div>
              <div className="savings-card percentage">
                <div className="savings-icon">📉</div>
                <div className="savings-content">
                  <div className="savings-label">Cost Reduction</div>
                  <div className="savings-amount">{((savingsPotential / costBreakdown.total) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <div key={index} className={`suggestion-card ${suggestion.type}`} data-pulse={index < 2 ? "true" : "false"}>
                  <div className="suggestion-header">
                    <div className="suggestion-icon">{suggestion.icon}</div>
                    <div className="suggestion-title">{suggestion.title}</div>
                  </div>
                  <div className="suggestion-body">
                    <p>{suggestion.description}</p>
                  </div>
                  <div className="suggestion-footer">
                    <div className="savings-badge">Save ${suggestion.savings.toLocaleString()}</div>
                    <button className="action-btn">{suggestion.action} →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostAnalysis;
