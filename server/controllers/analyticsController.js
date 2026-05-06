import { dbAll, dbGet } from '../config/database.js';

export function getSummary(req, res) {
  try {
    const activeLoans = dbAll("SELECT * FROM loans WHERE user_id = ? AND status = 'active'", [req.user.id]);
    const closedLoans = dbAll("SELECT * FROM loans WHERE user_id = ? AND status = 'closed'", [req.user.id]);

    let totalLoanAmount = 0, totalPayable = 0, totalPaid = 0, totalDisbursed = 0, totalExtraCharges = 0;

    const allLoans = [...activeLoans, ...closedLoans];
    for (const loan of allLoans) {
      totalLoanAmount += loan.loan_amount;
      totalPayable += loan.total_payable;
      totalDisbursed += loan.disbursed_amount;
      totalExtraCharges += loan.extra_charges || 0;

      const payments = dbAll('SELECT * FROM emi_payments WHERE loan_id = ?', [loan.id]);
      totalPaid += payments.reduce((sum, p) => sum + p.amount_paid + (p.late_fee || 0), 0);
    }

    const totalRemaining = totalPayable - totalPaid;
    const percentagePaid = totalPayable > 0 ? Math.round((totalPaid / totalPayable) * 100) : 0;

    res.json({
      totalLoanAmount, totalPayable, totalPaid, totalRemaining,
      totalDisbursed, totalExtraCharges, percentagePaid,
      activeCount: activeLoans.length,
      closedCount: closedLoans.length,
      totalCount: allLoans.length,
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
}

export function getComparison(req, res) {
  try {
    const loans = dbAll("SELECT * FROM loans WHERE user_id = ?", [req.user.id]);
    const appStats = {};

    for (const loan of loans) {
      if (!appStats[loan.app_name]) {
        appStats[loan.app_name] = {
          appName: loan.app_name, totalLoans: 0, totalAmount: 0,
          totalDisbursed: 0, interestRates: [], totalPayable: 0, totalExtraCharges: 0,
        };
      }
      const s = appStats[loan.app_name];
      s.totalLoans++;
      s.totalAmount += loan.loan_amount;
      s.totalDisbursed += loan.disbursed_amount;
      s.interestRates.push(loan.interest_rate);
      s.totalPayable += loan.total_payable;
      s.totalExtraCharges += loan.extra_charges || 0;
    }

    const comparison = Object.values(appStats).map(s => {
      const avgRate = s.interestRates.reduce((a, b) => a + b, 0) / s.interestRates.length;
      const disbursementRatio = (s.totalDisbursed / s.totalAmount) * 100;
      const extraCostPercent = ((s.totalPayable - s.totalAmount) / s.totalAmount) * 100;
      return {
        ...s, interestRates: undefined,
        avgInterestRate: Math.round(avgRate * 100) / 100,
        disbursementRatio: Math.round(disbursementRatio * 100) / 100,
        extraCostPercent: Math.round(extraCostPercent * 100) / 100,
      };
    });

    comparison.sort((a, b) => a.avgInterestRate - b.avgInterestRate);

    let bestApp = null;
    if (comparison.length > 0) {
      const scored = comparison.map(app => ({
        ...app,
        score: (100 - app.avgInterestRate) * 0.4 + app.disbursementRatio * 0.35 + (100 - app.extraCostPercent) * 0.25,
      }));
      scored.sort((a, b) => b.score - a.score);
      bestApp = {
        appName: scored[0].appName,
        reason: `Best deal: ${scored[0].avgInterestRate}% avg interest, ${scored[0].disbursementRatio}% disbursement ratio`,
        score: Math.round(scored[0].score),
      };
    }

    res.json({ comparison, bestApp });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: 'Failed to get comparison' });
  }
}
