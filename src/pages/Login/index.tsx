import { useEffect, useState } from "react";
import "./index.less";
import logo from "../../assets/logo.png";
import petImg from "../../assets/img/image.png";
import { loginUser } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard'); 
    }
    document.title = "Login - :Dogtor VET Services";
  }, [navigate, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser({ email, password });
      
      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.token) {
        const token = response.data.data.token;
        const refreshToken = response.data.data.refresh_token;
        
        // Store refresh token in localStorage
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        await login(token); // Use AuthContext login method
        navigate("/dashboard");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      // Handle different error response formats
      let errorMessage = "Invalid email or password";
      
      if (err.response && err.response.data) {
        // FastAPI returns errors with 'detail' field
        errorMessage = err.response.data.detail || 
                      err.response.data.message || 
                      "Login failed";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      // Only clear the password field, keep the email
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center login-animated-bg p-4 relative overflow-hidden">
      {/* Floating animated elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-element absolute top-20 left-10 w-16 h-16 bg-white/5 rounded-full"></div>
        <div className="floating-element-reverse absolute top-40 right-20 w-12 h-12 bg-white/10 rounded-full"></div>
        <div className="floating-element absolute bottom-32 left-1/4 w-8 h-8 bg-white/15 rounded-full"></div>
        <div className="floating-element-reverse absolute top-1/3 right-1/3 w-20 h-20 bg-white/5 rounded-full"></div>
        <div className="floating-element absolute bottom-20 right-10 w-14 h-14 bg-white/8 rounded-full"></div>
        
        {/* Medical icons floating */}
        <div className="floating-element absolute top-1/4 left-1/3 text-white/20 text-2xl">🏥</div>
        <div className="floating-element-reverse absolute bottom-1/3 right-1/4 text-white/15 text-3xl">🐕</div>
        <div className="floating-element absolute top-3/4 left-1/5 text-white/10 text-xl">🐱</div>
        <div className="floating-element-reverse absolute top-1/2 right-1/6 text-white/25 text-2xl">💊</div>
        <div className="floating-element absolute bottom-1/4 left-3/4 text-white/20 text-xl">🩺</div>
      </div>

      {/* Mobile & Tablet Layout (No Picture) */}
      <div className="xl:hidden w-full max-w-sm">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <img className="w-16 h-16 mx-auto mb-3 drop-shadow-lg" src={logo} alt="logo" />
            <h1 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
              <span className="inline-block rotate-90 mr-1 text-2xl" style={{ fontFamily: 'Caveat, cursive' }}>:D</span>
              <span style={{ fontFamily: 'Caveat, cursive' }}>ogtor VET Services</span>
            </h1>
            <p className="text-white/80 text-sm">Welcome back! Please sign in to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-3 rounded-2xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-xs text-red-100 font-medium">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/90 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-3 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all text-sm"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white/90 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3 py-2.5 pr-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all text-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 focus:outline-none transition-colors"
                  disabled={isLoading}
                >
                  <FontAwesomeIcon 
                    icon={showPassword ? faEyeSlash : faEye} 
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Layout (With Picture) */}
      <div className="hidden xl:flex w-full max-w-5xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden h-[550px]">
        {/* Left Side - Form */}
        <div className="flex-1 flex flex-col justify-center px-10 2xl:px-12 max-w-md">
          {/* Logo and Title */}
          <div className="mb-6">
            <img className="w-14 h-14 mb-3 drop-shadow-lg" src={logo} alt="logo" />
            <h1 className="text-2xl 2xl:text-3xl font-bold text-white mb-2 drop-shadow-lg">
              <span className="inline-block rotate-90 mr-1 text-3xl 2xl:text-4xl" style={{ fontFamily: 'Caveat, cursive' }}>:D</span>
              <span style={{ fontFamily: 'Caveat, cursive' }}>ogtor VET Services</span>
            </h1>
            <p className="text-white/80">Welcome back! Please sign in to continue</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-3 rounded-2xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-sm text-red-100 font-medium">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="desktop-email" className="block text-sm font-medium text-white/90 mb-1">
                Email Address
              </label>
              <input
                id="desktop-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-3 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="desktop-password" className="block text-sm font-medium text-white/90 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="desktop-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3 py-2.5 pr-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 focus:outline-none transition-colors"
                  disabled={isLoading}
                >
                  <FontAwesomeIcon 
                    icon={showPassword ? faEyeSlash : faEye} 
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
        
        {/* Right Side - Image (Desktop Only, No Blur) */}
        <div className="flex-1 relative overflow-hidden">
          <img
            className="w-full h-full object-cover"
            src={petImg}
            alt="Veterinary Services"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h2 className="text-2xl 2xl:text-3xl font-bold mb-2 drop-shadow-lg">
              Professional Pet Care
            </h2>
            <p className="text-base opacity-90 drop-shadow-sm">
              Comprehensive veterinary services for your beloved companions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
