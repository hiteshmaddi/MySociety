const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ExcelService {
  constructor(filePath, backupDir) {
    this.filePath = filePath;
    this.backupDir = backupDir;
    this.lock = null; // In-process lock (for single instance)
    this.lockPromise = Promise.resolve();
    this.ensureDirectories();
  }

  async ensureDirectories() {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  // Acquire lock for exclusive write access
  async acquireLock() {
    let release;
    const lockPromise = new Promise((resolve) => {
      release = resolve;
    });
    
    const previousLock = this.lockPromise;
    this.lockPromise = previousLock.then(() => lockPromise);
    
    return () => {
      release();
    };
  }

  // Create backup before write
  async createBackup() {
    try {
      await fs.access(this.filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(
        this.backupDir,
        `mysociety_data_${timestamp}.xlsx`
      );
      await fs.copyFile(this.filePath, backupPath);
      return backupPath;
    } catch (error) {
      // File doesn't exist yet, no backup needed
      return null;
    }
  }

  // Initialize Excel file with sheets if it doesn't exist
  async initializeFile() {
    try {
      await fs.access(this.filePath);
      return; // File exists
    } catch {
      // Create new file with sheets
      const workbook = new ExcelJS.Workbook();
      
      // Expenses sheet
      const expensesSheet = workbook.addWorksheet('Expenses');
      expensesSheet.columns = [
        { header: 'id', key: 'id', width: 30 },
        { header: 'expense_desc', key: 'expense_desc', width: 40 },
        { header: 'amount', key: 'amount', width: 15 },
        { header: 'date', key: 'date', width: 12 },
        { header: 'villa_no', key: 'villa_no', width: 12 },
        { header: 'created_by', key: 'created_by', width: 20 },
        { header: 'created_at', key: 'created_at', width: 25 },
        { header: 'modified_by', key: 'modified_by', width: 20 },
        { header: 'modified_at', key: 'modified_at', width: 25 },
        { header: 'deleted', key: 'deleted', width: 10 },
        { header: 'notes', key: 'notes', width: 30 }
      ];
      expensesSheet.getRow(1).font = { bold: true };

      // Payments sheet
      const paymentsSheet = workbook.addWorksheet('Payments');
      paymentsSheet.columns = [
        { header: 'id', key: 'id', width: 30 },
        { header: 'villa_no', key: 'villa_no', width: 12 },
        { header: 'amount', key: 'amount', width: 15 },
        { header: 'date', key: 'date', width: 12 },
        { header: 'payment_mode', key: 'payment_mode', width: 15 },
        { header: 'created_by', key: 'created_by', width: 20 },
        { header: 'created_at', key: 'created_at', width: 25 },
        { header: 'modified_by', key: 'modified_by', width: 20 },
        { header: 'modified_at', key: 'modified_at', width: 25 },
        { header: 'deleted', key: 'deleted', width: 10 },
        { header: 'reference_no', key: 'reference_no', width: 20 }
      ];
      paymentsSheet.getRow(1).font = { bold: true };

      await this.writeWorkbook(workbook);
    }
  }

  // Atomic write: write to temp file, then rename
  async writeWorkbook(workbook) {
    const tempPath = `${this.filePath}.tmp`;
    const stream = await fs.open(tempPath, 'w');
    await workbook.xlsx.writeFile(tempPath);
    await stream.close();
    await fs.rename(tempPath, this.filePath);
  }

  // Read workbook
  async readWorkbook() {
    await this.initializeFile();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.filePath);
    return workbook;
  }

  // Convert Excel row to object
  rowToObject(row, headers) {
    const obj = {};
    headers.forEach((header, index) => {
      const value = row.getCell(index + 1).value;
      obj[header] = value !== null && value !== undefined ? value : null;
    });
    return obj;
  }

  // Convert object to Excel row
  objectToRow(worksheet, obj, headers, rowNumber) {
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(rowNumber, index + 1);
      const value = obj[header];
      if (value !== null && value !== undefined) {
        cell.value = value;
      }
    });
  }

  // EXPENSES OPERATIONS

  async addExpense(expenseData, username) {
    const release = await this.acquireLock();
    try {
      await this.createBackup();
      const workbook = await this.readWorkbook();
      const sheet = workbook.getWorksheet('Expenses');
      
      const headers = sheet.getRow(1).values.slice(1);
      const newExpense = {
        id: uuidv4(),
        expense_desc: expenseData.expense_desc,
        amount: parseFloat(expenseData.amount),
        date: expenseData.date,
        villa_no: expenseData.villa_no || null,
        created_by: username,
        created_at: new Date().toISOString(),
        modified_by: null,
        modified_at: null,
        deleted: false,
        notes: expenseData.notes || null
      };

      const newRow = sheet.addRow([]);
      this.objectToRow(sheet, newExpense, headers, newRow.number);
      await this.writeWorkbook(workbook);
      
      return newExpense;
    } finally {
      release();
    }
  }

  async getExpenses(fromDate = null, toDate = null) {
    const workbook = await this.readWorkbook();
    const sheet = workbook.getWorksheet('Expenses');
    const headers = sheet.getRow(1).values.slice(1);
    const expenses = [];

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const expense = this.rowToObject(row, headers);
      
      if (expense.deleted) continue;
      
      if (fromDate && expense.date < fromDate) continue;
      if (toDate && expense.date > toDate) continue;
      
      expenses.push(expense);
    }

    return expenses;
  }

  async getExpenseById(id) {
    const workbook = await this.readWorkbook();
    const sheet = workbook.getWorksheet('Expenses');
    const headers = sheet.getRow(1).values.slice(1);

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const expense = this.rowToObject(row, headers);
      if (expense.id === id && !expense.deleted) {
        return expense;
      }
    }
    return null;
  }

  async updateExpense(id, updateData, username) {
    const release = await this.acquireLock();
    try {
      await this.createBackup();
      const workbook = await this.readWorkbook();
      const sheet = workbook.getWorksheet('Expenses');
      const headers = sheet.getRow(1).values.slice(1);

      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        const expense = this.rowToObject(row, headers);
        
        if (expense.id === id && !expense.deleted) {
          // Update fields
          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
              expense[key] = updateData[key];
            }
          });
          expense.modified_by = username;
          expense.modified_at = new Date().toISOString();
          
          this.objectToRow(sheet, expense, headers, i);
          await this.writeWorkbook(workbook);
          return expense;
        }
      }
      return null;
    } finally {
      release();
    }
  }

  async deleteExpense(id, username) {
    const release = await this.acquireLock();
    try {
      await this.createBackup();
      const workbook = await this.readWorkbook();
      const sheet = workbook.getWorksheet('Expenses');
      const headers = sheet.getRow(1).values.slice(1);

      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        const expense = this.rowToObject(row, headers);
        
        if (expense.id === id && !expense.deleted) {
          expense.deleted = true;
          expense.modified_by = username;
          expense.modified_at = new Date().toISOString();
          
          this.objectToRow(sheet, expense, headers, i);
          await this.writeWorkbook(workbook);
          return expense;
        }
      }
      return null;
    } finally {
      release();
    }
  }

  // PAYMENTS OPERATIONS

  async addPayment(paymentData, username) {
    const release = await this.acquireLock();
    try {
      await this.createBackup();
      const workbook = await this.readWorkbook();
      const sheet = workbook.getWorksheet('Payments');
      
      const headers = sheet.getRow(1).values.slice(1);
      const newPayment = {
        id: uuidv4(),
        villa_no: paymentData.villa_no,
        amount: parseFloat(paymentData.amount),
        date: paymentData.date,
        payment_mode: paymentData.payment_mode || null,
        created_by: username,
        created_at: new Date().toISOString(),
        modified_by: null,
        modified_at: null,
        deleted: false,
        reference_no: paymentData.reference_no || null
      };

      const newRow = sheet.addRow([]);
      this.objectToRow(sheet, newPayment, headers, newRow.number);
      await this.writeWorkbook(workbook);
      
      return newPayment;
    } finally {
      release();
    }
  }

  async getPayments(fromDate = null, toDate = null) {
    const workbook = await this.readWorkbook();
    const sheet = workbook.getWorksheet('Payments');
    const headers = sheet.getRow(1).values.slice(1);
    const payments = [];

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const payment = this.rowToObject(row, headers);
      
      if (payment.deleted) continue;
      
      if (fromDate && payment.date < fromDate) continue;
      if (toDate && payment.date > toDate) continue;
      
      payments.push(payment);
    }

    return payments;
  }

  async getPaymentById(id) {
    const workbook = await this.readWorkbook();
    const sheet = workbook.getWorksheet('Payments');
    const headers = sheet.getRow(1).values.slice(1);

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const payment = this.rowToObject(row, headers);
      if (payment.id === id && !payment.deleted) {
        return payment;
      }
    }
    return null;
  }

  async updatePayment(id, updateData, username) {
    const release = await this.acquireLock();
    try {
      await this.createBackup();
      const workbook = await this.readWorkbook();
      const sheet = workbook.getWorksheet('Payments');
      const headers = sheet.getRow(1).values.slice(1);

      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        const payment = this.rowToObject(row, headers);
        
        if (payment.id === id && !payment.deleted) {
          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
              payment[key] = updateData[key];
            }
          });
          payment.modified_by = username;
          payment.modified_at = new Date().toISOString();
          
          this.objectToRow(sheet, payment, headers, i);
          await this.writeWorkbook(workbook);
          return payment;
        }
      }
      return null;
    } finally {
      release();
    }
  }

  async deletePayment(id, username) {
    const release = await this.acquireLock();
    try {
      await this.createBackup();
      const workbook = await this.readWorkbook();
      const sheet = workbook.getWorksheet('Payments');
      const headers = sheet.getRow(1).values.slice(1);

      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        const payment = this.rowToObject(row, headers);
        
        if (payment.id === id && !payment.deleted) {
          payment.deleted = true;
          payment.modified_by = username;
          payment.modified_at = new Date().toISOString();
          
          this.objectToRow(sheet, payment, headers, i);
          await this.writeWorkbook(workbook);
          return payment;
        }
      }
      return null;
    } finally {
      release();
    }
  }

  // Get file for download
  async getFileStream() {
    await this.initializeFile();
    return fs.readFile(this.filePath);
  }
}

module.exports = ExcelService;

