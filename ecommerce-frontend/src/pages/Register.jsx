import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Lock, Mail, User } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password);
      navigate('/login?registered=true');
    } catch (err) {
      setError(err?.message || 'Registration failed. Email might already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-sm shadow-md border border-gray-200 w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side Banner */}
        <div className="bg-[#2874f0] text-white p-10 md:w-2/5 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-3">Looks like you're new here!</h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Sign up with your details to get started with shopping.
            </p>
          </div>
          <div className="hidden md:block">
            <span className="text-xs text-blue-200">Safe and Secure Experience</span>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="p-8 md:p-10 md:w-3/5 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full text-sm border-b border-gray-300 py-2 focus:outline-none focus:border-[#2874f0] transition"
                />
                <User size={16} className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full text-sm border-b border-gray-300 py-2 focus:outline-none focus:border-[#2874f0] transition"
                />
                <Mail size={16} className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full text-sm border-b border-gray-300 py-2 focus:outline-none focus:border-[#2874f0] transition"
                />
                <Lock size={16} className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#fb641b] hover:bg-[#e85b17] disabled:bg-gray-300 text-white font-bold py-3 rounded text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow transition"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'CONTINUE'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-[#2874f0] text-sm font-semibold hover:underline"
            >
              Existing User? Log in
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;