import React, { useState, useEffect } from "react";
import "./TimeSchedule.css";

const TimeSchedule = ({ routes = [], ports = [] }) => {
  const [timeRange, setTimeRange] = useState("week");
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [animatedActivities, setAnimatedActivities] = useState([]);

  // Animasi untuk aktivitas baru
  useEffect(() => {
    if (routes.length > 0) {
      const activityIds = routes.flatMap((route, vesselIdx) => route.route?.map((_, activityIdx) => `${vesselIdx}-${activityIdx}`) || []);
      setAnimatedActivities(activityIds);

      // Hapus animasi setelah 2 detik
      const timer = setTimeout(() => {
        setAnimatedActivities([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [routes]);

  // Validasi dan generate schedule yang aman dengan warna yang lebih baik
  const generateSchedule = () => {
    const schedule = [];
    let currentTime = 0;

    // Filter routes yang valid
    const validRoutes = Array.isArray(routes) ? routes.filter((route) => route && route.vessel && Array.isArray(route.route)) : [];

    if (validRoutes.length === 0) {
      // Return mock schedule yang lebih menarik
      return [
        {
          vessel: "V001",
          vesselName: "MT Solar Express",
          vesselColor: "#3498db",
          activities: [
            {
              type: "departure",
              location: "Jakarta",
              start: 0,
              duration: 0.5,
              end: 0.5,
              color: "#9b59b6",
              icon: "🚢",
            },
            {
              type: "sailing",
              location: "Jakarta → Surabaya",
              start: 0.5,
              duration: 1.5,
              end: 2.0,
              color: "#3498db",
              icon: "🌊",
              weather: "Calm",
            },
            {
              type: "port",
              location: "Surabaya",
              start: 2.0,
              duration: 1.0,
              end: 3.0,
              demand: 8000,
              color: "#27ae60",
              icon: "⚓",
              status: "Loading",
            },
            {
              type: "sailing",
              location: "Surabaya → Balikpapan",
              start: 3.0,
              duration: 2.0,
              end: 5.0,
              color: "#3498db",
              icon: "🌊",
              weather: "Moderate",
            },
            {
              type: "port",
              location: "Balikpapan",
              start: 5.0,
              duration: 1.5,
              end: 6.5,
              demand: 12000,
              color: "#27ae60",
              icon: "⚓",
              status: "Unloading",
            },
          ],
        },
        {
          vessel: "V002",
          vesselName: "MT Energy Carrier",
          vesselColor: "#e74c3c",
          activities: [
            {
              type: "departure",
              location: "Surabaya",
              start: 1.0,
              duration: 0.5,
              end: 1.5,
              color: "#9b59b6",
              icon: "🚢",
            },
            {
              type: "sailing",
              location: "Surabaya → Makassar",
              start: 1.5,
              duration: 2.0,
              end: 3.5,
              color: "#3498db",
              icon: "🌊",
              weather: "Calm",
            },
            {
              type: "port",
              location: "Makassar",
              start: 3.5,
              duration: 1.2,
              end: 4.7,
              demand: 6500,
              color: "#27ae60",
              icon: "⚓",
              status: "Loading",
            },
          ],
        },
      ];
    }

    // Warna vessel yang berbeda-beda
    const vesselColors = ["#3498db", "#e74c3c", "#f39c12", "#2ecc71", "#9b59b6", "#1abc9c", "#34495e"];

    validRoutes.forEach((route, index) => {
      const vesselSchedule = {
        vessel: route.vessel,
        vesselName: route.vesselName || route.vessel || `Vessel ${index + 1}`,
        vesselColor: vesselColors[index % vesselColors.length],
        activities: [],
      };

      let accumulatedTime = currentTime;

      const routePorts = Array.isArray(route.route) ? route.route : [];

      if (routePorts.length > 0) {
        // Departure dari port pertama
        const firstPort = routePorts[0];
        vesselSchedule.activities.push({
          type: "departure",
          location: firstPort.name || firstPort || "Unknown Port",
          start: accumulatedTime,
          duration: 0.5,
          end: accumulatedTime + 0.5,
          color: "#9b59b6",
          icon: "🚢",
          weather: "Good",
        });

        accumulatedTime += 0.5;

        // Sailing dan port activities
        routePorts.forEach((port, idx) => {
          if (idx > 0) {
            const prevPort = routePorts[idx - 1];
            const sailingDuration = 0.8 + Math.random() * 1.2;
            const weatherConditions = ["Calm", "Moderate", "Good", "Fair"];
            vesselSchedule.activities.push({
              type: "sailing",
              location: `${prevPort.name || prevPort} → ${port.name || port}`,
              start: accumulatedTime,
              duration: sailingDuration,
              end: accumulatedTime + sailingDuration,
              color: "#3498db",
              icon: "🌊",
              weather: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
            });

            accumulatedTime += sailingDuration;
          }

          // Port activity
          const portDuration = 0.6 + Math.random() * 1.4;
          const portData = ports.find((p) => p.name === port || p.id === port || (typeof port === "object" && p.id === port.id));
          const portStatuses = ["Loading", "Unloading", "Waiting", "Refueling"];

          vesselSchedule.activities.push({
            type: "port",
            location: port.name || port || "Unknown Port",
            start: accumulatedTime,
            duration: portDuration,
            end: accumulatedTime + portDuration,
            demand: portData?.demand?.solar || Math.round(5000 + Math.random() * 10000),
            color: "#27ae60",
            icon: "⚓",
            status: portStatuses[Math.floor(Math.random() * portStatuses.length)],
            portType: portData?.type || "main_port",
          });

          accumulatedTime += portDuration;
        });

        // Return sailing jika ada lebih dari 1 port
        if (routePorts.length > 1) {
          const lastPort = routePorts[routePorts.length - 1];
          const firstPort = routePorts[0];
          const returnDuration = 1.5 + Math.random();
          vesselSchedule.activities.push({
            type: "sailing",
            location: `Return: ${lastPort.name || lastPort} → ${firstPort.name || firstPort}`,
            start: accumulatedTime,
            duration: returnDuration,
            end: accumulatedTime + returnDuration,
            color: "#e74c3c",
            icon: "🌊",
            weather: "Calm",
          });

          accumulatedTime += returnDuration;
        }
      }

      schedule.push(vesselSchedule);
      currentTime = Math.max(currentTime, accumulatedTime) + 0.5;
    });

    return schedule;
  };

  const scheduleData = generateSchedule();

  // Cari max end time
  const allEndTimes = scheduleData.flatMap((s) => s.activities.map((a) => a.end || 0));
  const totalDays = allEndTimes.length > 0 ? Math.ceil(Math.max(...allEndTimes)) : 7;

  const getTimeScale = () => {
    switch (timeRange) {
      case "day":
        return Array.from({ length: 24 }, (_, i) => ({
          label: `${i}:00`,
          value: i,
        }));
      case "week":
        return [
          { label: "Mon", value: 1 },
          { label: "Tue", value: 2 },
          { label: "Wed", value: 3 },
          { label: "Thu", value: 4 },
          { label: "Fri", value: 5 },
          { label: "Sat", value: 6 },
          { label: "Sun", value: 7 },
        ];
      case "month":
        return Array.from({ length: 30 }, (_, i) => ({
          label: i + 1,
          value: i + 1,
        }));
      default:
        return Array.from({ length: Math.min(14, totalDays) }, (_, i) => ({
          label: `Day ${i + 1}`,
          value: i + 1,
        }));
    }
  };

  const handleVesselSelect = (vessel) => {
    setSelectedVessel(selectedVessel === vessel ? null : vessel);
  };

  const getActivityTypeLabel = (type) => {
    switch (type) {
      case "sailing":
        return "Sailing";
      case "port":
        return "Port Operations";
      case "departure":
        return "Departure";
      default:
        return type;
    }
  };

  return (
    <div className="time-schedule">
      <div className="schedule-header">
        <div className="header-content">
          <h2>
            <span className="header-icon">📅</span>
            Time Schedule
          </h2>
          <div className="time-range-selector">
            <button className={`time-btn ${timeRange === "day" ? "active" : ""}`} onClick={() => setTimeRange("day")}>
              <span className="btn-icon">📅</span>
              Day View
            </button>
            <button className={`time-btn ${timeRange === "week" ? "active" : ""}`} onClick={() => setTimeRange("week")}>
              <span className="btn-icon">🗓️</span>
              Week View
            </button>
            <button className={`time-btn ${timeRange === "month" ? "active" : ""}`} onClick={() => setTimeRange("month")}>
              <span className="btn-icon">📆</span>
              Month View
            </button>
          </div>
        </div>
      </div>

      <div className="schedule-stats">
        {[
          { label: "Total Voyage Time", value: `${totalDays} days`, icon: "⏱️" },
          { label: "Port Calls", value: scheduleData.reduce((sum, s) => sum + s.activities.filter((a) => a.type === "port").length, 0), icon: "⚓" },
          { label: "Active Vessels", value: scheduleData.length, icon: "🚢" },
          { label: "Activities", value: scheduleData.reduce((sum, s) => sum + s.activities.length, 0), icon: "📋" },
        ].map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <strong className="stat-value">{stat.value}</strong>
            </div>
          </div>
        ))}
      </div>

      {scheduleData.length > 0 ? (
        <>
          <div className="gantt-container">
            <div className="gantt-header">
              <div className="vessel-label-header">Vessel</div>
              <div className="time-scale">
                {getTimeScale().map((time, idx) => (
                  <div key={idx} className="time-marker">
                    <span className="time-label">{time.label}</span>
                    <div className="time-line"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="gantt-body">
              {scheduleData.map((vesselSchedule, vesselIdx) => (
                <div key={vesselIdx} className={`gantt-row ${selectedVessel === vesselSchedule.vessel ? "selected" : ""}`} onClick={() => handleVesselSelect(vesselSchedule.vessel)}>
                  <div className="vessel-info">
                    <div className="vessel-color" style={{ backgroundColor: vesselSchedule.vesselColor }}></div>
                    <div className="vessel-details">
                      <div className="vessel-name">{vesselSchedule.vesselName}</div>
                      <div className="vessel-id">{vesselSchedule.vessel}</div>
                    </div>
                  </div>
                  <div className="activities-track">
                    <div className="timeline-background"></div>
                    {vesselSchedule.activities.map((activity, activityIdx) => {
                      const widthPercent = totalDays > 0 ? (activity.duration / totalDays) * 100 : 0;
                      const leftPercent = totalDays > 0 ? (activity.start / totalDays) * 100 : 0;
                      const activityId = `${vesselIdx}-${activityIdx}`;
                      const isNew = animatedActivities.includes(activityId);

                      return (
                        <div
                          key={activityIdx}
                          className={`activity-bar ${activity.type} ${isNew ? "pulse" : ""}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            backgroundColor: activity.color || "#3498db",
                            borderLeft: `3px solid ${activity.color}80`,
                            borderRight: `3px solid ${activity.color}80`,
                          }}
                          data-tooltip={`
                            <strong>${getActivityTypeLabel(activity.type)}</strong><br/>
                            <strong>Location:</strong> ${activity.location}<br/>
                            <strong>Time:</strong> Day ${activity.start.toFixed(1)} - ${activity.end.toFixed(1)}<br/>
                            <strong>Duration:</strong> ${activity.duration.toFixed(1)} days<br/>
                            ${activity.weather ? `<strong>Weather:</strong> ${activity.weather}<br/>` : ""}
                            ${activity.status ? `<strong>Status:</strong> ${activity.status}<br/>` : ""}
                            ${activity.demand ? `<strong>Demand:</strong> ${activity.demand.toLocaleString()} ton` : ""}
                          `}
                        >
                          <span className="activity-icon">{activity.icon || "📋"}</span>
                          <span className="activity-duration">{activity.duration.toFixed(1)}d</span>
                          <div className="activity-glow"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="legend">
            <h3>Activity Legend</h3>
            <div className="legend-grid">
              <div className="legend-item">
                <div className="legend-color sailing"></div>
                <div className="legend-content">
                  <span className="legend-title">Sailing</span>
                  <span className="legend-desc">Vessel in transit</span>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-color port"></div>
                <div className="legend-content">
                  <span className="legend-title">Port Operations</span>
                  <span className="legend-desc">Loading/unloading</span>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-color departure"></div>
                <div className="legend-content">
                  <span className="legend-title">Departure/Arrival</span>
                  <span className="legend-desc">Port entry/exit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Details Panel */}
          <div className="activity-details-panel">
            <h3>
              <span className="panel-icon">📋</span>
              Activity Details
            </h3>
            <div className="activity-grid">
              {scheduleData
                .filter((v) => !selectedVessel || v.vessel === selectedVessel)
                .slice(0, 2)
                .flatMap((vesselSchedule, vesselIdx) =>
                  vesselSchedule.activities.slice(0, 4).map((activity, activityIdx) => (
                    <div
                      key={`${vesselIdx}-${activityIdx}`}
                      className="activity-card"
                      style={{
                        borderLeft: `4px solid ${activity.color}`,
                        background: `linear-gradient(135deg, ${activity.color}15, transparent)`,
                      }}
                    >
                      <div className="activity-card-header">
                        <div className="activity-type">
                          <span className="activity-icon">{activity.icon}</span>
                          <span className="activity-type-text">{getActivityTypeLabel(activity.type)}</span>
                        </div>
                        <div className="activity-status" style={{ color: activity.color }}>
                          {activity.weather || activity.status || "Active"}
                        </div>
                      </div>
                      <div className="activity-card-body">
                        <div className="activity-info">
                          <span className="info-label">Vessel:</span>
                          <span className="info-value">{vesselSchedule.vesselName}</span>
                        </div>
                        <div className="activity-info">
                          <span className="info-label">Location:</span>
                          <span className="info-value">{activity.location}</span>
                        </div>
                        <div className="activity-info">
                          <span className="info-label">Time:</span>
                          <span className="info-value">
                            Day {activity.start.toFixed(1)} - {activity.end.toFixed(1)}
                          </span>
                        </div>
                        <div className="activity-info">
                          <span className="info-label">Duration:</span>
                          <span className="info-value">{activity.duration.toFixed(1)} days</span>
                        </div>
                        {activity.demand > 0 && (
                          <div className="activity-info">
                            <span className="info-label">Solar Demand:</span>
                            <span className="info-value demand">{activity.demand.toLocaleString()} ton</span>
                          </div>
                        )}
                      </div>
                      <div className="activity-card-footer">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(activity.duration / totalDays) * 100}%`,
                              backgroundColor: activity.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </div>
        </>
      ) : (
        <div className="no-data">
          <div className="no-data-icon">📅</div>
          <h3>No Schedule Data</h3>
          <p>Run optimization to generate vessel schedules</p>
          <button className="cta-button">Run Optimization</button>
        </div>
      )}
    </div>
  );
};

export default TimeSchedule;
