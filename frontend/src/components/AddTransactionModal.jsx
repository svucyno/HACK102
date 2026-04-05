import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, DollarSign, Tag, Calendar, FileText } from 'lucide-react';
import { addTransaction } from '../services/api';

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'expense',
  });

  // Pull active categories efficiently (fallback default list)
  const availableCategories = ['Housing', 'Food', 'Transport', 'Utilities', 'Insurance', 'Medical', 'Saving Tools', 'Personal', 'Entertainment'];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    setLoading(true);
    setError(null);

    try {
      await addTransaction({
        ...formData,
        amount: Number(formData.amount),
        date: new Date(formData.date).toISOString(),
      });
      onSuccess(); // Trigger dashboard refetch
      onClose();   // Close modal
    } catch (err) {
      setError(err.message || 'Failed to add transaction.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0f172a] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative z-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Add Transaction</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && <div className="p-3 mb-4 text-sm bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:border-primary/50 text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:border-primary/50 text-white appearance-none"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0f172a] text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:border-primary/50 text-white [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 mb-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Description</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  name="description"
                  rows="2"
                  placeholder="What was this for?"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:border-primary/50 text-white placeholder:text-gray-600 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Transaction'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
