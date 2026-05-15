// Uses Resend HTTP API (not SMTP) — works on Render free tier
// Fallback: logs OTP to server console if email fails

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'LoanTrackr <onboarding@resend.dev>';

export async function sendOTPEmail(toEmail, otp, purpose = 'signup') {
  const subjects = {
    signup: 'LoanTrackr - Verify Your Email',
    login: 'LoanTrackr - Login Verification',
    reset: 'LoanTrackr - Password Reset',
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0f1c, #1a1f3c); padding: 40px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0;">
          <span style="color: #3b82f6;">Loan</span><span style="color: #ffffff;">Trackr</span>
        </h1>
      </div>
      <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 32px; text-align: center;">
        <h2 style="color: #e2e8f0; font-size: 20px; margin-top: 0;">Your Verification Code</h2>
        <div style="background: rgba(59,130,246,0.15); border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 36px; letter-spacing: 8px; color: #3b82f6; font-weight: bold;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          This code expires in <strong style="color: #f59e0b;">10 minutes</strong>.<br/>
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    </div>
  `;

  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [toEmail],
          subject: subjects[purpose] || subjects.signup,
          html: htmlContent,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('📧 OTP email sent to', toEmail, '(Resend ID:', result.id + ')');
        return true;
      } else {
        throw new Error(result.message || 'Resend API error');
      }
    } catch (error) {
      console.error('❌ Resend error:', error.message);
      console.log('\n' + '='.repeat(50));
      console.log('📧 OTP FALLBACK (Email failed)');
      console.log('   To: ' + toEmail);
      console.log('   OTP: ' + otp);
      console.log('   Error: ' + error.message);
      console.log('='.repeat(50) + '\n');
      return true;
    }
  } else {
    console.log('\n' + '='.repeat(50));
    console.log('📧 OTP (Dev Mode - No RESEND_API_KEY set)');
    console.log('   To: ' + toEmail);
    console.log('   OTP: ' + otp);
    console.log('   Expires: 10 minutes');
    console.log('='.repeat(50) + '\n');
    return true;
  }
}
