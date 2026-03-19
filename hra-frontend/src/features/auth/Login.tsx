import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginThunk } from '../../store/authSlice';


interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPass, setShowPass] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useAppSelector((s) => s.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    const result = await dispatch(loginThunk(data));
    if (loginThunk.fulfilled.match(result)) {
      const user = result.payload.user;
      toast.success(`Welcome back, ${user.first_name || user.email}!`);
      if (user.must_change_password) {
        navigate('/change-password-required', { replace: true });
        return;
      }
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || (user.is_admin_user ? '/admin/dashboard' : '/dashboard'), { replace: true });
    } else {
      toast.error(result.payload as string || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#046bd2" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #046bd2, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: '580px' }}>

          {/* Left Panel — HRA Animation */}
          <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center"
            style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d2148 60%, #0a1628 100%)' }}>

            <style>{`
              @keyframes hra-fadeup { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
              @keyframes hra-pulse { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.8;transform:scale(1.15)} }
              @keyframes hra-flow { 0%{stroke-dashoffset:120} 100%{stroke-dashoffset:0} }
              @keyframes hra-orbit { from{transform:rotate(0deg) translateX(88px) rotate(0deg)} to{transform:rotate(360deg) translateX(88px) rotate(-360deg)} }
              @keyframes hra-orbit2 { from{transform:rotate(180deg) translateX(60px) rotate(-180deg)} to{transform:rotate(540deg) translateX(60px) rotate(-540deg)} }
              @keyframes hra-blink { 0%,100%{opacity:.2} 50%{opacity:.9} }
              @keyframes hra-slide { 0%{width:0%} 100%{width:var(--w)} }
              @keyframes hra-count { 0%{opacity:0} 100%{opacity:1} }
              .hra-card { animation: hra-fadeup .7s ease forwards; opacity:0; }
              .hra-node { animation: hra-pulse 2.5s ease-in-out infinite; }
              .hra-line { stroke-dasharray:120; animation: hra-flow 1.8s linear infinite; }
              .hra-orbit1 { animation: hra-orbit 7s linear infinite; transform-origin: 140px 130px; }
              .hra-orbit2 { animation: hra-orbit2 10s linear infinite; transform-origin: 140px 130px; }
              .hra-dot { animation: hra-blink 1.5s ease-in-out infinite; }
              .hra-bar { animation: hra-slide 1.5s ease forwards; }
            `}</style>

            {/* Central org chart + orbiting icons */}
            <div className="relative w-72 h-64 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 280 260">

                {/* Org chart lines */}
                <line x1="140" y1="52" x2="75" y2="110" stroke="#046bd2" strokeWidth="1" opacity="0.4" className="hra-line" />
                <line x1="140" y1="52" x2="140" y2="110" stroke="#046bd2" strokeWidth="1" opacity="0.4" className="hra-line" style={{animationDelay:'.3s'}} />
                <line x1="140" y1="52" x2="205" y2="110" stroke="#046bd2" strokeWidth="1" opacity="0.4" className="hra-line" style={{animationDelay:'.6s'}} />
                <line x1="75" y1="128" x2="45" y2="180" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.3" className="hra-line" style={{animationDelay:'.4s'}} />
                <line x1="75" y1="128" x2="105" y2="180" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.3" className="hra-line" style={{animationDelay:'.7s'}} />
                <line x1="205" y1="128" x2="175" y2="180" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.3" className="hra-line" style={{animationDelay:'.5s'}} />
                <line x1="205" y1="128" x2="235" y2="180" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.3" className="hra-line" style={{animationDelay:'.9s'}} />

                {/* Top node — Admin/HR */}
                <g className="hra-node" style={{animationDelay:'0s'}}>
                  <circle cx="140" cy="38" r="20" fill="#046bd2" opacity="0.9"/>
                  {/* person icon */}
                  <circle cx="140" cy="33" r="5" fill="white" opacity="0.9"/>
                  <path d="M129,50 Q140,44 151,50" fill="white" opacity="0.9"/>
                </g>
                <text x="140" y="68" textAnchor="middle" fill="#93c5fd" fontSize="7" opacity="0.8">HR Admin</text>

                {/* Level 2 nodes */}
                {[
                  {cx:75, label:'Finance', delay:'0.2s'},
                  {cx:140, label:'Operations', delay:'0.4s'},
                  {cx:205, label:'IT Dept', delay:'0.6s'},
                ].map(({cx, label, delay}) => (
                  <g key={label}>
                    <g className="hra-node" style={{animationDelay:delay}}>
                      <circle cx={cx} cy="120" r="14" fill="#045cb4" opacity="0.85"/>
                      <circle cx={cx} cy="116" r="4" fill="white" opacity="0.85"/>
                      <path d={`M${cx-8},130 Q${cx},126 ${cx+8},130`} fill="white" opacity="0.85"/>
                    </g>
                    <text x={cx} y="143" textAnchor="middle" fill="#93c5fd" fontSize="6.5" opacity="0.7">{label}</text>
                  </g>
                ))}

                {/* Level 3 small nodes */}
                {[45,105,175,235].map((cx, i) => (
                  <g key={cx} className="hra-node" style={{animationDelay:`${0.3+i*0.2}s`}}>
                    <circle cx={cx} cy="188" r="9" fill="#0369a1" opacity="0.7"/>
                    <circle cx={cx} cy="185" r="3" fill="white" opacity="0.8"/>
                    <path d={`M${cx-5},194 Q${cx},191 ${cx+5},194`} fill="white" opacity="0.8"/>
                  </g>
                ))}

                {/* Orbiting feature icons */}
                {/* Calendar icon orbit */}
                <g className="hra-orbit1">
                  <rect x="124" y="114" width="16" height="16" rx="3" fill="#0ea5e9" opacity="0.9"/>
                  <line x1="127" y1="118" x2="137" y2="118" stroke="white" strokeWidth="1.2" opacity="0.9"/>
                  <line x1="127" y1="121" x2="134" y2="121" stroke="white" strokeWidth="1" opacity="0.7"/>
                  <line x1="127" y1="124" x2="131" y2="124" stroke="white" strokeWidth="1" opacity="0.7"/>
                  <line x1="132" y1="114" x2="132" y2="112" stroke="white" strokeWidth="1.2"/>
                  <line x1="136" y1="114" x2="136" y2="112" stroke="white" strokeWidth="1.2"/>
                </g>

                {/* Clock icon orbit */}
                <g className="hra-orbit2">
                  <circle cx="132" cy="122" r="9" fill="#7c3aed" opacity="0.9"/>
                  <line x1="132" y1="116" x2="132" y2="122" stroke="white" strokeWidth="1.2"/>
                  <line x1="132" y1="122" x2="137" y2="125" stroke="white" strokeWidth="1.2"/>
                </g>

                {/* Blinking status dots */}
                {[
                  {cx:50, cy:210, color:'#22c55e', delay:'0s'},
                  {cx:110, cy:210, color:'#22c55e', delay:'.5s'},
                  {cx:180, cy:210, color:'#f59e0b', delay:'1s'},
                  {cx:240, cy:210, color:'#22c55e', delay:'.3s'},
                ].map(({cx,cy,color,delay},i) => (
                  <circle key={i} cx={cx} cy={cy} r="4" fill={color} className="hra-dot" style={{animationDelay:delay}}/>
                ))}

                {/* Data flow dots moving along org lines */}
                <circle r="3" fill="#38bdf8" opacity="0.9">
                  <animateMotion dur="2s" repeatCount="indefinite">
                    <mpath href="#orgpath1"/>
                  </animateMotion>
                </circle>
                <circle r="2.5" fill="#a78bfa" opacity="0.9">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin="0.8s">
                    <mpath href="#orgpath2"/>
                  </animateMotion>
                </circle>
                <path id="orgpath1" d="M140,52 L75,110 L45,180" fill="none"/>
                <path id="orgpath2" d="M140,52 L205,110 L235,180" fill="none"/>
              </svg>
            </div>

            {/* Animated stat bars */}
            <div className="w-64 mt-2 space-y-2 px-2">
              {[
                {label:'Attendance', pct:'85%', color:'#046bd2', delay:'.2s'},
                {label:'Leave Balance', pct:'60%', color:'#0ea5e9', delay:'.5s'},
                {label:'Payroll Done', pct:'92%', color:'#22c55e', delay:'.8s'},
              ].map(({label,pct,color,delay}) => (
                <div key={label}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px] text-blue-300 opacity-70">{label}</span>
                    <span className="text-[10px] text-blue-200 opacity-80">{pct}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full hra-bar" style={{'--w':pct, background:color, animationDelay:delay} as React.CSSProperties}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Title */}
            <div className="mt-5 text-center px-8 hra-card" style={{animationDelay:'.1s'}}>
              <p className="text-white text-base font-bold tracking-wide">Human Resource Administration</p>
              <p className="text-blue-300 text-xs mt-1 opacity-60">Manage · Track · Analyze</p>
            </div>

            {/* Feature pills */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 flex-wrap px-6">
              {['Attendance','Leave Mgmt','Payslips','Org Chart'].map((tag,i) => (
                <span key={tag} className="hra-dot text-[9px] px-2 py-0.5 rounded-full border border-blue-500/40 text-blue-300"
                  style={{animationDelay:`${i*0.4}s`}}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Right Panel — Form */}
          <div className="flex-1 bg-white flex flex-col justify-between p-8 lg:p-10">
            <div>
              {/* Mobile logo */}
              <div className="lg:hidden mb-8">
                <img src="/sta-logo.svg" alt="STA Technologies" className="h-10" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
              <p className="text-gray-500 text-sm mb-8">Sign in to your HRA account</p>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                      style={{ '--tw-ring-color': '#046bd2' } as React.CSSProperties}
                      placeholder="you@statech.in"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                      })}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                      placeholder="••••••••"
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div className="flex justify-end">
                  <Link to="/request-reset" className="text-sm font-medium hover:underline" style={{ color: '#046bd2' }}>
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #046bd2, #045cb4)' }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>
              </form>

            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} STA Technologies. All rights reserved.
              </p>
              <p className="text-xs text-gray-300 mt-0.5">Version 1.0 — HRA System</p>
            </div>
          </div>

        </div>
      </div>

      {/* Page footer */}
      <div className="relative z-10 text-center py-4">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} STA Technologies · Human Resource Administration System · v1.0
        </p>
      </div>
    </div>
  );
};

export default Login;
