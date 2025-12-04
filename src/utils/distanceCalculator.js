// distanceCalculator.js

export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  // Validasi input
  if (typeof lat1 !== "number" || typeof lon1 !== "number" || typeof lat2 !== "number" || typeof lon2 !== "number") {
    console.error("Invalid coordinates:", { lat1, lon1, lat2, lon2 });
    return 0;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Convert to nautical miles (1 km = 0.539957 nautical miles)
  return distanceKm * 0.539957;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Calculate sailing time considering currents and weather
export const calculateSailingTime = (distance, vesselSpeed, conditions = {}) => {
  if (vesselSpeed <= 0) return 0;

  const baseTime = distance / vesselSpeed; // hours

  // Adjust for conditions
  let adjustment = 1.0;

  if (conditions.current === "against") adjustment *= 1.15;
  if (conditions.current === "with") adjustment *= 0.9;
  if (conditions.weather === "stormy") adjustment *= 1.3;
  if (conditions.weather === "calm") adjustment *= 0.95;

  return baseTime * adjustment;
};

// Calculate fuel consumption
export const calculateFuelConsumption = (distance, vessel, conditions = {}) => {
  if (!vessel || !vessel.speed || vessel.speed <= 0) {
    return { atSea: 0, atPort: 0, total: 0 };
  }

  const timeAtSea = calculateSailingTime(distance, vessel.speed, conditions) / 24;
  const fuelAtSea = timeAtSea * (vessel.fuelConsumption?.atSea || 20);

  // Add port fuel consumption (estimated 1 day per port)
  const portDays = 1; // Average days at port
  const fuelAtPort = portDays * (vessel.fuelConsumption?.atPort || 2);

  return {
    atSea: fuelAtSea,
    atPort: fuelAtPort,
    total: fuelAtSea + fuelAtPort,
  };
};

// Helper function untuk menghitung jarak antara array of ports
export const calculateRouteDistance = (ports) => {
  if (!ports || ports.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < ports.length - 1; i++) {
    const port1 = ports[i];
    const port2 = ports[i + 1];

    if (port1 && port2 && port1.location && port2.location) {
      totalDistance += calculateHaversineDistance(port1.location.lat, port1.location.lng, port2.location.lat, port2.location.lng);
    }
  }

  return totalDistance;
};

// Calculate great circle route points
export const calculateGreatCirclePoints = (lat1, lon1, lat2, lon2, numPoints = 10) => {
  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;

    // Spherical interpolation
    const φ1 = toRad(lat1);
    const λ1 = toRad(lon1);
    const φ2 = toRad(lat2);
    const λ2 = toRad(lon2);

    const δ = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2));

    if (δ === 0) {
      points.push({ lat: lat1, lng: lon1 });
      continue;
    }

    const a = Math.sin((1 - fraction) * δ) / Math.sin(δ);
    const b = Math.sin(fraction * δ) / Math.sin(δ);

    const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
    const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
    const z = a * Math.sin(φ1) + b * Math.sin(φ2);

    const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
    const λ = Math.atan2(y, x);

    points.push({
      lat: φ * (180 / Math.PI),
      lng: λ * (180 / Math.PI),
    });
  }

  return points;
};
