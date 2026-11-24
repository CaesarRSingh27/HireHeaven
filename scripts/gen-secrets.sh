#!/usr/bin/env sh
# Creates .env from .env.example with fresh random secrets.
set -e
cd "$(dirname "$0")/.."
if [ -f .env ]; then echo ".env already exists - refusing to overwrite"; exit 1; fi
cp .env.example .env
JWT=$(openssl rand -hex 32)
KEY=$(openssl rand -hex 32)
sed -i.bak "s|^JWT_SEC=.*|JWT_SEC=$JWT|; s|^INTERNAL_API_KEY=.*|INTERNAL_API_KEY=$KEY|" .env
rm -f .env.bak
echo "Created .env with random JWT_SEC and INTERNAL_API_KEY."
echo "Now fill in DB_URL, Razorpay, Cloudinary, SMTP and Gemini values."
