import { Hono } from 'hono'
import { parseFitFile } from './utils/fitParser'
import { transformFitData } from './utils/dataTransformer'

const app = new Hono()

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
    
    // Return formatted HTML response
    return c.json(summary)
  } catch (error) {
    return c.json({ error: 'Failed to parse FIT file: ' + error }, 500)
  }
})

export default app
