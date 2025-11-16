# MySociety - Expense & Payment Management System

A web application for managing residential society expenses and payments with Excel persistence and WhatsApp notifications.

## Features

- **Expense Management**: Add, view, edit, and delete expenses with date range filtering
- **Payment Tracking**: Record and manage payments from residents
- **Excel Persistence**: All data stored in Excel files with safe concurrent access and file locking
- **WhatsApp Notifications**: Automatic notifications on record changes (supports Twilio or mock mode)
- **Backup System**: Automatic timestamped backups on every write operation
- **Audit Trail**: Track all changes with user and timestamp information
- **Authentication**: JWT-based authentication with role-based access control
- **Modern UI**: Beautiful, responsive interface built with React and Chakra UI

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Chakra UI
- **Storage**: Excel files (ExcelJS) with atomic writes and locking
- **Notifications**: WhatsApp API integration (Twilio/Meta) or mock mode for development
- **Authentication**: JWT tokens

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install all dependencies:**
```bash
npm run install-all
```

2. **Configure environment variables:**
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:
- Set `JWT_SECRET` to a secure random string
- For WhatsApp notifications, configure Twilio credentials (or use `mock` provider for development)

3. **Start development servers:**
```bash
npm run dev
```

This will start:
- Backend API: http://localhost:3001
- Frontend: http://localhost:3000

### Default Login Credentials

- **Admin**: `admin` / `admin123`
- **Treasurer**: `treasurer` / `treasurer123`
- **Resident**: `resident` / `resident123`

## Environment Variables

### Required
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 3001)

### Optional
- `EXCEL_FILE_PATH`: Path to Excel data file (default: `./data/mysociety_data.xlsx`)
- `BACKUP_DIR`: Directory for backups (default: `./backups`)
- `WHATSAPP_PROVIDER`: `mock` (default) or `twilio`
- `TWILIO_ACCOUNT_SID`: Twilio account SID (if using Twilio)
- `TWILIO_AUTH_TOKEN`: Twilio auth token (if using Twilio)
- `TWILIO_WHATSAPP_FROM`: Twilio WhatsApp sender number
- `WHATSAPP_GROUP_ID`: WhatsApp group/recipient ID

## Project Structure

```
MySociety/
├── server/
│   ├── services/        # Business logic (ExcelService, NotificationService)
│   ├── routes/          # API route handlers
│   ├── middleware/      # Auth middleware
│   └── index.js         # Express server
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client
│   │   └── context/     # React context (Auth)
│   └── public/
├── data/                # Excel data files (auto-generated)
└── backups/             # Excel backups (auto-generated)
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login and get JWT token

### Expenses
- `GET /api/v1/expenses?from=YYYY-MM-DD&to=YYYY-MM-DD` - List expenses
- `POST /api/v1/expenses` - Create expense
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Payments
- `GET /api/v1/payments?from=YYYY-MM-DD&to=YYYY-MM-DD` - List payments
- `POST /api/v1/payments` - Create payment
- `PUT /api/v1/payments/:id` - Update payment
- `DELETE /api/v1/payments/:id` - Delete payment

### Admin (requires admin/treasurer role)
- `GET /api/v1/admin/file/download` - Download Excel file
- `POST /api/v1/admin/backup` - Create manual backup
- `GET /api/v1/admin/backups` - List backups

All endpoints (except login) require `Authorization: Bearer <token>` header.

## Excel File Structure

The system uses a single Excel file (`mysociety_data.xlsx`) with two sheets:

### Expenses Sheet
- id, expense_desc, amount, date, villa_no, created_by, created_at, modified_by, modified_at, deleted, notes

### Payments Sheet
- id, villa_no, amount, date, payment_mode, created_by, created_at, modified_by, modified_at, deleted, reference_no

## WhatsApp Notifications

The system sends WhatsApp notifications for all create/update/delete operations. 

**Development Mode**: Uses mock provider (logs to console)
**Production Mode**: Configure Twilio credentials to send real WhatsApp messages

To use Twilio:
1. Sign up at https://www.twilio.com
2. Get WhatsApp API access
3. Install Twilio SDK: `cd server && npm install twilio`
4. Configure environment variables

## Security Features

- JWT-based authentication
- Role-based access control (admin, treasurer, resident)
- Input validation on all endpoints
- Rate limiting
- Soft deletes (records marked as deleted, not removed)
- Atomic file writes with locking

## Backup System

- Automatic backups created before every write operation
- Backups stored in `backups/` directory with timestamps
- Manual backup creation via admin API
- File download endpoint for data export

## Development

### Running Backend Only
```bash
cd server
npm run dev
```

### Running Frontend Only
```bash
cd client
npm start
```

### Production Build
```bash
cd client
npm run build
```

## Notes

- Excel file is created automatically on first use
- All dates should be in ISO format (YYYY-MM-DD)
- The system uses soft deletes (records are marked as deleted, not removed)
- File locking ensures safe concurrent access (single instance)
- For multi-instance deployments, consider using Redis-based distributed locking

## Troubleshooting

**Excel file not found**: The file is created automatically on first API call. Ensure the `data/` directory is writable.

**WhatsApp notifications not working**: 
- Check provider configuration in `.env`
- For Twilio, ensure the package is installed: `npm install twilio`
- Check server logs for error messages

**Authentication errors**: Ensure JWT_SECRET is set in `.env`

## License

ISC

