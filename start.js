#!/usr/bin/env node
// Railway injects PORT as an env var. Next.js standalone reads process.env.PORT and process.env.HOSTNAME.
process.env.PORT = process.env.PORT || '8080'
process.env.HOSTNAME = '0.0.0.0'

require('./.next/standalone/server.js')
