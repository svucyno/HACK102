import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Award, Clock } from 'lucide-react';

export default function Savings({ data, currency }) {
  const income = data.income || 0;
  const savings = data.savings || 0;
  const savingsPct = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
  
  const targetPct = 20; // Example target
  const diffPct = savingsPct - targetPct;
  const isMeetingGoal = diffPct >= 0;

  const sixMonthProjection = savings * 6;
  const yearlyProjection = savings * 12;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">Savings Tracker</h3>
        <p className="text-4xl font-extrabold mb-1">{savingsPct}%</p>
        <p className="text-sm text-muted-foreground mb-8">of your {currency}{income.toLocaleString()} monthly income</p>
        
        <div className="w-full bg-white/10 rounded-full h-3 mb-2 overflow-hidden relative">
          <div 
            className={`h-3 rounded-full ${isMeetingGoal ? 'bg-green-400' : 'bg-primary'}`} 
            style={{ width: `${Math.min(savingsPct, 100)}%`, transition: 'width 1s ease' }}
          ></div>
        </div>
        <div className="flex justify-between w-full text-xs font-semibold text-muted-foreground">
          <span>0%</span>
          <span>Target: {targetPct}%</span>
          <span>100%</span>
        </div>

        <div className={`mt-6 px-4 py-2 rounded-lg border ${isMeetingGoal ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'} text-sm flex items-center gap-2`}>
          {isMeetingGoal ? (
            <><TrendingUp className="w-4 h-4"/> Great job! You are exceeding your target.</>
          ) : (
            <><TrendingUp className="w-4 h-4"/> You are {Math.abs(diffPct).toFixed(1)}% away from your target.</>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-6">
        <div className="glass-panel p-6 border-l-4 border-l-purple-500 flex items-start gap-4">
          <div className="p-3 bg-white/5 rounded-xl"><Award className="w-6 h-6 text-purple-400" /></div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Monthly Goal</h4>
            <p className="text-2xl font-bold">{currency}{savings.toLocaleString()}</p>
            <p className="text-xs text-purple-400 mt-1">Currently saved this month</p>
          </div>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-cyan-500 flex items-start gap-4">
          <div className="p-3 bg-white/5 rounded-xl"><Clock className="w-6 h-6 text-cyan-400" /></div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">6-Month Projection</h4>
            <p className="text-2xl font-bold">You will save {currency}{sixMonthProjection.toLocaleString()}</p>
            <p className="text-xs text-cyan-400 mt-1">If you maintain this rate for 6 months</p>
          </div>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-indigo-500 flex items-start gap-4">
          <div className="p-3 bg-white/5 rounded-xl"><TrendingUp className="w-6 h-6 text-indigo-400" /></div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Yearly Projection</h4>
            <p className="text-2xl font-bold">{currency}{yearlyProjection.toLocaleString()}</p>
            <p className="text-xs text-indigo-400 mt-1">Estimated savings by end of year</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
