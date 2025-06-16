#!/bin/sh
set -e

# Iniciar aplicación Node.js
exec node dist/index.js "$@"