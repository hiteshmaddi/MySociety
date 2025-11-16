# Quick Start Commands

## Step 1: Install Dependencies
```bash
npm run install-all
```

## Step 2: Configure Environment Variables
```bash
cd server
copy ENV_TEMPLATE.txt .env
```

Then edit `server/.env` and set a secure `JWT_SECRET`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
```

## Step 3: Start the Application
```bash
cd ..
npm run dev
```

This will start:
- Backend API on http://localhost:3001
- Frontend on http://localhost:3000

## Step 4: Access the Application
Open your browser and go to: **http://localhost:3000**

Login with:
- Username: `admin`
- Password: `admin123`

---

## Alternative: Run Servers Separately

### Terminal 1 - Backend:
```bash
cd server
npm install
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd client
npm install
npm start
```

---

## Troubleshooting

If you get port errors, you can change the ports:
- Backend port: Edit `server/.env` → `PORT=3001`
- Frontend port: Edit `client/package.json` → change the start script or set `PORT=3000` in environment

