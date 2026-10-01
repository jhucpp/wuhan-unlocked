#!/bin/bash
export PATH="$HOME/.local/bin:$HOME/.local/node-v24.21.0/bin:$PATH"
exec vercel dev --yes --listen 3000
