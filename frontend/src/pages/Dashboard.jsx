import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardData, logoutUser, deleteTransaction } from '../services/api';
import { LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddTransactionModal from '../components/AddTransactionModal';
import Logo from '../components/Logo';

// Components
import Overview from '../components/dashboard/Overview';
import Spending from '../components/dashboard/Spending';
import Savings from '../components/dashboard/Savings';
import History from '../components/dashboard/History';
import AIAdvice from '../components/dashboard/AIAdvice';

const LoadingSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 pt-24 animate-pulse">
    <div className="h-20 bg-white/5 rounded-xl mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/5" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="h-80 bg-white/5 rounded-xl" />
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
      <div className="h-full min-h-[500px] bg-white/5 rounded-xl" />
    </div>
  </div>
);

const tabs = ["Overview", "Spending", "Savings", "AI", "History"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const navigate = useNavigate();

  const currency = "₹";

  const loadDashboard = () => {
    fetchDashboardData().then(setData).catch(() => {
      logoutUser();
      navigate('/login');
    });
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    if (!localStorage.getItem('onboardingComplete')) {
      navigate('/onboarding');
      return;
    }
    loadDashboard();
  }, [navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      loadDashboard();
    } catch (err) {
      console.error(err);
      alert('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  if (!data) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen flex flex-col relative pb-20">
      <div className="absolute top-0 right-[10%] w-[500px] h-[400px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Dashboard Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 lg:px-6 pt-8 z-20 flex justify-between items-center relative gap-4">
        <Logo size="small" />
        
        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute inset-0 bg-primary/20 border border-primary/50 text-white rounded-lg z-0" 
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 rounded-lg backdrop-blur-md"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      {/* Mobile Tabs Dropdown or Scrollable Strip */}
      <div className="md:hidden w-full px-4 mt-6 z-20">
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 lg:px-6 pt-8 pb-8 flex-1 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "Overview" && <Overview data={data} currency={currency} />}
            {activeTab === "Spending" && <Spending data={data} currency={currency} onDelete={handleDelete} deletingId={deletingId} onAdd={() => setIsModalOpen(true)} />}
            {activeTab === "Savings" && <Savings data={data} currency={currency} />}
            {activeTab === "AI" && <AIAdvice data={data} currency={currency} />}
            {activeTab === "History" && <History data={data} currency={currency} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadDashboard} 
      />
    </div>
  );
}
