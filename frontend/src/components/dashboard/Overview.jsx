import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Wallet, Target, PieChart, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCategoryData } from '../../utils/categoryConfig';

export default function Overview({ data, currency }) {
  const topCategory = data.categoryData && data.categoryData.length > 0 
    ? [...data.categoryData].sort((a, b) => b.value - a.value)[0]
    : null;
  const topCatConfig = topCategory ? getCategoryData(topCategory.name) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content Area */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-l-4 border-l-red-400">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-sm font-medium">Total Spending</p>
              <div className="p-2 bg-red-400/20 rounded-md"><TrendingDown className="w-4 h-4 text-red-400" /></div>
            </div>
            <h3 className="text-3xl font-bold">{currency}{data.totalSpending?.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-red-400 mt-2">↑ 12% from last month</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-l-4 border-l-green-400">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-sm font-medium">Total Savings</p>
              <div className="p-2 bg-green-400/20 rounded-md"><Wallet className="w-4 h-4 text-green-400" /></div>
            </div>
            <h3 className="text-3xl font-bold">{currency}{data.savings?.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-green-400 mt-2">↓ 5% from last month</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 border-l-4 border-l-primary">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-sm font-medium">Budget Usage</p>
              <div className="p-2 bg-primary/20 rounded-md"><Target className="w-4 h-4 text-primary" /></div>
            </div>
            <h3 className="text-3xl font-bold">{data.budgetUsage}%</h3>
            <div className="w-full bg-white/10 rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${data.budgetUsage}%` }}></div>
            </div>
          </motion.div>
        </div>

        {/* Categories Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold flex items-center gap-2"><PieChart className="w-4 h-4"/> Expenses by Category</h3>
            {topCategory && (
              <div className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-md text-muted-foreground flex items-center gap-1.5">
                Top: <span className="text-white font-bold">{topCatConfig.icon} {topCategory.name}</span>
              </div>
            )}
          </div>
          <div className="pr-4 flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie data={data.categoryData || []} innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                  {(data.categoryData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryData(entry.name).color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }} 
                  itemStyle={{ color: '#fff' }}
                  formatter={(value, name) => [`${currency}${value.toLocaleString('en-IN')}`, `${getCategoryData(name).icon} ${name}`]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center">
            {(data.categoryData || []).map((cat) => {
              const config = getCategoryData(cat.name);
              return (
                <div key={cat.name} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span>{config.icon} {cat.name}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* AI Side Panel */}
      <div className="lg:col-span-1 border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent rounded-2xl">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">AI Recommendations</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Based on your activity this month, here are verified steps to optimize your savings.</p>
          
          <div className="flex flex-col gap-4 overflow-y-auto">
            {data.aiRecommendations?.map((rec) => (
              <div key={rec.id} className="bg-white/5 border border-white/10 p-5 rounded-xl hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{rec.title}</h4>
                  {rec.priority === 'High' && <span className="bg-red-500/20 text-red-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3"/> High Priority</span>}
                  {rec.priority === 'Medium' && <span className="bg-yellow-500/20 text-yellow-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Medium Priority</span>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rec.suggestion}
                </p>
                {rec.potentialSavings > 0 && (
                  <p className="text-xs font-semibold text-green-400 mt-2">
                    Save up to {currency}{rec.potentialSavings.toLocaleString('en-IN')}/mo
                  </p>
                )}
                <button className="mt-4 text-primary text-xs font-semibold flex items-center gap-1 justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                  Take Action <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
