import { Hono } from 'hono'
import { parseFitFile } from './utils/fitParser'
import { transformFitData } from './utils/dataTransformer'
import fs from 'fs'
import path from 'path'

const app = new Hono()

// Helper function to format duration
function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours}h ${minutes}m ${secs}s`;
}

// Helper function to format distance
function formatDistance(meters: number | null): string {
  if (meters === null) return '-';
  return (meters / 1000).toFixed(2);
}

app.get('/', (c) => {
  return c.html(`
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="fitFile" accept=".fit">
      <button type="submit">Upload and Parse</button>
    </form>
  `)
})

app.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body.fitFile as File

  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400)
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const rawData = await parseFitFile(arrayBuffer)
    const summary = transformFitData(rawData)
    
    // Read the HTML template
    const templatePath = path.join(__dirname, 'templates', 'fitView.html')
    let template = '';
    
    try {
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
      console.error('Error reading template file:', err);
      // If template file isn't available (dev environment), return JSON
      return c.json(summary);
    }
    
    // Format data for display
    const activityDate = summary.startTime ? new Date(summary.startTime).toLocaleDateString() : 'Unknown Date';
    const activityTitle = `${summary.sport || 'Activity'} on ${activityDate}`;
    
    // Replace template placeholders
    const htmlContent = template
      .replace('{{activityTitle}}', activityTitle)
      .replace('{{sport}}', summary.sport || 'Unknown')
      .replace('{{totalDistance}}', formatDistance(summary.totalDistance))
      .replace('{{totalDuration}}', formatDuration(summary.totalDuration))
      .replace('{{avgHeartRate}}', summary.avgHeartRate?.toString() || '-')
      .replace('{{maxHeartRate}}', summary.maxHeartRate?.toString() || '-')
      .replace('{{avgSpeed}}', summary.avgSpeed ? (summary.avgSpeed).toFixed(1) : '-')
      .replace('{{maxSpeed}}', summary.maxSpeed ? (summary.maxSpeed).toFixed(1) : '-')
      // Make sure pace is shown properly
      .replace('{{avgPace}}', summary.avgPace || '-')
      .replace('{{avgCadence}}', summary.avgCadence?.toString() || '-')
      .replace('{{normalizedPower}}', summary.normalizedPower?.toString() || '-')
      .replace('{{variabilityIndex}}', summary.variabilityIndex?.toString() || '-')
      .replace('{{totalElevationGain}}', summary.totalElevationGain?.toString() || '-')
      .replace('{{totalCalories}}', summary.totalCalories?.toString() || '-')
      .replace('{{avgTemperature}}', summary.avgTemperature?.toString() || '-')
      .replace('{{fitDataJson}}', JSON.stringify(summary));
    
    return c.html(htmlContent);
  } catch (error) {
    return c.json({ error: 'Failed to parse FIT file: ' + error }, 500)
  }
})

export default app
