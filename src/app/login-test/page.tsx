import Link from "next/link";

export default function LoginTestPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      
      {/* Form Container */}
      <div className="relative z-20 w-full max-w-md">
        <div className="bg-black/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-gray-700 shadow-2xl">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/cryptorafts.logo.png" 
                alt="Cryptorafts" 
                className="h-16 w-16"
                width={64}
                height={64}
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/70">Sign in to your account</p>
          </div>

          {/* Test Form */}
          <form className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black/90 text-white/70">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium transition-all duration-300 border border-white/20 hover:border-white/40 flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <div>
              <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                Forgot your password?
              </Link>
            </div>
            <div>
              <p className="text-white/70">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Test Links */}
          <div className="mt-4 text-center space-y-2">
            <p className="text-xs text-white/50">Test Pages:</p>
            <div className="flex gap-2 justify-center text-xs">
              <Link href="/login" className="text-blue-400 hover:text-blue-300">Main</Link>
              <Link href="/signup" className="text-blue-400 hover:text-blue-300">Signup</Link>
              <Link href="/signup-static" className="text-blue-400 hover:text-blue-300">Static</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
