import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import handler from './dist/server/server.js'

const app = new Hono()

// Serve static assets from the client build
app.use('*', serveStatic({ root: './dist/client' }))

// Route all other requests to the TanStack Start handler
app.all('*', async (c) => {
  try {
    return await handler.fetch(c.req.raw)
  } catch (err) {
    console.error('SSR Handler Error:', err)
    return c.text('Internal Server Error', 500)
  }
})

const port = process.env.PORT || 3000

serve({
  fetch: app.fetch,
  port: Number(port)
}, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`)
})
