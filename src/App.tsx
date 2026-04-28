import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  LayoutDashboard, 
  UserCircle, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Loader2,
  TrendingUp,
  Users,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { analyzeHairLoss } from './lib/gemini';

// --- Types ---
interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

interface Assessment {
  id: number;
  data: string;
  result: string;
  created_at: string;
}

// --- Utils ---
const trackEvent = async (type: string, metadata: any = {}, userId?: number) => {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, metadata, userId }),
    });
  } catch (err) {
    console.error('Tracking failed', err);
  }
};

export default function App() {
  const [view, setView] = useState<'landing' | 'assessment' | 'dashboard' | 'admin' | 'auth'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else logout();
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    trackEvent('page_view', { view });
  }, [token, view]);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('token', token);
    setView('assessment');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setView('landing');
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#E4E3E0]">
      <Loader2 className="animate-spin text-[#141414]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden relative">
      {/* Background Mesh Gradients */}
      <div className="mesh-gradient">
        <div className="mesh-blob-1" />
        <div className="mesh-blob-2" />
        <div className="mesh-blob-3" />
      </div>

      <Navbar user={user} setView={setView} logout={logout} />
      
      <main className="pt-32 px-4 max-w-7xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {view === 'landing' && <Landing setView={setView} />}
          {view === 'auth' && <Auth login={login} setView={setView} />}
          {view === 'assessment' && (
            token ? <AssessmentTool token={token} /> : <Auth login={login} setView={setView} />
          )}
          {view === 'dashboard' && (
            token ? <Dashboard token={token} /> : <Auth login={login} setView={setView} />
          )}
          {view === 'admin' && (
            user?.role === 'admin' ? <AdminDashboard token={token!} /> : <Landing setView={setView} />
          )}
        </AnimatePresence>
      </main>
      
      <footer className="mt-20 border-t border-[#141414] p-10 text-center opacity-50 text-xs uppercase tracking-widest font-mono">
        &copy; 2026 HAIRAI Assessment. All rights reserved.
      </footer>
    </div>
  );
}

// --- Components ---

function Navbar({ user, setView, logout }: { user: User | null; setView: any; logout: any }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setView('landing')}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <ClipboardCheck size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">HAIRAI</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-widest font-bold text-slate-400">
          <button onClick={() => setView('assessment')} className="hover:text-white transition-colors">Analyze</button>
          {user && (
            <>
              <button onClick={() => setView('dashboard')} className="hover:text-white transition-colors">History</button>
              {user.role === 'admin' && (
                <button onClick={() => setView('admin')} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Settings size={12} /> Console
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-[10px] font-mono opacity-40 uppercase tracking-tighter">{user.email}</span>
              <button onClick={logout} className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/20 transition-colors text-slate-100">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setView('auth')}
              className="bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function Landing({ setView }: { setView: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="py-20 flex flex-col items-center text-center max-w-4xl mx-auto"
    >
      <div className="mb-6 inline-block bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-400">
        AI-Powered Dermatology Assistant
      </div>
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8 bg-gradient-to-br from-white via-white to-slate-500 bg-clip-text text-transparent">
        KNOW YOUR <br/> HAIR'S FUTURE.
      </h1>
      <p className="text-lg text-slate-400 mb-12 font-sans font-light tracking-tight max-w-2xl">
        Advanced analysis using Google Gemini models to provide professional, data-driven 
        insights into your hair health and potential loss patterns.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          onClick={() => setView('assessment')}
          className="group bg-indigo-500 text-white px-10 py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-400 hover:scale-105 transition-all shadow-xl shadow-indigo-500/25"
        >
          <span className="text-sm uppercase font-bold tracking-wide">Start Assessment</span>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
          onClick={() => setView('auth')}
          className="px-10 py-5 rounded-2xl border border-white/10 glass font-bold text-sm uppercase hover:bg-white/10 transition-colors"
        >
          Create Account
        </button>
      </div>
      
      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {[
          { icon: <TrendingUp size={24} className="text-blue-400" />, title: "Precision", text: "Powered by advanced AI modeling" },
          { icon: <Users size={24} className="text-purple-400" />, title: "Personal", text: "Custom factors analysis" },
          { icon: <ClipboardCheck size={24} className="text-indigo-400" />, title: "Action", text: "Medical-grade recommendations" }
        ].map((item, i) => (
          <div key={i} className="glass-card text-left p-6 flex flex-col items-start hover:border-white/20">
            <div className="p-3 bg-white/5 rounded-2xl mb-4">
              {item.icon}
            </div>
            <h3 className="text-sm font-bold mb-2 text-white">
              {item.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Auth({ login, setView }: { login: any; setView: any }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      login(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto py-20"
    >
      <div className="glass-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 font-mono text-[10px] text-slate-500 opacity-50 uppercase tracking-widest">
          Auth.module
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-white">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/10 transition-all text-sm"
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/10 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-400 font-medium text-xs px-1">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (isLogin ? 'Enter System' : 'Create Profile')}
          </button>
        </form>
        
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="mt-8 w-full text-center text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          {isLogin ? "New here? Build a profile" : "Member already? Authenticate"}
        </button>
      </div>
    </motion.div>
  );
}

function AssessmentTool({ token }: { token: string }) {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: 25,
    gender: 'male',
    severity: 'none',
    familyHistory: 'no',
    stress: 'moderate',
    diet: 'average',
    illness: 'no'
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const aiResult = await analyzeHairLoss(formData);
      setResult(aiResult!);
      
      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: formData, result: aiResult })
      });
      
      trackEvent('assessment_complete', { severity: formData.severity });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (result) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-10">
      <div className="glass-card p-10 md:p-16 border-indigo-500/20 shadow-indigo-500/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-white">Full Analysis</h2>
          <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Gemini Core v1.3</div>
        </div>
        <div className="prose prose-invert max-w-none">
           <ReactMarkdown>{result}</ReactMarkdown>
        </div>
        <button 
          onClick={() => {setResult(null); setStep(1);}}
          className="mt-16 w-full md:w-auto bg-indigo-500 text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-indigo-400 transition-all shadow-xl shadow-indigo-500/20"
        >
          New Assessment
        </button>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto py-10">
      <div className="glass-card p-10 md:p-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 font-mono text-[10px] text-slate-600 font-bold uppercase tracking-widest">PHASE_0{step}</div>
        
        {step === 1 ? (
          <div className="space-y-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Physiological Factors</h2>
              <p className="text-sm text-slate-500">Provide basic anatomical data for AI profiling.</p>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Age</label>
                  <span className="text-2xl font-bold text-indigo-400">{formData.age}</span>
                </div>
                <input 
                  type="range" min="18" max="80" 
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                  className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SelectField 
                  label="Gender Identity" 
                  value={formData.gender} 
                  options={['male', 'female', 'other']} 
                  onChange={v => setFormData({...formData, gender: v})} 
                />
                <SelectField 
                  label="Family History" 
                  value={formData.familyHistory} 
                  options={['yes', 'no']} 
                  onChange={v => setFormData({...formData, familyHistory: v})} 
                />
              </div>
              
              <SelectField 
                label="Observation Severity" 
                value={formData.severity} 
                options={['none', 'mild', 'moderate', 'severe']} 
                onChange={v => setFormData({...formData, severity: v})} 
              />
              
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-white/5 border border-white/10 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all text-white"
              >
                Continue Assessment
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Environmental Influence</h2>
              <p className="text-sm text-slate-500">Analyze lifestyle stresses and systemic health.</p>
            </div>
            
            <div className="space-y-10">
              <SelectField 
                label="Psychological Stress" 
                value={formData.stress} 
                options={['low', 'moderate', 'high']} 
                onChange={v => setFormData({...formData, stress: v})} 
              />
              <SelectField 
                label="Dietary Composition" 
                value={formData.diet} 
                options={['poor', 'average', 'good']} 
                onChange={v => setFormData({...formData, diet: v})} 
              />
              <SelectField 
                label="Systemic Health (Recent Illness)" 
                value={formData.illness} 
                options={['yes', 'no']} 
                onChange={v => setFormData({...formData, illness: v})} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                <button 
                  onClick={() => setStep(1)}
                  className="w-full border border-white/10 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Reverse Step
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-indigo-500 text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-400 transition-all shadow-xl shadow-indigo-500/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Synthesize Report'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
              value === opt 
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20' 
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ token }: { token: string }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assessments', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setAssessments(data))
    .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 py-10">
      <div className="flex items-center justify-between border-b border-white/10 pb-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-1">Assessment Vault</h2>
          <p className="text-sm text-slate-500 font-sans">Access your historical AI analysis records.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {assessments.length} Records found
        </div>
      </div>
      
      {assessments.length === 0 ? (
        <div className="text-center py-32 glass-card border-dashed border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500">
          No history available. Start your first assessment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map(item => (
            <div key={item.id} className="glass-card group cursor-pointer hover:border-indigo-500/30">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{new Date(item.created_at).toLocaleDateString()}</div>
                <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[8px] uppercase font-bold tracking-widest border border-indigo-500/20">GEMINI_LENS_3</div>
              </div>
              <div className="line-clamp-3 text-sm font-sans tracking-tight text-slate-400 group-hover:text-slate-200 mb-8 font-light leading-relaxed">
                <ReactMarkdown>{item.result}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 group-hover:text-indigo-300 transition-colors">
                View Detailed Report <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AdminDashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ]).then(([s, u]) => {
      setStats(s);
      setUsers(u);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 py-10">
      <div className="flex items-center justify-between border-b border-white/10 pb-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-1">Nexus Console</h2>
          <p className="text-sm text-slate-500 font-sans">System-wide surveillance and growth metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-[10px] font-bold uppercase tracking-widest text-indigo-300">
            Secure Admin Session
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Users size={16} className="text-blue-400" />} label="Total Users" value={stats.users} />
        <StatCard icon={<Database size={16} className="text-indigo-400" />} label="Assessments" value={stats.assessments} />
        <StatCard icon={<TrendingUp size={16} className="text-purple-400" />} label="Avg. Severity" value="MODERATE" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8">Traffic Intelligence (7D)</h3>
          <div className="h-64">
             {stats.viewsByDay && (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={stats.viewsByDay}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                   <XAxis 
                     dataKey="date" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'rgba(255,255,255,0.3)' }} 
                   />
                   <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'rgba(255,255,255,0.3)' }} 
                   />
                   <Tooltip 
                     contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 10 }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }}
                   />
                 </LineChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Quick Actions</h3>
          <div className="space-y-4 flex-1">
            <button className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-between group">
              <span className="text-xs font-bold text-slate-300">Export All Data</span>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </button>
            <button className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-between group">
              <span className="text-xs font-bold text-slate-300">Generate System Audit</span>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </button>
            <button className="w-full text-left p-4 bg-indigo-500/20 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/30 transition-colors flex items-center justify-between group">
              <span className="text-xs font-bold text-indigo-300">Rebuild AI Models</span>
              <Loader2 size={14} className="text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Directory Services</h3>
          <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Manage All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white/5 text-slate-500 uppercase font-bold tracking-widest">
                <th className="p-5">Identity</th>
                <th className="p-5">Permissions</th>
                <th className="p-5 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5">
                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{u.email}</div>
                    <div className="text-[10px] text-slate-600">ID: USER_{u.id.toString().padStart(4, '0')}</div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                      u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-slate-500 border-white/10'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-5 text-right text-slate-500 font-mono">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="glass-card p-6 border-white/5">
      <div className="flex items-center gap-2 text-slate-500 mb-3">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
    </div>
  );
}
