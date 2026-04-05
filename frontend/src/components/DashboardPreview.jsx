import { motion } from 'framer-motion';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles } from 'lucide-react';

const areaData = [
  { month: 'Jan', val: 400 },
  { month: 'Feb', val: 300 },
  { month: 'Mar', val: 550 },
  { month: 'Apr', val: 450 },
  { month: 'May', val: 700 },
];

const pieData = [
  { name: 'Rent', value: 45 },
  { name: 'Food', value: 25 },
  { name: 'Leisure', value: 30 },
];
const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6'];

export default function DashboardPreview() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="w-full max-w-5xl mx-auto px-6 relative z-10"
    >
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-8">
        
        {/* Charts Column */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-white">Dashboard Overview</h3>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 h-48 flex flex-col">
              <p className="text-xs text-gray-400 font-medium mb-2">Monthly Trend</p>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 h-48 flex flex-col">
              <p className="text-xs text-gray-400 font-medium mb-2">Expenses</p>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* AI Column */}
        <div className="w-full md:w-80 flex flex-col gap-4 justify-center">
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-16 h-16 text-blue-400" />
            </div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h4 className="font-semibold text-white text-sm">AI Recommendation</h4>
            </div>
            <p className="text-sm text-gray-300 relative z-10 leading-relaxed">
              "Reduce food spending by <span className="text-blue-400 font-bold">15%</span> to stay on track for your monthly savings goal. Try cooking dinner at home twice a week."
            </p>
            <button className="mt-4 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors relative z-10">
              View Insight Details &rarr;
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
