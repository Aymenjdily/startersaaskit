import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: ['.env.local', '.env'] })

const url = process.env.DATABASE_URL

if (!url) {
  // drizzle-kit would otherwise fail deep inside the driver with a much less
  // obvious message. Fail here, naming the variable and where to set it.
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local (see .env.example) before running any db: script.',
  )
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url },
})
