import { z } from 'zod';

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 'Must contain at least one special character');

export const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  mobile: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number'),
  email: z.string().email('Invalid email address'),
  userId: z.string().min(4, 'User ID must be at least 4 characters').max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const loanSchema = z.object({
  appName: z.string().min(1, 'App name is required'),
  loanAmount: z.number().positive('Loan amount must be positive'),
  disbursedAmount: z.number().positive('Disbursed amount must be positive'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative'),
  tenureType: z.enum(['months', 'days']),
  tenureValue: z.number().int().positive('Tenure must be positive'),
  emiAmount: z.number().positive('EMI amount must be positive'),
  startDate: z.string().min(1, 'Start date is required'),
  totalPayable: z.number().positive('Total payable must be positive'),
  extraCharges: z.number().min(0).optional().default(0),
  currency: z.string().optional().default('INR'),
  notes: z.string().optional().default(''),
});

export const paymentSchema = z.object({
  paymentDate: z.string().min(1, 'Payment date is required'),
  amountPaid: z.number().positive('Amount must be positive'),
  isLate: z.boolean().optional().default(false),
  lateFee: z.number().min(0).optional().default(0),
  notes: z.string().optional().default(''),
});

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.validatedData = result.data;
    next();
  };
}
