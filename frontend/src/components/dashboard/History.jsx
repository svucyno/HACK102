import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { History as HistoryIcon, TrendingUp } from 'lucide-react';

export default function History({ data, currency }) {
  const trendData = data.trendData || [];
  
  // Calculate insight
  let insightMsg = "Not enough data to calculate trend insights yet.";
  if (trendData.length >= 2) {
    const lastMonth = trendData[trendData.length - 1].expenses;
    const prevMonth = trendData[trendData.length - 2].expenses;
    const diff = lastMonth - prevMonth;
    if (prevMonth > 0) {
      const pct = ((Math.abs(diff) / prevMonth) * 100).toFixed(1);
      if (diff > 0) {
        insightMsg = `Your spending increased by ${pct}% compared to the previous month. Keep an eye on your budget!`;
      } else {
        insightMsg = `Great job! Your spending decreased by ${pct}% compared to the previous month.`;
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/20 rounded-xl"><TrendingUp className="w-6 h-6 text-primary" /></div>
          <div>
            <h3 className="font-semibold text-lg">Spending Trends Insight</h3>
            <p className="text-sm text-muted-foreground">{insightMsg}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 flex flex-col min-h-[450px]">
        <div className="flex items-center gap-2 mb-6">
          <HistoryIcon className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold">Month-over-Month Spending</h3>
        </div>
        
        <div className="flex-1 w-full min-h-[350px]">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl">
              No historical data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `${currency}${val}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => [`${currency}${value.toLocaleString('en-IN')}`, 'Expenses']}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#06B6D4" 
                  strokeWidth={3} 
                  dot={{ fill: '#06B6D4', strokeWidth: 2 }} 
                  activeDot={{ r: 8, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  );
}
