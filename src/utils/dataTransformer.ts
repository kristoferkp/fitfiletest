export interface FitSummary {
  sport: string | null;
  sportProfile: any | null;
  records: any[];
  laps: any[];
  sessions: any[];
  totalDistance: number | null;
  totalDuration: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgCadence: number | null;
  maxCadence: number | null;
  avgSpeed: number | null;
  maxSpeed: number | null;
  startTime: string | null;
  endTime: string | null;
  // New advanced metrics
  normalizedPower: number | null;
  variabilityIndex: number | null;
  totalElevationGain: number | null;
  totalCalories: number | null;
  avgPace: string | null;
  maxPace: string | null;
  avgTemperature: number | null;
}

// Helper function to calculate normalized power
function calculateNormalizedPower(powerData: number[]): number | null {
  if (!powerData || powerData.length === 0) {
    return null;
  }

  // Filter out null/undefined values
  const validPowerData = powerData.filter(p => p !== null && p !== undefined);
  if (validPowerData.length === 0) {
    return null;
  }

  // Calculate 30-second moving average (assuming 1-second intervals)
  const windowSize = 30;
  const rollingAvgPower = [];
  
  for (let i = 0; i < validPowerData.length - windowSize + 1; i++) {
    const window = validPowerData.slice(i, i + windowSize);
    const avgPower = window.reduce((sum, val) => sum + val, 0) / window.length;
    rollingAvgPower.push(avgPower);
  }

  if (rollingAvgPower.length === 0) {
    return null;
  }

  // Calculate the 4th power and average
  const fourthPowerSum = rollingAvgPower.reduce((sum, power) => sum + Math.pow(power, 4), 0);
  const fourthPowerAvg = fourthPowerSum / rollingAvgPower.length;
  
  // Take the 4th root
  const normalizedPower = Math.pow(fourthPowerAvg, 1/4);
  return Math.round(normalizedPower);
}

// Helper function to format pace (min/km)
function formatPace(speedMps: number | null): string | null {
  if (!speedMps || speedMps <= 0) return null;
  
  // Convert km/h to min/km
  const paceMinPerKm = 60 / speedMps;
  
  // Extract minutes and seconds parts
  const paceMinutes = Math.floor(paceMinPerKm);
  const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60);
  
  // Handle case where seconds rounds up to 60
  let adjustedMinutes = paceMinutes;
  let adjustedSeconds = paceSeconds;
  
  if (adjustedSeconds === 60) {
    adjustedMinutes++;
    adjustedSeconds = 0;
  }
  
  // Format output as MM:SS/km
  return `${adjustedMinutes}:${adjustedSeconds.toString().padStart(2, '0')}/km`;
}

export const transformFitData = (fitData: any): FitSummary => {
  // Log all top-level fields in the FIT file
  console.log('Available FIT file fields:');
  const fields = Object.keys(fitData);
  console.log('Top-level fields:', fields);
  
  // Log the structure of each field
  fields.forEach(field => {
    const value = fitData[field];
    const type = Array.isArray(value) ? 'array' : typeof value;
    
    console.log(`\n==== Field: ${field} (${type}) ====`);
    
    if (Array.isArray(value)) {
      console.log(`Length: ${value.length}`);
      if (value.length > 0) {
        // Log structure of the first item to understand the data shape
        console.log('Sample item structure:', Object.keys(value[0] || {}));
        console.log('Sample item:', value.length > 0 ? value[0] : 'No items');
      }
    } else if (typeof value === 'object' && value !== null) {
      console.log('Object keys:', Object.keys(value));
      console.log('Sample:', value);
    } else {
      console.log('Value:', value);
    }
  });
  
  // Extract data from the FIT file
  const records = fitData.records || [];
  const laps = fitData.laps || [];
  const sessions = fitData.sessions || [];
  
  // Extract sport information
  let sport = null;
  let sportProfile = null;
  
  if (fitData.sport && fitData.sport.length > 0) {
    sport = fitData.sport[0].sport;
    sportProfile = fitData.sport[0];
  } else if (sessions.length > 0 && sessions[0].sport) {
    sport = sessions[0].sport;
  }
  
  // Calculate summary metrics from sessions if available
  let totalDistance = null;
  let totalDuration = null;
  let avgHeartRate = null;
  let maxHeartRate = null;
  let avgCadence = null;
  let maxCadence = null;
  let avgSpeed = null;
  let maxSpeed = null;
  let startTime = null;
  let endTime = null;
  let totalElevationGain = null;
  let totalCalories = null;
  let avgTemperature = null;
  
  if (sessions.length > 0) {
    const session = sessions[0]; // Take the first session for summary data
    
    totalDistance = session.total_distance;
    totalDuration = session.total_timer_time;
    avgHeartRate = session.avg_heart_rate;
    maxHeartRate = session.max_heart_rate;
    avgCadence = session.avg_cadence;
    maxCadence = session.max_cadence;
    avgSpeed = session.enhanced_avg_speed || session.avg_speed;
    maxSpeed = session.enhanced_max_speed || session.max_speed;
    totalElevationGain = session.total_ascent;
    totalCalories = session.total_calories;
    avgTemperature = session.avg_temperature;
    
    startTime = session.start_time ? new Date(session.start_time).toISOString() : null;
    endTime = session.timestamp ? new Date(session.timestamp).toISOString() : null;
  }
  
  // Advanced metrics calculation
  // Extract power data from records
  const powerData = records.map(record => record.power).filter(Boolean);
  const normalizedPower = calculateNormalizedPower(powerData);
  
  // Calculate variability index (NP / Avg Power)
  let variabilityIndex = null;
  const avgPower = powerData.length > 0 
    ? powerData.reduce((sum, val) => sum + val, 0) / powerData.length 
    : null;
  
  if (normalizedPower && avgPower) {
    variabilityIndex = parseFloat((normalizedPower / avgPower).toFixed(2));
  }
  
  const avgPace = formatPace(avgSpeed);
  const maxPace = formatPace(maxSpeed);
  
  // Compile the summary
  const summary: FitSummary = {
    sport,
    sportProfile,
    records,
    laps,
    sessions,
    totalDistance,
    totalDuration,
    avgHeartRate,
    maxHeartRate,
    avgCadence,
    maxCadence,
    avgSpeed,
    maxSpeed,
    startTime,
    endTime,
    normalizedPower,
    variabilityIndex,
    totalElevationGain,
    totalCalories,
    avgPace,
    maxPace,
    avgTemperature
  };
  
  return summary;
};

