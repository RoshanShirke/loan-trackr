import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/services';
import { validatePassword, validateEmail, validateMobile, validateUserId } from '../utils/validators';
import { Eye, EyeOff, Check, X, Loader2, Mail, Lock, User, Phone, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // login | signup | otp
  const [pendingEmail, setPendingEmail] = useState('');
  const { login } = useAuth();

  function handleSignupSuccess(email) {
    setPendingEmail(email);
    setMode('otp');
  }

  function handleOTPSuccess(token, user) {
    login(token, user);
  }

  function handleNeedVerification(email) {
    setPendingEmail(email);
    setMode('otp');
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-container">
        <div className="auth-brand animate-fadeInUp">
          <div className="auth-logo">
            <Sparkles size={32} />
            <h1>Loan<span>Trackr</span></h1>
          </div>
          <p className="auth-tagline">Smart loan management, simplified.</p>
        </div>

        <div className="auth-card glass-card animate-fadeInUp delay-2">
          {mode === 'login' && (
            <LoginForm
              onSwitch={() => setMode('signup')}
              onLogin={login}
              onNeedVerification={handleNeedVerification}
            />
          )}
          {mode === 'signup' && (
            <SignupForm
              onSwitch={() => setMode('login')}
              onSuccess={handleSignupSuccess}
            />
          )}
          {mode === 'otp' && (
            <OTPForm
              email={pendingEmail}
              onSuccess={handleOTPSuccess}
              onBack={() => setMode('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSwitch, onLogin, onNeedVerification }) {
  const [userId, setUserId] = useState(() => localStorage.getItem('savedUserId') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('savedUserId'));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login({ userId, password, rememberMe });
      if (rememberMe) {
        localStorage.setItem('savedUserId', userId);
      } else {
        localStorage.removeItem('savedUserId');
      }
      toast.success('Welcome back!');
      onLogin(data.token, data.user);
    } catch (err) {
      if (err.message === 'Email not verified') {
        toast('Please verify your email first');
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password }),
          });
          const d = await res.json();
          if (d.requiresVerification) onNeedVerification(d.email);
        } catch { /* ignore */ }
      } else {
        toast.error(err.message);
      }
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Welcome Back</h2>
      <p className="auth-subtitle">Sign in to continue to your dashboard</p>

      <div className="input-group">
        <User size={18} className="input-icon" />
        <input id="login-userid" type="text" placeholder="User ID" value={userId}
          onChange={e => setUserId(e.target.value)} required />
      </div>

      <div className="input-group">
        <Lock size={18} className="input-icon" />
        <input id="login-password" type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required />
        <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <label className="remember-me" id="remember-me-label">
        <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
        <span className="checkmark" />
        Remember me
      </label>

      <button type="submit" className="btn btn-primary auth-submit" disabled={loading || !userId || !password} id="login-btn">
        {loading ? <Loader2 size={18} className="spinning" /> : <><ArrowRight size={18} /> Sign In</>}
      </button>

      <p className="auth-switch">
        Don't have an account? <button type="button" onClick={onSwitch} id="goto-signup">Sign Up</button>
      </p>
    </form>
  );
}

function SignupForm({ onSwitch, onSuccess }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', mobile: '', email: '', userId: '', password: '', confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userIdStatus, setUserIdStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [pwValidation, setPwValidation] = useState(null);
  const debounceRef = useRef(null);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));

    if (field === 'userId' && value.length >= 4) {
      setUserIdStatus('checking');
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await authService.checkUserId(value);
          setUserIdStatus(res.available ? 'available' : 'taken');
        } catch { setUserIdStatus(null); }
      }, 500);
    } else if (field === 'userId') {
      setUserIdStatus(null);
    }

    if (field === 'password') {
      setPwValidation(validatePassword(value));
    }
  }

  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const canSubmit = form.firstName && form.lastName && validateMobile(form.mobile) &&
    validateEmail(form.email) && userIdStatus === 'available' &&
    pwValidation?.isValid && passwordsMatch && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await authService.signup({
        firstName: form.firstName, lastName: form.lastName, mobile: form.mobile,
        email: form.email, userId: form.userId, password: form.password,
      });
      toast.success('Account created! Check your email for OTP.');
      onSuccess(form.email);
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form signup-form">
      <h2>Create Account</h2>
      <p className="auth-subtitle">Join LoanTrackr to manage your loans</p>

      <div className="input-row">
        <div className="input-group">
          <input id="signup-firstname" type="text" placeholder="First Name" value={form.firstName}
            onChange={e => update('firstName', e.target.value)} required />
        </div>
        <div className="input-group">
          <input id="signup-lastname" type="text" placeholder="Last Name" value={form.lastName}
            onChange={e => update('lastName', e.target.value)} required />
        </div>
      </div>

      <div className="input-group">
        <Phone size={18} className="input-icon" />
        <input id="signup-mobile" type="tel" placeholder="Mobile Number (e.g., 9876543210)" value={form.mobile}
          onChange={e => update('mobile', e.target.value)} required
          className={form.mobile && !validateMobile(form.mobile) ? 'error' : ''} />
      </div>

      <div className="input-group">
        <Mail size={18} className="input-icon" />
        <input id="signup-email" type="email" placeholder="Gmail / Email" value={form.email}
          onChange={e => update('email', e.target.value)} required
          className={form.email && !validateEmail(form.email) ? 'error' : ''} />
      </div>

      <div className="input-group">
        <User size={18} className="input-icon" />
        <input id="signup-userid" type="text" placeholder="User ID (min 4 chars)" value={form.userId}
          onChange={e => update('userId', e.target.value)} required
          className={userIdStatus === 'taken' ? 'error' : userIdStatus === 'available' ? 'success' : ''} />
        <span className="input-status">
          {userIdStatus === 'checking' && <Loader2 size={16} className="spinning" />}
          {userIdStatus === 'available' && <Check size={16} className="status-ok" />}
          {userIdStatus === 'taken' && <X size={16} className="status-err" />}
        </span>
      </div>
      {userIdStatus === 'taken' && <p className="field-error">This User ID is already taken</p>}

      <div className="input-group">
        <Lock size={18} className="input-icon" />
        <input id="signup-password" type={showPw ? 'text' : 'password'} placeholder="Password (min 12 chars)" value={form.password}
          onChange={e => update('password', e.target.value)} required />
        <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {form.password && pwValidation && (
        <div className="pw-checklist">
          <div className="pw-strength-bar">
            <div className={`pw-strength-fill strength-${pwValidation.strength}`}
              style={{ width: `${(pwValidation.strength / 5) * 100}%` }} />
          </div>
          <span className={`pw-strength-label strength-${pwValidation.strength}`}>{pwValidation.label}</span>
          <ul>
            <li className={pwValidation.checks.minLength ? 'pass' : 'fail'}>
              {pwValidation.checks.minLength ? <Check size={14} /> : <X size={14} />} At least 12 characters
            </li>
            <li className={pwValidation.checks.hasUppercase ? 'pass' : 'fail'}>
              {pwValidation.checks.hasUppercase ? <Check size={14} /> : <X size={14} />} One uppercase letter (A-Z)
            </li>
            <li className={pwValidation.checks.hasLowercase ? 'pass' : 'fail'}>
              {pwValidation.checks.hasLowercase ? <Check size={14} /> : <X size={14} />} One lowercase letter (a-z)
            </li>
            <li className={pwValidation.checks.hasNumber ? 'pass' : 'fail'}>
              {pwValidation.checks.hasNumber ? <Check size={14} /> : <X size={14} />} One number (0-9)
            </li>
            <li className={pwValidation.checks.hasSpecial ? 'pass' : 'fail'}>
              {pwValidation.checks.hasSpecial ? <Check size={14} /> : <X size={14} />} One special character (!@#$%)
            </li>
          </ul>
        </div>
      )}

      <div className="input-group">
        <ShieldCheck size={18} className="input-icon" />
        <input id="signup-confirm-password" type="password" placeholder="Re-enter Password" value={form.confirmPassword}
          onChange={e => update('confirmPassword', e.target.value)} required
          className={passwordsMismatch ? 'error animate-shake' : passwordsMatch ? 'success' : ''} />
      </div>
      {passwordsMismatch && <p className="field-error">⚠️ Passwords do not match!</p>}

      <button type="submit" className="btn btn-primary auth-submit" disabled={!canSubmit} id="signup-btn">
        {loading ? <Loader2 size={18} className="spinning" /> : <><ArrowRight size={18} /> Sign Up</>}
      </button>

      <p className="auth-switch">
        Already have an account? <button type="button" onClick={onSwitch} id="goto-login">Sign In</button>
      </p>
    </form>
  );
}

function OTPForm({ email, onSuccess, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  function handleChange(index, value) {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const data = await authService.verifyOTP(email, code);
      toast.success('Email verified!');
      onSuccess(data.token, data.user);
    } catch (err) {
      toast.error(err.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  }

  async function handleResend() {
    try {
      await authService.resendOTP(email);
      setTimer(60);
      toast.success('OTP resent!');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="auth-form otp-form">
      <h2>Verify Email</h2>
      <p className="auth-subtitle">Enter the 6-digit code sent to <strong>{email}</strong></p>
      <p className="otp-hint">💡 Check server console for OTP in dev mode</p>

      <div className="otp-inputs" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input key={i} ref={el => inputRefs.current[i] = el} type="text" maxLength={1}
            value={digit} onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)} className="otp-digit" id={`otp-${i}`}
            inputMode="numeric" autoComplete="one-time-code" />
        ))}
      </div>

      <button className="btn btn-primary auth-submit" onClick={handleVerify}
        disabled={loading || otp.join('').length !== 6} id="verify-otp-btn">
        {loading ? <Loader2 size={18} className="spinning" /> : 'Verify'}
      </button>

      <p className="resend-text">
        {timer > 0 ? (
          <>Resend in <strong>{timer}s</strong></>
        ) : (
          <button type="button" onClick={handleResend} className="resend-btn" id="resend-otp-btn">Resend OTP</button>
        )}
      </p>

      <button type="button" className="auth-back" onClick={onBack}>← Back to Login</button>
    </div>
  );
}
