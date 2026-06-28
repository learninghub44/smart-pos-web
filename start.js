#!/usr/bin/env node
// Must be set BEFORE requiring the server — Next.js standalone reads these at module load
process.env.HOSTNAME = '0.0.0.0'
process.env.PORT = process.env.PORT || '8080'

require('/standalone/server.js')
