import { useSettings } from '../hooks/useSettings';
import { useCurrency } from '../hooks/useCurrency';
import { exportAllTransactionsCSV, importTransactionsCSV } from '../utils/csv.utils';
import type { Category } from '../db/model';

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
    addCategory, saveCategory, deleteCategory, updateTheme,
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

  if (!data) return <div className="p-4">Loading...</div>;

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Importing...');
    const catMap = new Map(categories.map((c: Category) => [c.id, c.name]));
    const result = await importTransactionsCSV(file, catMap);
    setImportStatus(`Imported ${result.imported} transactions.${result.errors.length > 0 ? ` Errors: ${result.errors.join(', ')}` : ''}`);
    e.target.value = '';
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Appearance</h2>
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => updateTheme(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  theme === t ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Default Period</h2>
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            {(['week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodType(p)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  periodType === p ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Currencies</h2>
          <div className="space-y-2 mb-4">
            {currencies.map(c => (
              <div key={c.code} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex-1">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{c.symbol} {c.code}</span>
                  <span className="text-xs text-gray-400 ml-2">Rate: {c.exchangeRateToUSD}</span>
                  {c.isDefault && <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">Default</span>}
                </div>
                {!c.isDefault && (
                  <button onClick={() => setDefaultCurrency(c.code)} className="text-xs text-indigo-500 hover:text-indigo-600">Set Default</button>
                )}
                <button onClick={() => deleteCurrency(c.code)} className="text-xs text-red-400 hover:text-red-500">Remove</button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              placeholder="Code (EUR)"
              value={newCurrCode}
              onChange={e => setNewCurrCode(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <input
              placeholder="Symbol (€)"
              value={newCurrSymbol}
              onChange={e => setNewCurrSymbol(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <input
              placeholder="Rate (1.08)"
              value={newCurrRate}
              onChange={e => setNewCurrRate(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button onClick={addCurrency} className="mt-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium">
            Add Currency
          </button>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Categories</h2>
          <div className="space-y-1 mb-4">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-800">
                {editingCat?.id === cat.id ? (
                  <>
                    <input
                      type="color"
                      value={editingCat.color}
                      onChange={e => setEditingCat({ ...editingCat, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      value={editingCat.name}
                      onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <button onClick={() => saveCategory(editingCat)} className="text-xs text-green-500">Save</button>
                    <button onClick={() => setEditingCat(null)} className="text-xs text-gray-400">Cancel</button>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{cat.name}</span>
                    <button onClick={() => setEditingCat(cat)} className="text-xs text-indigo-500">Edit</button>
                    {!cat.isDefault && (
                      <button onClick={() => deleteCategory(cat.id)} className="text-xs text-red-400">Delete</button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="color"
              value={newCatColor}
              onChange={e => setNewCatColor(e.target.value)}
              className="w-10 h-9 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
            />
            <input
              placeholder="Category name"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button onClick={addCategory} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">Add</button>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Data</h2>
          <div className="space-y-2">
            <button
              onClick={async () => { setExporting(true); await exportAllTransactionsCSV(); setExporting(false); }}
              disabled={exporting}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <label className="block w-full">
              <span className="block w-full text-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium cursor-pointer">
                Import CSV
              </span>
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
            </label>
            {importStatus && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{importStatus}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
