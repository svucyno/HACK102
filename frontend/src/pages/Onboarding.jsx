import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle, Loader2, FileText, X, Sparkles } from 'lucide-react';
import { updateProfile, uploadCSV, loadSampleData } from '../services/api';
import Logo from '../components/Logo';

export default function Onboarding() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [uploadMessage, setUploadMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const totalSteps = 4;

  // Profile Form Data
  const [currency, setCurrency] = useState('USD');
  const [income, setIncome] = useState('');
  const [categories, setCategories] = useState(['Housing', 'Food', 'Transport']);
  const [availableCategories, setAvailableCategories] = useState([
    'Housing', 'Food', 'Transport', 'Utilities', 'Insurance', 'Medical', 'Saving Tools', 'Personal', 'Entertainment'
  ]);
  const [showInput, setShowInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [savingsPercentage, setSavingsPercentage] = useState(20);
  const [savingsDescription, setSavingsDescription] = useState('');

  const handleCategoryToggle = (cat) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCategory = () => {
    if (newCategory.trim() === '') return;
    const cat = newCategory.trim();
    
    // Check for duplicates in available pool
    if (!availableCategories.includes(cat)) {
      setAvailableCategories((prev) => [...prev, cat]);
    }
    
    // Automatically select the new custom category
    if (!categories.includes(cat)) {
      setCategories((prev) => [...prev, cat]);
    }
    
    setNewCategory('');
    setShowInput(false);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // ─── File Handlers ───────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error');
      setUploadMessage('Only .csv files are accepted. Please upload a valid CSV.');
      return;
    }
    setSelectedFile(file);
    setUploadStatus(null);
    setUploadMessage('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error');
      setUploadMessage('Only .csv files are accepted.');
      return;
    }
    setSelectedFile(file);
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('error');
      setUploadMessage('Please select a CSV file first.');
      return;
    }
    setUploadLoading(true);
    setUploadStatus(null);
    try {
      const result = await uploadCSV(selectedFile);
      setUploadStatus('success');
      setUploadMessage(`✅ ${result.count} transactions imported successfully!`);
    } catch (err) {
      setUploadStatus('error');
      setUploadMessage(err.message || 'Upload failed. Check CSV format.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setSampleLoading(true);
    setUploadStatus(null);
    try {
      const result = await loadSampleData();
      setUploadStatus('success');
      setUploadMessage(`✅ ${result.count} sample transactions loaded!`);
    } catch (err) {
      setUploadStatus('error');
      setUploadMessage(err.message || 'Failed to load sample data.');
    } finally {
      setSampleLoading(false);
    }
  };

  // ─── Finish Setup ────────────────────────────────────────────────────────────

  const finish = async () => {
    setLoading(true);
    try {
      await updateProfile({
        income: Number(income) || 0,
        currency,
        categories,
        savingsGoal: {
          percentage: Number(savingsPercentage),
          description: savingsDescription,
        },
      });
      localStorage.setItem('onboardingComplete', 'true');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      localStorage.setItem('onboardingComplete', 'true');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 lg:p-24 relative overflow-hidden">
      <div className="absolute top-[0%] left-[30%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <Logo size="small" className="mb-0" />

      {/* Progress Bar Header */}
      <div className="w-full max-w-2xl mb-8 z-10">
        <h1 className="text-3xl font-bold mb-2 text-center text-gradient">Set up your profile</h1>
        <p className="text-center text-muted-foreground text-sm mb-6">Let's personalise your financial dashboard</p>
        <div className="flex gap-2 w-full">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden relative">
              {step >= s && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="absolute inset-0 bg-gradient-to-r from-primary to-secondary"
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-right text-xs text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
      </div>

      <div className="glass-panel w-full max-w-2xl relative overflow-hidden min-h-[420px] flex z-10">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full p-8 flex flex-col justify-between"
          >
            {/* ── Step 1: Income & Currency ── */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-semibold">Income & Currency</h2>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">Primary Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-primary/50 text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">Monthly Net Income</label>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g. 5000"
                    className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-primary/50 text-white placeholder:text-gray-600"
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Expense Categories ── */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-semibold">Expense Categories</h2>
                <p className="text-sm text-muted-foreground">Select your primary categories of spending</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={categories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="accent-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>

                {/* Add Custom Category UI */}
                <div className="mt-2">
                  <AnimatePresence mode="wait">
                    {!showInput ? (
                      <motion.button
                        key="btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowInput(true)}
                        className="w-full border border-dashed border-gray-500 text-gray-300 font-medium text-sm px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        + Add Custom Category
                      </motion.button>
                    ) : (
                      <motion.div
                        key="input"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          autoFocus
                          placeholder="Enter category name"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                          className="flex-1 bg-white/10 border border-white/10 px-4 py-3 text-sm rounded-lg outline-none focus:border-primary/50 text-white"
                        />
                        <button
                          onClick={handleAddCategory}
                          className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-3 rounded-lg text-sm transition-colors shadow-lg shadow-primary/20"
                        >
                          Add
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Step 3: Savings Goals ── */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">Savings Goals</h2>
                    <p className="text-sm text-muted-foreground mt-1">Our AI will track this target and advise you accordingly.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: 10, label: 'Conservative' },
                      { val: 20, label: 'Balanced' },
                      { val: 30, label: 'Growth' },
                      { val: 40, label: 'Aggressive' }
                    ].map(preset => (
                      <button
                        key={preset.val}
                        onClick={() => setSavingsPercentage(preset.val)}
                        className={`text-xs py-2 px-1 rounded-lg border transition-all ${
                          Number(savingsPercentage) === preset.val 
                            ? 'bg-primary/20 border-primary text-primary font-bold' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                        }`}
                      >
                        <div className="font-semibold text-white mb-0.5">{preset.val}%</div>
                        <div className="text-[10px] uppercase opacity-80">{preset.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Slider Section */}
                  <div className="flex flex-col gap-3 glass-panel p-4 mt-2">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-semibold text-gray-300">Target Monthly Savings</label>
                      <span className="text-2xl font-extrabold text-white">{savingsPercentage}%</span>
                    </div>

                    <div className="relative pt-4 pb-2">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={savingsPercentage}
                        onChange={(e) => setSavingsPercentage(e.target.value)}
                        className="w-full absolute top-3.5 z-10 opacity-0 cursor-pointer"
                      />
                      {/* Visual Bar Track */}
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div 
                          layout
                          initial={{ width: 0 }}
                          animate={{ width: `${((savingsPercentage - 5) / 45) * 100}%` }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className={`h-full rounded-full transition-colors duration-500 ${
                            savingsPercentage < 15 ? 'bg-red-500' : savingsPercentage <= 30 ? 'bg-blue-400' : 'bg-green-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Dynamic Real-time Output */}
                    <div className="flex flex-col items-center justify-center text-center mt-2 p-3 bg-[#0f172a] rounded-lg border border-white/5">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Estimated Savings</div>
                      <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        {currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                        {Number(income) > 0 ? ((Number(income) * savingsPercentage) / 100).toLocaleString() : '0.00'}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-2 px-2">
                        {savingsPercentage < 15 
                          ? 'Try increasing gradually for long-term security.' 
                          : savingsPercentage <= 30 
                          ? 'Great balance between lifestyle and financial growth!' 
                          : 'Aggressive saving plan! You will reach your goals quickly.'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">What are you saving for?</label>
                    <input
                      type="text"
                      value={savingsDescription}
                      onChange={(e) => setSavingsDescription(e.target.value)}
                      placeholder="e.g. Emergency Fund, New Car"
                      className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-primary/50 text-white placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: CSV Upload ── */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-semibold">Import Transactions</h2>
                  <p className="text-sm text-muted-foreground mt-1">Upload a CSV or load sample data to populate your dashboard</p>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer
                    ${dragOver ? 'border-primary/70 bg-primary/5' : 'border-white/20 bg-white/5 hover:border-primary/40 hover:bg-white/8'}`}
                >
                  {selectedFile ? (
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="text-left">
                        <p className="font-semibold text-white">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadStatus(null); }}
                        className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className={`w-10 h-10 ${dragOver ? 'text-primary' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-semibold">Drop your CSV here</p>
                        <p className="text-xs text-muted-foreground mt-1">or click to browse — <span className="font-mono">amount, category, description, date</span></p>
                      </div>
                    </>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

                {/* Status message */}
                {uploadStatus && (
                  <div className={`text-sm px-4 py-3 rounded-lg border ${uploadStatus === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {uploadMessage}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploadLoading || !selectedFile}
                    className="flex-1 py-2.5 px-4 bg-primary/80 hover:bg-primary rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  >
                    {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    Upload CSV
                  </button>
                  <button
                    onClick={handleLoadSample}
                    disabled={sampleLoading}
                    className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  >
                    {sampleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-secondary" />}
                    Load Sample Data
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span>You can also skip this step and add transactions manually from the dashboard.</span>
                </div>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex justify-between mt-10 border-t border-white/10 pt-6">
              <button
                onClick={prevStep}
                className={`py-2 px-4 rounded-lg flex items-center gap-2 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/10'}`}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                onClick={step === totalSteps ? finish : nextStep}
                disabled={loading}
                className="py-2 px-6 bg-primary hover:bg-primary/90 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>{step === totalSteps ? 'Finish Setup' : 'Continue'} <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
