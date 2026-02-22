#!/bin/bash

sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

sudo npm install -g pm2

cd ~
git clone https://github.com/takeallusername/Tunely-stock.git tunely
cd tunely/backend

cat > .env << 'EOF'
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
DART_API_KEY=
EOF

npm ci
npm run build
pm2 start dist/main.js --name tunely-backend
pm2 save
pm2 startup
