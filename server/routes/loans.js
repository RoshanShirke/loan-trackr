import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate, loanSchema, paymentSchema } from '../middleware/validation.js';
import {
  getLoans, addLoan, updateLoan, deleteLoan,
  closeLoan, recordPayment, getPayments, getAppNames
} from '../controllers/loanController.js';

const router = Router();
router.use(authenticate);

// Static routes MUST come before parameterized routes
router.get('/meta/apps', getAppNames);

router.get('/', getLoans);
router.post('/', validate(loanSchema), addLoan);
router.put('/:id', validate(loanSchema), updateLoan);
router.delete('/:id', deleteLoan);
router.patch('/:id/close', closeLoan);
router.post('/:id/payment', validate(paymentSchema), recordPayment);
router.get('/:id/payments', getPayments);

export default router;
