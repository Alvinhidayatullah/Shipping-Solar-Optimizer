import { calculateHaversineDistance } from "./distanceCalculator";

// Vehicle Routing Problem dengan Time Windows untuk shipping
export const optimizeShippingRoutes = ({ vessels, ports, demands, timeWindows, constraints }) => {
  // Validasi input
  if (!vessels || vessels.length === 0) {
    throw new Error("No vessels provided");
  }
  if (!ports || ports.length === 0) {
    throw new Error("No ports provided");
  }

  // 1. Cluster ports berdasarkan proximity dan demand
  const clusters = clusterPortsByProximity(ports, demands, vessels.length);

  // 2. Assign vessels to clusters
  const assignments = assignVesselsToClusters(vessels, clusters);

  // 3. Solve TSP untuk setiap cluster
  const optimizedRoutes = assignments.map(({ vessel, cluster }) => {
    return solveTSPForCluster(vessel, cluster, timeWindows, constraints);
  });

  // 4. Calculate total costs
  const totalCost = optimizedRoutes.reduce((sum, route) => {
    const vessel = vessels.find((v) => v.id === route.vessel);
    return sum + (route.cost || 0);
  }, 0);

  return {
    routes: optimizedRoutes,
    totalCost,
    vesselUtilization: calculateVesselUtilization(optimizedRoutes, vessels),
    estimatedTime: calculateTotalTime(optimizedRoutes),
    totalDistance: optimizedRoutes.reduce((sum, r) => sum + (r.distance || 0), 0),
  };
};

// Fungsi yang hilang: Assign vessels to clusters
const assignVesselsToClusters = (vessels, clusters) => {
  const assignments = [];

  // Sort vessels by capacity (descending)
  const sortedVessels = [...vessels].sort((a, b) => b.capacity - a.capacity);

  // Sort clusters by total demand (descending)
  const clustersWithDemand = clusters
    .map((cluster, index) => {
      const totalDemand = cluster.reduce((sum, port) => sum + (port.demand?.solar || 0), 0);
      return { index, cluster, totalDemand };
    })
    .sort((a, b) => b.totalDemand - a.totalDemand);

  // Assign vessels to clusters (simple round-robin)
  clustersWithDemand.forEach(({ index, cluster, totalDemand }, i) => {
    if (i < sortedVessels.length) {
      assignments.push({
        vessel: sortedVessels[i],
        cluster: cluster,
        clusterIndex: index,
      });
    } else {
      // If more clusters than vessels, assign to first vessel
      assignments.push({
        vessel: sortedVessels[0],
        cluster: cluster,
        clusterIndex: index,
      });
    }
  });

  return assignments;
};

// Algoritma clustering sederhana
const clusterPortsByProximity = (ports, demands, numberOfClusters) => {
  if (ports.length <= numberOfClusters) {
    return ports.map((port) => [port]);
  }

  // K-means clustering sederhana
  const centroids = ports.slice(0, numberOfClusters);
  let clusters = Array(numberOfClusters)
    .fill()
    .map(() => []);
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    iterations++;

    // Reset clusters
    clusters = Array(numberOfClusters)
      .fill()
      .map(() => []);

    // Assign each port to nearest centroid
    ports.forEach((port) => {
      let minDistance = Infinity;
      let closestCentroidIndex = 0;

      centroids.forEach((centroid, idx) => {
        if (centroid && centroid.location) {
          const distance = calculateHaversineDistance(port.location.lat, port.location.lng, centroid.location.lat, centroid.location.lng);

          if (distance < minDistance) {
            minDistance = distance;
            closestCentroidIndex = idx;
          }
        }
      });

      if (clusters[closestCentroidIndex]) {
        clusters[closestCentroidIndex].push(port);
      }
    });

    // Recalculate centroids
    changed = false;
    clusters.forEach((cluster, idx) => {
      if (cluster.length > 0) {
        const avgLat = cluster.reduce((sum, p) => sum + p.location.lat, 0) / cluster.length;
        const avgLng = cluster.reduce((sum, p) => sum + p.location.lng, 0) / cluster.length;

        // Find actual port closest to new centroid
        let closestPort = cluster[0];
        let minDist = Infinity;

        cluster.forEach((port) => {
          const dist = Math.sqrt(Math.pow(port.location.lat - avgLat, 2) + Math.pow(port.location.lng - avgLng, 2));

          if (dist < minDist) {
            minDist = dist;
            closestPort = port;
          }
        });

        if (centroids[idx]?.id !== closestPort.id) {
          centroids[idx] = closestPort;
          changed = true;
        }
      }
    });
  }

  // Filter out empty clusters
  return clusters.filter((cluster) => cluster.length > 0);
};

// Traveling Salesman Problem solver dengan constraints
const solveTSPForCluster = (vessel, ports, timeWindows = {}, constraints = {}) => {
  if (!ports || ports.length === 0) {
    return {
      vessel: vessel.id,
      route: [],
      distance: 0,
      time: 0,
      cost: 0,
      fuelConsumption: 0,
    };
  }

  if (ports.length === 1) {
    const singlePortCost = calculateSinglePortCost(vessel, ports[0]);
    return {
      vessel: vessel.id,
      route: ports,
      distance: 0,
      time: 0,
      cost: singlePortCost,
      fuelConsumption: 0,
    };
  }

  // Nearest Neighbor heuristic
  const visited = new Set();
  const route = [];
  let currentPort = ports[0]; // Start from first port
  let totalDistance = 0;

  route.push(currentPort);
  visited.add(currentPort.id);

  while (visited.size < ports.length) {
    let nearestPort = null;
    let minDistance = Infinity;

    ports.forEach((port) => {
      if (!visited.has(port.id)) {
        const distance = calculateHaversineDistance(currentPort.location.lat, currentPort.location.lng, port.location.lat, port.location.lng);

        // Check time window constraint
        const arrivalTime = calculateArrivalTime(totalDistance, vessel.speed);
        const timeWindow = timeWindows[port.id] || { open: 0, close: 24 };

        if (distance < minDistance && arrivalTime >= timeWindow.open && arrivalTime <= timeWindow.close) {
          minDistance = distance;
          nearestPort = port;
        }
      }
    });

    if (nearestPort) {
      route.push(nearestPort);
      visited.add(nearestPort.id);
      totalDistance += minDistance;
      currentPort = nearestPort;
    } else {
      // If no port fits time window, go to closest without time constraint
      ports.forEach((port) => {
        if (!visited.has(port.id)) {
          const distance = calculateHaversineDistance(currentPort.location.lat, currentPort.location.lng, port.location.lat, port.location.lng);

          if (distance < minDistance) {
            minDistance = distance;
            nearestPort = port;
          }
        }
      });

      if (nearestPort) {
        route.push(nearestPort);
        visited.add(nearestPort.id);
        totalDistance += minDistance;
        currentPort = nearestPort;
      }
    }
  }

  // Return to starting point if needed
  if (constraints.returnToStart && route.length > 1) {
    const returnDistance = calculateHaversineDistance(currentPort.location.lat, currentPort.location.lng, route[0].location.lat, route[0].location.lng);
    totalDistance += returnDistance;
  }

  const totalTime = totalDistance / Math.max(vessel.speed, 1); // hours, avoid division by zero
  const totalCost = calculateRouteCostForVessel(
    {
      distance: totalDistance,
      time: totalTime,
      ports: route.length,
    },
    vessel
  );

  return {
    vessel: vessel.id,
    route,
    distance: totalDistance,
    time: totalTime,
    cost: totalCost,
    fuelConsumption: (totalTime / 24) * (vessel.fuelConsumption?.atSea || 20),
  };
};

// Helper functions
const calculateArrivalTime = (distance, speed) => {
  if (speed <= 0) return 0;
  const travelHours = distance / speed;
  return travelHours % 24;
};

const calculateSinglePortCost = (vessel, port) => {
  const portCosts = port.charges?.berthing || 5000;
  const operatingCost = vessel.dailyOperatingCost || 10000;
  const crewCost = vessel.crew * 150 || 2250; // $150/crew/day

  return portCosts + operatingCost + crewCost;
};

const calculateRouteCostForVessel = (route, vessel) => {
  const fuelCost = (route.time / 24) * (vessel.fuelConsumption?.atSea || 20) * 600; // $600/ton
  const portCosts = route.ports * 5000; // Average port charges
  const operatingCost = (route.time / 24) * (vessel.dailyOperatingCost || 10000);
  const crewCost = (route.time / 24) * (vessel.crew || 15) * 150; // $150/crew/day

  return fuelCost + portCosts + operatingCost + crewCost;
};

const calculateVesselUtilization = (routes, vessels) => {
  if (vessels.length === 0) return 0;

  const totalCapacity = vessels.reduce((sum, v) => sum + (v.capacity || 0), 0);
  if (totalCapacity === 0) return 0;

  const usedCapacity = routes.reduce((sum, r) => {
    const vessel = vessels.find((v) => v.id === r.vessel);
    return sum + (vessel ? vessel.capacity || 0 : 0);
  }, 0);

  return (usedCapacity / totalCapacity) * 100;
};

const calculateTotalTime = (routes) => {
  return routes.reduce((sum, r) => sum + (r.time || 0), 0);
};

// Fungsi helper tambahan untuk debugging
export const debugOptimization = (params) => {
  console.log("Optimization Parameters:", params);

  const result = optimizeShippingRoutes(params);
  console.log("Optimization Result:", result);

  return result;
};

// Simplified version untuk testing cepat
export const simpleOptimization = ({ vessels, ports }) => {
  // Simple greedy algorithm untuk testing
  const routes = [];

  vessels.forEach((vessel) => {
    if (ports.length > 0) {
      // Take first few ports based on vessel capacity
      const portsPerVessel = Math.min(ports.length, 3);
      const assignedPorts = ports.slice(0, portsPerVessel);

      // Calculate total distance (simplified)
      let totalDistance = 0;
      for (let i = 0; i < assignedPorts.length - 1; i++) {
        const dist = calculateHaversineDistance(assignedPorts[i].location.lat, assignedPorts[i].location.lng, assignedPorts[i + 1].location.lat, assignedPorts[i + 1].location.lng);
        totalDistance += dist;
      }

      const totalTime = totalDistance / vessel.speed;
      const totalCost = calculateRouteCostForVessel({ distance: totalDistance, time: totalTime, ports: assignedPorts.length }, vessel);

      routes.push({
        vessel: vessel.id,
        route: assignedPorts,
        distance: totalDistance,
        time: totalTime,
        cost: totalCost,
      });

      // Remove assigned ports
      ports = ports.slice(portsPerVessel);
    }
  });

  const totalCost = routes.reduce((sum, r) => sum + r.cost, 0);
  const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);

  return {
    routes,
    totalCost,
    totalDistance,
    vesselUtilization: calculateVesselUtilization(routes, vessels),
    estimatedTime: calculateTotalTime(routes),
  };
};
