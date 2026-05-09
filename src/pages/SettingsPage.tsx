import { useSettings } from '../hooks/useSettings';
import { useCurrency } from '../hooks/useCurrency';
import { exportAllTransactionsCSV, importTransactionsCSV } from '../utils/csv.utils';
import type { Category } from '../db/model';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { motion } from 'framer-motion';

export function SettingsPage() {
  const {
    theme,
    periodType,
    setPeriodType,
    data,
    newCatName, setNewCatName,
    newCatColor, setNewCatColor,
    editingCat, setEditingCat,
    importStatus, setImportStatus,
    exporting, setExporting,
    addCategory, saveCategory, deleteCategory, updateTheme, clearAllData,
  } = useSettings();

  const settings = data?.settings;
  const currencies = settings?.currencies ?? [];
  const categories = data?.categories ?? [];

  const {
    newCurrCode, setNewCurrCode,
    newCurrSymbol, setNewCurrSymbol,
    newCurrRate, setNewCurrRate,
    addCurrency, deleteCurrency, setDefaultCurrency,
  } = useCurrency(settings, currencies);

  if (!data) return <div className="p-6 text-slate-500 dark:text-slate-400 font-medium">Loading settings...</div>;

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Importing...');
    const catMap = new Map(categories.map((c: Category) => [c.id, c.name]));
    const result = await importTransactionsCSV(file, catMap);
    setImportStatus(`Imported ${result.imported} transactions.${result.errors.length > 0 ? ` Errors: ${result.errors.join(', ')}` : ''}`);
    e.target.value = '';
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-full bg-transparent">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto"
      >
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <h2 className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">Appearance</h2>
            <div className="flex rounded-xl bg-black/5 dark:bg-white/5 p-1 border border-black/5 dark:border-white/10">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => updateTheme(t)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${theme === t
                      ? 'bg-white dark:bg-white/20 shadow-sm text-primary dark:text-white border border-white/50 dark:border-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <h2 className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">Default Period</h2>
            <div className="flex rounded-xl bg-black/5 dark:bg-white/5 p-1 border border-black/5 dark:border-white/10">
              {(['week', 'month', 'year'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodType(p)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${periodType === p
                      ? 'bg-white dark:bg-white/20 shadow-sm text-primary dark:text-white border border-white/50 dark:border-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <h2 className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">Currencies</h2>
            <div className="space-y-3 mb-6">
              {currencies.map(c => (
                <div key={c.code} className="flex items-center gap-3 py-3 border-b border-black/5 dark:border-white/5 last:border-0">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 dark:text-white text-base tracking-tight">{c.symbol} {c.code}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rate: {c.exchangeRateToUSD}</div>
                  </div>
                  {c.isDefault && <span className="text-xs font-bold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/90 px-2 py-1 rounded-md border border-primary/20 dark:border-primary/30">Default</span>}
                  {!c.isDefault && (
                    <button onClick={() => setDefaultCurrency(c.code)} className="text-xs font-semibold text-primary hover:text-primary/80 dark:hover:text-primary transition-colors">Set Default</button>
                  )}
                  <button onClick={() => deleteCurrency(c.code)} className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors ml-2">Remove</button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                placeholder="Code (EUR)"
                value={newCurrCode}
                onChange={e => setNewCurrCode(e.target.value)}
                className="px-3 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                placeholder="Symbol (€)"
                value={newCurrSymbol}
                onChange={e => setNewCurrSymbol(e.target.value)}
                className="px-3 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                placeholder="Rate (1.08)"
                value={newCurrRate}
                onChange={e => setNewCurrRate(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="px-3 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <GlassButton onClick={addCurrency} variant="primary" className="mt-4 w-full">
              Add Currency
            </GlassButton>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <h2 className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">Categories</h2>
            <div className="space-y-2 mb-6">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 py-3 border-b border-black/5 dark:border-white/5 last:border-0">
                  {editingCat?.id === cat.id ? (
                    <>
                      <input
                        type="color"
                        value={editingCat.color}
                        onChange={e => setEditingCat({ ...editingCat, color: e.target.value })}
                        className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                      />
                      <input
                        value={editingCat.name}
                        onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-black/10 dark:border-white/10 rounded-lg text-sm bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button onClick={() => saveCategory(editingCat)} className="text-xs font-bold text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-md">Save</button>
                      <button onClick={() => setEditingCat(null)} className="text-xs font-bold text-slate-500 px-2 py-1 bg-slate-500/10 rounded-md">Cancel</button>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-[15px] font-medium text-slate-800 dark:text-white">{cat.name}</span>
                      <button onClick={() => setEditingCat(cat)} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Edit</button>
                      {!cat.isDefault && (
                        <button onClick={() => deleteCategory(cat.id)} className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors ml-1">Delete</button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="color"
                value={newCatColor}
                onChange={e => setNewCatColor(e.target.value)}
                className="w-11 h-11 rounded-xl cursor-pointer border-2 border-white dark:border-slate-800 shadow-sm p-0.5 bg-white/50 dark:bg-black/20"
              />
              <input
                placeholder="Category name"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-sm bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <GlassButton onClick={addCategory} variant="secondary">Add</GlassButton>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <h2 className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">Data Management</h2>
            <div className="space-y-3">
              <GlassButton
                onClick={async () => { setExporting(true); await exportAllTransactionsCSV(); setExporting(false); }}
                disabled={exporting}
                variant="primary"
                className="w-full"
              >
                {exporting ? 'Exporting...' : 'Export to CSV'}
              </GlassButton>
              <label className="block w-full">
                <div className="w-full text-center border border-black/10 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5 text-slate-800 dark:text-white py-2.5 rounded-2xl text-base font-medium cursor-pointer transition-colors backdrop-blur-md">
                  Import from CSV
                </div>
                <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
              </label>
              <div className="pt-2">
                <GlassButton
                  onClick={clearAllData}
                  variant="danger"
                  className="w-full"
                >
                  Clear All Data
                </GlassButton>
              </div>
              {importStatus && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center mt-3">
                  {importStatus}
                </motion.p>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
