import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from './Logo';

export default function Hero() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="flex flex-col items-center justify-center text-center z-10 w-full">
      <Logo />

      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl"
      >
        Take Control of Your <br />
        <span className="text-gradient">Financial Future</span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10"
      >
        Connect your accounts, let our AI analyze your spending patterns, and get personalized recommendations to grow your total net worth seamlessly.
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap gap-4 justify-center items-center"
      >
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
              Login
            </Link>
            <Link to="/register" className="primary-button group">
              Get Started 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> Add Transaction
            </Link>
            <Link to="/dashboard" className="primary-button group">
              Go to Dashboard 
              <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
