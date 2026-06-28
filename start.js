#!/usr/bin/env node
process.env.PORT = process.env.PORT || '8080'
process.env.HOSTNAME = '0.0.0.0'
// Trust Railway's reverse proxy so redirects use https://
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

require('/standalone/server.js')
