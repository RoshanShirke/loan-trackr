import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { loanService, analyticsService } from '../services/services';
import { formatCurrency, formatDate, daysUntil, getAppColor } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LogOut, Plus, Wallet, CircleDollarSign, Calendar, Edit3, Trash2, CheckCircle2, CreditCard, X, Award, Sparkles, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [bestApp, setBestApp] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = user?.preferredCurrency || 'INR';

  const fetchData = useCallback(async () => {
    try {
      const [lr, sr, cr] = await Promise.all([
        loanService.getAll(), analyticsService.getSummary(), analyticsService.getComparison(),
      ]);
      setLoans(lr.loans || []);
      setSummary(sr);
      setComparison(cr.comparison || []);
      setBestApp(cr.bestApp);
    } catch (e) { toast.error('Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeLoans = loans.filter(l => l.status === 'active');
  const closedLoans = loans.filter(l => l.status === 'closed');

  async function handleDelete(id) {
    if (!confirm('Delete this loan?')) return;
    try { await loanService.delete(id); toast.success('Deleted'); fetchData(); }
    catch (e) { toast.error(e.message); }
  }
  async function handleClose(id) {
    if (!confirm('Mark as closed?')) return;
    try { await loanService.close(id); toast.success('Loan closed!'); fetchData(); }
    catch (e) { toast.error(e.message); }
  }
  function handleFormDone() { setShowAddForm(false); setEditingLoan(null); fetchData(); }

  if (loading) return <div className="dashboard-loading"><div className="spinner" style={{width:48,height:48}}/><p>Loading...</p></div>;

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <div className="dash-nav-inner container">
          <div className="nav-brand"><Sparkles size={24}/><span className="brand-text">Loan<strong>Trackr</strong></span></div>
          <div className="nav-user">
            <span className="nav-greeting">Hello, <strong>{user?.firstName}</strong></span>
            <button className="btn btn-ghost" onClick={logout} id="logout-btn"><LogOut size={16}/> Logout</button>
          </div>
        </div>
      </nav>
      <main className="dash-main container">
        <section className="hero-stats animate-fadeInUp">
          <StatCard icon={<Wallet size={28}/>} label="Total Loans" value={formatCurrency(summary?.totalLoanAmount||0, currency)} sub={`${summary?.totalCount||0} loans`}/>
          <StatCard icon={<CircleDollarSign size={28}/>} label="Remaining" value={formatCurrency(summary?.totalRemaining||0, currency)} sub="to be paid" orange/>
          <div className="stat-card glass-card stat-progress">
            <div className="progress-ring-wrap"><ProgressRing pct={summary?.percentagePaid||0}/></div>
            <div className="stat-content">
              <span className="stat-label">Paid Off</span>
              <span className="stat-value mono">{summary?.percentagePaid||0}%</span>
              <span className="stat-sub">{formatCurrency(summary?.totalPaid||0, currency)} paid</span>
            </div>
          </div>
        </section>

        {comparison?.length > 0 && (
          <section className="charts-section animate-fadeInUp delay-1">
            <div className="section-header"><h2><BarChart3 size={22}/> Loan Comparison</h2></div>
            {bestApp && <div className="best-app-card glass-card"><Award size={24} className="best-icon"/><div><strong>⭐ Best Deal: {bestApp.appName}</strong><p>{bestApp.reason}</p></div></div>}
            <div className="charts-grid">
              <div className="chart-card glass-card">
                <h3><BarChart3 size={18}/> Interest Rate (%)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparison}><CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)"/><XAxis dataKey="appName" tick={{fill:'#94a3b8',fontSize:12}}/><YAxis tick={{fill:'#94a3b8',fontSize:12}}/><Tooltip contentStyle={{background:'#1e293b',border:'1px solid rgba(148,163,184,0.2)',borderRadius:8,color:'#f1f5f9'}}/><Bar dataKey="avgInterestRate" name="Interest %" radius={[6,6,0,0]}>{comparison.map((e,i)=><Cell key={i} fill={getAppColor(e.appName)}/>)}</Bar></BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card glass-card">
                <h3><PieIcon size={18}/> Loan Distribution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart><Pie data={comparison} dataKey="totalAmount" nameKey="appName" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>{comparison.map((e,i)=><Cell key={i} fill={getAppColor(e.appName)}/>)}</Pie><Tooltip contentStyle={{background:'#1e293b',border:'1px solid rgba(148,163,184,0.2)',borderRadius:8,color:'#f1f5f9'}}/></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        <section className="loans-section animate-fadeInUp delay-2">
          <div className="section-header">
            <h2><TrendingUp size={22}/> Active Loans ({activeLoans.length})</h2>
            <button className="btn btn-primary" onClick={()=>{setEditingLoan(null);setShowAddForm(true)}} id="add-loan-btn"><Plus size={18}/> Add Loan</button>
          </div>
          {activeLoans.length===0 ? (
            <div className="empty-state glass-card"><CreditCard size={48}/><h3>No active loans</h3><p>Add your first loan to start tracking!</p><button className="btn btn-primary" onClick={()=>setShowAddForm(true)}><Plus size={18}/> Add First Loan</button></div>
          ) : (
            <div className="loans-grid">{activeLoans.map(l=><LoanCard key={l.id} loan={l} currency={currency} onEdit={()=>{setEditingLoan(l);setShowAddForm(true)}} onDelete={()=>handleDelete(l.id)} onClose={()=>handleClose(l.id)}/>)}</div>
          )}
        </section>

        {closedLoans.length>0 && (
          <section className="loans-section animate-fadeInUp delay-3">
            <div className="section-header"><h2><CheckCircle2 size={22}/> Closed Loans ({closedLoans.length})</h2></div>
            <div className="loans-grid">{closedLoans.map(l=><LoanCard key={l.id} loan={l} currency={currency} closed onDelete={()=>handleDelete(l.id)}/>)}</div>
          </section>
        )}
      </main>
      {showAddForm && <LoanModal loan={editingLoan} currency={currency} onClose={()=>{setShowAddForm(false);setEditingLoan(null)}} onSuccess={handleFormDone}/>}
    </div>
  );
}

function StatCard({icon,label,value,sub,orange}) {
  return (
    <div className="stat-card glass-card">
      <div className={`stat-icon ${orange?'orange':''}`}>{icon}</div>
      <div className="stat-content"><span className="stat-label">{label}</span><span className="stat-value mono">{value}</span><span className="stat-sub">{sub}</span></div>
    </div>
  );
}

function ProgressRing({pct}) {
  const r=40,c=2*Math.PI*r,off=c-(pct/100)*c;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="progress-ring">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke="url(#pg)" strokeWidth="8" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 50 50)" style={{transition:'stroke-dashoffset 1s ease'}}/>
      <defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
    </svg>
  );
}

function LoanCard({loan,currency,closed,onEdit,onDelete,onClose}) {
  const ac=getAppColor(loan.app_name);
  const prog=loan.total_payable>0?Math.min(100,((loan.totalPaid||0)/loan.total_payable)*100):0;
  const dl=daysUntil(loan.next_emi_date);
  return (
    <div className={`loan-card glass-card ${closed?'loan-closed':''}`}>
      <div className="loan-header">
        <div className="app-badge" style={{background:ac+'22',color:ac,borderColor:ac+'44'}}>{loan.app_name.charAt(0)}</div>
        <div className="loan-title"><h4>{loan.app_name}</h4><span className={`loan-status ${loan.status}`}>{loan.status==='active'?'● Active':'✓ Closed'}</span></div>
        <div className="loan-actions">
          {!closed && <><button onClick={onEdit} title="Edit"><Edit3 size={15}/></button><button onClick={onClose} title="Close"><CheckCircle2 size={15}/></button></>}
          <button onClick={onDelete} title="Delete" className="danger"><Trash2 size={15}/></button>
        </div>
      </div>
      <div className="loan-amounts">
        <div className="loan-amt"><span className="amt-label">Loan Amount</span><span className="amt-value mono">{formatCurrency(loan.loan_amount,currency)}</span></div>
        <div className="loan-amt"><span className="amt-label">Disbursed</span><span className="amt-value mono">{formatCurrency(loan.disbursed_amount,currency)}</span></div>
      </div>
      <div className="loan-progress">
        <div className="progress-info"><span>Repayment</span><span className="mono">{prog.toFixed(1)}%</span></div>
        <div className="progress-bar"><div className="progress-fill" style={{width:`${prog}%`,background:ac}}/></div>
      </div>
      <div className="loan-details-grid">
        <div className="detail"><span className="detail-label">EMI</span><span className="detail-value mono">{formatCurrency(loan.emi_amount,currency)}</span></div>
        <div className="detail"><span className="detail-label">Interest</span><span className="detail-value mono">{loan.interest_rate}%</span></div>
        <div className="detail"><span className="detail-label">Total Payable</span><span className="detail-value mono">{formatCurrency(loan.total_payable,currency)}</span></div>
        <div className="detail"><span className="detail-label">Extra Cost</span><span className="detail-value mono err">{formatCurrency(loan.total_payable-loan.loan_amount,currency)}</span></div>
      </div>
      {!closed && dl!==null && (
        <div className={`next-emi ${dl<=3?'urgent':dl<=7?'soon':''}`}>
          <Calendar size={14}/><span>Next EMI: {formatDate(loan.next_emi_date)}</span>
          {dl>0?<span className="days-badge">{dl}d left</span>:<span className="days-badge overdue">Overdue!</span>}
        </div>
      )}
    </div>
  );
}

function LoanModal({loan,currency,onClose,onSuccess}) {
  const APPS=['MoneyView','True Balance','Stucred','mpokket','Fibe','KreditBee','CASHe','Navi','PaySense','SmartCoin'];
  const [form,setForm]=useState({
    appName:loan?.app_name||'',customApp:'',
    loanAmount:loan?.loan_amount||'',disbursedAmount:loan?.disbursed_amount||'',
    interestRate:loan?.interest_rate||'',tenureType:loan?.tenure_type||'months',
    tenureValue:loan?.tenure_value||'',emiAmount:loan?.emi_amount||'',
    startDate:loan?.start_date||new Date().toISOString().split('T')[0],
    totalPayable:loan?.total_payable||'',extraCharges:loan?.extra_charges||0,
    currency:loan?.currency||currency,notes:loan?.notes||'',
  });
  const [custom,setCustom]=useState(false);
  const [loading,setLoading]=useState(false);

  function upd(f,v){
    setForm(p=>{
      const u={...p,[f]:v};
      if(['loanAmount','interestRate','tenureValue','tenureType'].includes(f)){
        const la=parseFloat(u.loanAmount)||0,ir=parseFloat(u.interestRate)||0,tv=parseInt(u.tenureValue)||0;
        if(la>0&&ir>0&&tv>0){
          const m=u.tenureType==='months'?tv:Math.ceil(tv/30),mr=ir/12/100;
          if(mr>0){const emi=(la*mr*Math.pow(1+mr,m))/(Math.pow(1+mr,m)-1);u.emiAmount=Math.round(emi);u.totalPayable=Math.round(emi*m);}
        }
      }
      return u;
    });
  }

  async function submit(e){
    e.preventDefault(); setLoading(true);
    const d={appName:custom?form.customApp:form.appName,loanAmount:parseFloat(form.loanAmount),disbursedAmount:parseFloat(form.disbursedAmount),interestRate:parseFloat(form.interestRate),tenureType:form.tenureType,tenureValue:parseInt(form.tenureValue),emiAmount:parseFloat(form.emiAmount),startDate:form.startDate,totalPayable:parseFloat(form.totalPayable),extraCharges:parseFloat(form.extraCharges)||0,currency:form.currency,notes:form.notes};
    try{
      if(loan){await loanService.update(loan.id,d);toast.success('Updated!');}
      else{await loanService.add(d);toast.success('Loan added!');}
      onSuccess();
    }catch(e){toast.error(e.message);}
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass-card animate-scaleIn" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{loan?'Edit Loan':'Add New Loan'}</h2><button className="modal-close" onClick={onClose}><X size={20}/></button></div>
        <form onSubmit={submit} className="loan-form">
          <div className="form-group"><label>Lending App</label>
            {!custom?<><select value={form.appName} onChange={e=>upd('appName',e.target.value)} required><option value="">Select App</option>{APPS.map(a=><option key={a} value={a}>{a}</option>)}</select><button type="button" className="link-btn" onClick={()=>setCustom(true)}>+ Add Custom</button></>
            :<><input type="text" placeholder="Custom app name" value={form.customApp} onChange={e=>upd('customApp',e.target.value)} required/><button type="button" className="link-btn" onClick={()=>setCustom(false)}>← Choose from list</button></>}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Loan Amount</label><input type="number" placeholder="50000" value={form.loanAmount} onChange={e=>upd('loanAmount',e.target.value)} required min="1"/></div>
            <div className="form-group"><label>Disbursed Amount</label><input type="number" placeholder="Amount received" value={form.disbursedAmount} onChange={e=>upd('disbursedAmount',e.target.value)} required min="1"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Interest Rate (%)</label><input type="number" step="0.1" placeholder="15" value={form.interestRate} onChange={e=>upd('interestRate',e.target.value)} required min="0"/></div>
            <div className="form-group"><label>Tenure</label><div className="tenure-input"><input type="number" placeholder="12" value={form.tenureValue} onChange={e=>upd('tenureValue',e.target.value)} required min="1"/><select value={form.tenureType} onChange={e=>upd('tenureType',e.target.value)}><option value="months">Months</option><option value="days">Days</option></select></div></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>EMI (auto-calc)</label><input type="number" value={form.emiAmount} onChange={e=>upd('emiAmount',e.target.value)} required min="1"/></div>
            <div className="form-group"><label>Total Payable (auto-calc)</label><input type="number" value={form.totalPayable} onChange={e=>upd('totalPayable',e.target.value)} required min="1"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input type="date" value={form.startDate} onChange={e=>upd('startDate',e.target.value)} required/></div>
            <div className="form-group"><label>Extra Charges</label><input type="number" value={form.extraCharges} onChange={e=>upd('extraCharges',e.target.value)} min="0"/></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea rows={2} placeholder="Optional notes..." value={form.notes} onChange={e=>upd('notes',e.target.value)}/></div>
          <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading} id="save-loan-btn">{loading?'Saving...':loan?'Update':'Add Loan'}</button></div>
        </form>
      </div>
    </div>
  );
}
