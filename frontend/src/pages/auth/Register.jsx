import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/api';
import { Shield, Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    company_name: '',
    role: 'applicant',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await registerUser(form);
      login(data.access_token, data.user);
      navigate(data.user.role === 'bank_officer' ? '/officer/dashboard' : '/applicant/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden auth-left-panel">
        <div className="auth-geo auth-geo-1" />
        <div className="auth-geo auth-geo-2" />
        <div className="auth-geo auth-geo-3" />
        <div className="auth-geo auth-geo-4" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-300" />
              </div>
              <span className="text-white text-lg font-semibold tracking-tight">CrediSight AI</span>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Start Your Credit Journey
            </h1>
            <p className="text-primary-200/80 text-base leading-relaxed mb-8">
              Register as a loan applicant to submit applications and track their status,
              or join as a bank officer to review, analyze, and decide on corporate credit requests.
            </p>
            <div className="flex flex-col gap-3">
              {[
                'Submit and track loan applications',
                'AI-powered document analysis',
                'Real-time application status updates',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                  <span className="text-primary-100/90 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-primary-300/50 text-xs tracking-wide uppercase">Secure Access Portal</p>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile-only branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0A1F44] rounded-xl mb-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">CrediSight AI</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="full_name"
                    required
                    className="auth-input pl-10"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    className="auth-input pl-10"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    className="auth-input pl-10 pr-10"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="company_name"
                    className="auth-input pl-10"
                    value={form.company_name}
                    onChange={handleChange}
                    placeholder="Your company name"
                  />
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Type</label>
                <select
                  name="role"
                  className="auth-input"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="applicant">Loan Applicant</option>
                  <option value="bank_officer">Bank Officer</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#0A1F44] hover:text-[#152D5B] transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 tracking-wide uppercase">Secure Access Portal</p>
        </div>
      </div>
    </div>
  );
}
