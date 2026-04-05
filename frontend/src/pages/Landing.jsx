import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockPieData = [
  { name: 'Rent', value: 400 },
  { name: 'Food', value: 300 },
  { name: 'Leisure', value: 300 },
];
const COLORS = ['#8B5CF6', '#06B6D4', '#F43F5E'];

const mockLineData = [
  { name: 'Jan', val: 400 },
  { name: 'Feb', val: 300 },
  { name: 'Mar', val: 550 },
  { name: 'Apr', val: 450 },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-10 pb-20 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl px-6 flex justify-between items-center mb-16 z-10 glass-panel py-4 mx-4">
        <Logo size="small" />
        <Link to="/login" className="glass-button">
          Login / Register
        </Link>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10 flex-col-reverse lg:flex-row">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full w-max text-sm font-medium text-secondary mb-4">
            <Sparkles className="w-4 h-4" /> AI-powered personalized savings advisor
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight">
            Take Control of Your <br />
            <span className="text-gradient">Financial Future</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Connect your accounts, let our AI analyze your spending patterns, and get personalized recommendations to grow your total net worth seamlessly.
          </p>
          <div className="flex gap-4 mt-4">
            <Link to="/login" className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all w-max flex items-center gap-2">
              Get Started Now <TrendingUp className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="flex gap-8 mt-10 text-muted-foreground border-t border-white/10 pt-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm">Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Smart AI Insights</span>
            </div>
          </div>
        </motion.div>

        {/* Hero Visual Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full h-[500px]"
        >
          <div className="absolute inset-0 glass-panel p-6 flex flex-col gap-6 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg">Dashboard Preview</h3>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 h-48">
                <p className="text-xs text-muted-foreground mb-4">Expenses Overview</p>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={mockPieData} innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value">
                      {mockPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 h-48">
                <p className="text-xs text-muted-foreground mb-4">Monthly Trend</p>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={mockLineData}>
                    <Line type="monotone" dataKey="val" stroke="#06B6D4" strokeWidth={3} dot={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-primary/20 border border-primary/30 rounded-lg p-4 mt-2 flex gap-4 items-center">
              <div className="p-3 bg-primary/20 rounded-full">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI Recommendation</p>
                <p className="text-xs text-muted-foreground mt-1">Reduce food spending by 15% to hit your savings goal this month.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
