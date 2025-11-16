const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class NotificationService {
  constructor(config) {
    this.provider = config.provider || 'mock';
    this.config = config;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // Initial delay in ms
  }

  // Format expense notification message
  formatExpenseMessage(action, expense, username) {
    const amount = `₹${expense.amount.toLocaleString('en-IN')}`;
    const date = new Date(expense.date).toLocaleDateString('en-IN');
    const villa = expense.villa_no ? ` (Villa ${expense.villa_no})` : '';
    
    switch (action) {
      case 'created':
        return `[Expense Added] ${amount} — ${expense.expense_desc} on ${date}${villa} (by ${username}).`;
      case 'updated':
        return `[Expense Updated] ID ${expense.id.substring(0, 8)} — ${expense.expense_desc} — ${amount} on ${date}${villa} (by ${username}).`;
      case 'deleted':
        return `[Expense Deleted] ID ${expense.id.substring(0, 8)} — ${expense.expense_desc} — ${amount} (by ${username}).`;
      default:
        return `[Expense ${action}] ${expense.expense_desc} — ${amount}`;
    }
  }

  // Format payment notification message
  formatPaymentMessage(action, payment, username) {
    const amount = `₹${payment.amount.toLocaleString('en-IN')}`;
    const date = new Date(payment.date).toLocaleDateString('en-IN');
    const mode = payment.payment_mode ? ` (${payment.payment_mode})` : '';
    const ref = payment.reference_no ? ` Ref: ${payment.reference_no}` : '';
    
    switch (action) {
      case 'created':
        return `[Payment Received] Villa ${payment.villa_no} — ${amount} on ${date}${mode}${ref} (by ${username}).`;
      case 'updated':
        return `[Payment Updated] Villa ${payment.villa_no} — ${amount} on ${date}${mode}${ref} (by ${username}).`;
      case 'deleted':
        return `[Payment Deleted] Villa ${payment.villa_no} — ${amount} on ${date} (by ${username}).`;
      default:
        return `[Payment ${action}] Villa ${payment.villa_no} — ${amount}`;
    }
  }

  // Send notification with retry logic
  async sendNotification(message, retryCount = 0) {
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendViaTwilio(message);
        case 'mock':
          return await this.sendViaMock(message);
        default:
          logger.warn(`Unknown provider: ${this.provider}, using mock`);
          return await this.sendViaMock(message);
      }
    } catch (error) {
      logger.error(`Notification send failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        logger.info(`Retrying notification in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return await this.sendNotification(message, retryCount + 1);
      } else {
        logger.error(`Notification failed after ${this.retryAttempts} attempts`);
        throw error;
      }
    }
  }

  // Mock provider (for development/testing)
  async sendViaMock(message) {
    logger.info(`[MOCK WhatsApp] ${message}`);
    return { success: true, provider: 'mock', message };
  }

  // Twilio provider
  async sendViaTwilio(message) {
    try {
      const twilio = require('twilio');
      const client = twilio(this.config.twilioAccountSid, this.config.twilioAuthToken);
      
      const to = this.config.whatsappGroupId || this.config.twilioWhatsappTo;
      const from = this.config.twilioWhatsappFrom;
      
      if (!to || !from) {
        throw new Error('Twilio WhatsApp configuration missing');
      }

      const result = await client.messages.create({
        body: message,
        from: from,
        to: to
      });
      
      logger.info(`WhatsApp message sent via Twilio: ${result.sid}`);
      return { success: true, provider: 'twilio', sid: result.sid, message };
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        logger.warn('Twilio package not installed. Install with: npm install twilio');
        throw new Error('Twilio package not installed');
      }
      logger.error('Twilio API error:', error);
      throw error;
    }
  }

  // Notify expense change
  async notifyExpense(action, expense, username) {
    const message = this.formatExpenseMessage(action, expense, username);
    return await this.sendNotification(message);
  }

  // Notify payment change
  async notifyPayment(action, payment, username) {
    const message = this.formatPaymentMessage(action, payment, username);
    return await this.sendNotification(message);
  }
}

module.exports = NotificationService;

