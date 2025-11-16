# MySociety Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies

From the project root:
```bash
npm run install-all
```

This installs dependencies for:
- Root package (concurrently for running both servers)
- Server (Express, ExcelJS, etc.)
- Client (React, Chakra UI, etc.)

### 2. Configure Backend

1. Navigate to server directory:
```bash
cd server
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Edit `.env` file:
```env
# Required
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001

# Optional - Excel file paths
EXCEL_FILE_PATH=./data/mysociety_data.xlsx
BACKUP_DIR=./backups

# Optional - WhatsApp (use 'mock' for development)
WHATSAPP_PROVIDER=mock
# For Twilio (install twilio package first):
# WHATSAPP_PROVIDER=twilio
# TWILIO_ACCOUNT_SID=your-account-sid
# TWILIO_AUTH_TOKEN=your-auth-token
# TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
# WHATSAPP_GROUP_ID=your-group-id
```

### 3. Start the Application

From project root:
```bash
npm run dev
```

This starts both servers:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### 4. Access the Application

1. Open browser: http://localhost:3000
2. Login with demo credentials:
   - Username: `admin`
   - Password: `admin123`

### 5. Optional: Configure WhatsApp (Production)

If you want real WhatsApp notifications:

1. Install Twilio SDK:
```bash
cd server
npm install twilio
```

2. Sign up for Twilio: https://www.twilio.com
3. Get WhatsApp API access from Twilio
4. Update `.env` with Twilio credentials
5. Set `WHATSAPP_PROVIDER=twilio` in `.env`

## First Use

1. The Excel file will be created automatically when you add your first expense or payment
2. Backups are created automatically on every write operation
3. Check the `data/` directory for the Excel file
4. Check the `backups/` directory for automatic backups

## Testing the System

1. **Add an Expense:**
   - Go to "Expense Management" tab
   - Click "Add Expense"
   - Fill in: Description, Amount, Date
   - Click "Save"
   - Check server console for WhatsApp notification (mock mode)

2. **Add a Payment:**
   - Go to "Payments" tab
   - Click "Add Payment"
   - Fill in: Villa No, Amount, Date
   - Click "Save"

3. **Search/Filter:**
   - Use date range filters to search expenses/payments
   - Click "Search" button

4. **Edit/Delete:**
   - Click edit/delete icons on any row
   - Confirm delete action

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is in use:
- Change `PORT` in `server/.env`
- Change proxy in `client/package.json` or set `REACT_APP_API_URL` environment variable

### Excel File Errors
- Ensure `data/` directory is writable
- Check file permissions
- Delete corrupted file and let system recreate it

### Authentication Issues
- Ensure `JWT_SECRET` is set in `.env`
- Clear browser localStorage if token issues persist

### WhatsApp Not Working
- Check provider is set correctly in `.env`
- For Twilio: ensure package is installed and credentials are correct
- Check server logs for error messages

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper WhatsApp provider credentials
4. Set up HTTPS
5. Use a process manager (PM2, systemd)
6. Configure proper backup retention policy
7. Consider migrating to a database for better scalability

