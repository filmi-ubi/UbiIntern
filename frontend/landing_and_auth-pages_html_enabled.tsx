import React, { useState, useEffect } from 'react';
import { Shield, Mail, Phone, Lock, ArrowRight, Building, Users, Loader2, CheckCircle, AlertCircle, Key, ChevronLeft, Eye, EyeOff, Globe, Briefcase, Zap, FileText, Calendar } from 'lucide-react';

// Main Login Component - Routes to Employee or Customer login
const LoginRouter = () => {
  const [selectedPath, setSelectedPath] = useState(null);

  if (!selectedPath) {
    return <LoginTypeSelector onSelect={setSelectedPath} />;
  }

  if (selectedPath === 'employee') {
    return <EmployeeLogin onBack={() => setSelectedPath(null)} />;
  }

  return <CustomerLogin onBack={() => setSelectedPath(null)} />;
};

// Login Type Selector
const LoginTypeSelector = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Business Automation Platform</h1>
          <p className="text-gray-600 mt-2">Select how you'd like to sign in</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Employee Login */}
          <button
            onClick={() => onSelect('employee')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:scale-[1.02] text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Employee Sign In</h2>
            <p className="text-gray-600 mb-4">
              Sign in with your company Google Workspace account to access the employee dashboard
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              Continue with Google
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          {/* Customer Login */}
          <button
            onClick={() => onSelect('customer')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:scale-[1.02] text-left"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Customer Portal</h2>
            <p className="text-gray-600 mb-4">
              Access your customer portal to view documents, meetings, and manage your account
            </p>
            <div className="flex items-center text-green-600 font-medium">
              Sign in with Email
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600">
              Having trouble signing in?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Employee Login with Google
const EmployeeLogin = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // In production, this would initiate Google OAuth flow
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to employee dashboard
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Sign In</h2>
            <p className="text-gray-600 mt-2">Use your company Google account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Only @company.com email addresses are allowed
            </p>
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">Email Integration</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Drive Access</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600">Calendar Sync</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customer Login with Email/Phone
const CustomerLogin = ({ onBack }) => {
  const [step, setStep] = useState('email'); // email, otp, password
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const handleEmailSubmit = () => {
    if (!email || !phone) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    // Check if email exists and if it's pre-approved
    setTimeout(() => {
      setIsLoading(false);
      // If pre-approved but no account, show registration
      // If existing account, proceed to OTP
      setStep('otp');
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleOtpSubmit(fullOtp);
      }
    }
  };

  const handleOtpSubmit = async (otpCode) => {
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      setIsLoading(false);
      if (isNewUser) {
        setStep('password');
      } else {
        // Login successful, redirect to customer portal
      }
    }, 1500);
  };

  const handlePasswordSubmit = () => {
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      setIsLoading(false);
      // Account created, redirect to customer portal
    }, 1500);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Portal</h2>
            <p className="text-gray-600 mt-2">
              {step === 'email' && 'Enter your email to continue'}
              {step === 'otp' && 'Verify your phone number'}
              {step === 'password' && 'Create your account'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleEmailSubmit)}
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="you@company.com"
                    />
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleEmailSubmit)}
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleEmailSubmit}
                disabled={isLoading}
                className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 text-center">
                  We've sent a verification code to
                </p>
                <p className="font-medium text-center">{phone}</p>
              </div>

              <div className="flex justify-center space-x-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ))}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-green-600 hover:text-green-800"
                  disabled={isLoading}
                >
                  Resend code
                </button>
              </div>

              {isLoading && (
                <div className="mt-6 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              )}
            </div>
          )}

          {/* Password Step (for new users) */}
          {step === 'password' && (
            <div>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Your account has been pre-approved!
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Create a password to complete your registration.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handlePasswordSubmit)}
                      className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter a strong password"
                    />
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>
              </div>

              <button
                onClick={handlePasswordSubmit}
                disabled={isLoading}
                className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a href="#" className="text-green-600 hover:text-green-800 font-medium">
                Contact your account manager
              </a>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-1" />
            Secured with enterprise-grade encryption
          </div>
        </div>
      </div>
    </div>
  );
};

// API Key Login Component (for documentation)
const APIKeyAuth = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">API Authentication</h2>
              <p className="text-gray-600">Use API keys for service-to-service authentication</p>
            </div>
          </div>

          <div className="bg-gray-900 text-gray-100 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-400 mb-2">Example API Request</p>
            <pre className="text-sm">
{`curl -X GET https://api.platform.com/v1/customers \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="bap_1234567890abcdef..."
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Rate Limits</h4>
                <p className="text-sm text-blue-700">1,000 requests/hour</p>
                <p className="text-sm text-blue-700">10,000 requests/day</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">Permissions</h4>
                <p className="text-sm text-green-700">Read: All resources</p>
                <p className="text-sm text-green-700">Write: Limited scope</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Keep your API keys secure</p>
                <p className="mt-1">Never expose API keys in client-side code or public repositories.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Password Reset Component
const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-600 rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="text-gray-600 mt-2">
              {!isSubmitted ? "We'll send you instructions to reset your password" : "Check your email"}
            </p>
          </div>

          {!isSubmitted ? (
            <div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@company.com"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !email}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Return to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Session Timeout Warning Component
const SessionTimeoutWarning = ({ onExtend, onLogout, remainingTime }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Session Expiring Soon</h3>
          <p className="text-gray-600 mb-4">
            Your session will expire in {remainingTime} seconds. Would you like to continue?
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onLogout}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Log Out
            </button>
            <button
              onClick={onExtend}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the main component with additional auth utilities
const AuthenticationSystem = () => {
  const [showTimeout, setShowTimeout] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);

  // Example of session timeout handling
  useEffect(() => {
    if (showTimeout && remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(remainingTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showTimeout, remainingTime]);

  return (
    <>
      <LoginRouter />
      {showTimeout && (
        <SessionTimeoutWarning
          remainingTime={remainingTime}
          onExtend={() => {
            setShowTimeout(false);
            setRemainingTime(60);
          }}
          onLogout={() => {
            // Handle logout
            setShowTimeout(false);
          }}
        />
      )}
    </>
  );
};

export default AuthenticationSystem;