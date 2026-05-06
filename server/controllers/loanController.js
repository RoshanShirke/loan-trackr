import { dbRun, dbGet, dbAll } from '../config/database.js';

export function getLoans(req, res) {
  try {
    const loans = dbAll(
      'SELECT * FROM loans WHERE user_id = ? ORDER BY status ASC, created_at DESC', [req.user.id]
    );

    const loansWithPayments = loans.map(loan => {
      const payments = dbAll(
        'SELECT * FROM emi_payments WHERE loan_id = ? ORDER BY payment_date DESC', [loan.id]
      );
      const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid + (p.late_fee || 0), 0);
      return { ...loan, payments, totalPaid, remainingAmount: loan.total_payable - totalPaid };
    });

    res.json({ loans: loansWithPayments });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
}

export function addLoan(req, res) {
  try {
    const data = req.validatedData;
    const nextEmiDate = calculateNextEmiDate(data.startDate, data.tenureType);

    const result = dbRun(`
      INSERT INTO loans (user_id, app_name, loan_amount, disbursed_amount, interest_rate,
        tenure_type, tenure_value, emi_amount, start_date, next_emi_date, total_payable,
        extra_charges, currency, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, data.appName, data.loanAmount, data.disbursedAmount, data.interestRate,
      data.tenureType, data.tenureValue, data.emiAmount, data.startDate, nextEmiDate,
      data.totalPayable, data.extraCharges, data.currency, data.notes
    ]);

    if (data.appName && !getDefaultApps().includes(data.appName)) {
      const existing = dbGet(
        'SELECT id FROM custom_apps WHERE user_id = ? AND app_name = ?', [req.user.id, data.appName]
      );
      if (!existing) {
        dbRun('INSERT INTO custom_apps (user_id, app_name) VALUES (?, ?)', [req.user.id, data.appName]);
      }
    }

    const loan = dbGet('SELECT * FROM loans WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ message: 'Loan added successfully', loan });
  } catch (error) {
    console.error('Add loan error:', error);
    res.status(500).json({ error: 'Failed to add loan' });
  }
}

export function updateLoan(req, res) {
  try {
    const { id } = req.params;
    const data = req.validatedData;

    const loan = dbGet('SELECT * FROM loans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const nextEmiDate = calculateNextEmiDate(data.startDate, data.tenureType);

    dbRun(`
      UPDATE loans SET app_name=?, loan_amount=?, disbursed_amount=?, interest_rate=?,
        tenure_type=?, tenure_value=?, emi_amount=?, start_date=?, next_emi_date=?,
        total_payable=?, extra_charges=?, currency=?, notes=?, updated_at=datetime('now')
      WHERE id = ? AND user_id = ?
    `, [
      data.appName, data.loanAmount, data.disbursedAmount, data.interestRate,
      data.tenureType, data.tenureValue, data.emiAmount, data.startDate, nextEmiDate,
      data.totalPayable, data.extraCharges, data.currency, data.notes, id, req.user.id
    ]);

    const updated = dbGet('SELECT * FROM loans WHERE id = ?', [id]);
    res.json({ message: 'Loan updated', loan: updated });
  } catch (error) {
    console.error('Update loan error:', error);
    res.status(500).json({ error: 'Failed to update loan' });
  }
}

export function deleteLoan(req, res) {
  try {
    const { id } = req.params;
    const loan = dbGet('SELECT * FROM loans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    dbRun('DELETE FROM emi_payments WHERE loan_id = ?', [id]);
    dbRun('DELETE FROM loans WHERE id = ?', [id]);
    res.json({ message: 'Loan deleted' });
  } catch (error) {
    console.error('Delete loan error:', error);
    res.status(500).json({ error: 'Failed to delete loan' });
  }
}

export function closeLoan(req, res) {
  try {
    const { id } = req.params;
    const loan = dbGet('SELECT * FROM loans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    dbRun("UPDATE loans SET status = 'closed', updated_at = datetime('now') WHERE id = ?", [id]);
    res.json({ message: 'Loan closed' });
  } catch (error) {
    console.error('Close loan error:', error);
    res.status(500).json({ error: 'Failed to close loan' });
  }
}

export function recordPayment(req, res) {
  try {
    const { id } = req.params;
    const data = req.validatedData;

    const loan = dbGet('SELECT * FROM loans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    dbRun(`
      INSERT INTO emi_payments (loan_id, payment_date, amount_paid, is_late, late_fee, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, data.paymentDate, data.amountPaid, data.isLate ? 1 : 0, data.lateFee, data.notes]);

    const nextDate = calculateNextEmiDate(data.paymentDate, loan.tenure_type);
    dbRun("UPDATE loans SET next_emi_date = ?, updated_at = datetime('now') WHERE id = ?", [nextDate, id]);

    res.status(201).json({ message: 'Payment recorded' });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
}

export function getPayments(req, res) {
  try {
    const { id } = req.params;
    const loan = dbGet('SELECT * FROM loans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const payments = dbAll(
      'SELECT * FROM emi_payments WHERE loan_id = ? ORDER BY payment_date DESC', [id]
    );
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

export function getAppNames(req, res) {
  try {
    const customApps = dbAll('SELECT DISTINCT app_name FROM custom_apps WHERE user_id = ?', [req.user.id]);
    const allApps = [...getDefaultApps(), ...customApps.map(a => a.app_name)];
    res.json({ apps: [...new Set(allApps)] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch app names' });
  }
}

function getDefaultApps() {
  return ['MoneyView', 'True Balance', 'Stucred', 'mpokket', 'Fibe', 'KreditBee', 'CASHe', 'Navi', 'PaySense', 'SmartCoin'];
}

function calculateNextEmiDate(fromDate, tenureType) {
  const date = new Date(fromDate);
  if (tenureType === 'months') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setDate(date.getDate() + 30);
  }
  return date.toISOString().split('T')[0];
}
