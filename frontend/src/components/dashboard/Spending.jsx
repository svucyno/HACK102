import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, FileText, Loader2, Filter } from 'lucide-react';
import { getCategoryData } from '../../utils/categoryConfig';

export default function Spending({ data, currency, onDelete, deletingId, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Extract unique categories for the filter
  const categories = [...new Set(data.transactions.map(t => t.category))];

  // Filtering Logic
  const filteredTransactions = data.transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? tx.category === filterCategory : true;
    
    // Simple date filter (e.g. strict string match or partial match)
    // Here we'll do a simple match on the date string
    const txDateStr = new Date(tx.date).toLocaleDateString('en-IN');
    const matchesDate = filterDate 
      ? new Date(tx.date).toISOString().split('T')[0] === filterDate
      : true;

    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 overflow-hidden flex flex-col h-[700px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="font-semibold text-lg">All Transactions</h3>
        <button 
          onClick={onAdd}
          className="text-xs bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-3.5 h-3.5" /> Add New
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {filteredTransactions.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/10 rounded-xl">
            <FileText className="w-12 h-12 text-gray-500 mb-3" />
            <p className="text-gray-300 font-medium mb-1">No transactions yet. Upload a CSV to get started.</p>
            <p className="text-xs text-muted-foreground">Or add a new transaction manually to begin tracking.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-4 text-gray-400 whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4 font-medium">{tx.description}</td>
                  <td className="px-4 py-4">
                    <span className="bg-white/10 px-2 py-1 rounded-md text-xs flex items-center gap-1.5 w-max">
                      {getCategoryData(tx.category).icon} {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-white">
                    {currency}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => onDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 disabled:opacity-50 inline-flex"
                      title="Delete transaction"
                    >
                      {deletingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
