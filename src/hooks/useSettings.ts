import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import type { Category } from '../db/model';
import { COLORS } from '../utils/theme';

export function useSettings() {
  const { theme, setTheme, periodType, setPeriodType } = useAppStore();

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLORS.primary);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const data = useLiveQuery(async () => {
    const [settings, categories] = await Promise.all([
      db.settings.get('global'),
      db.categories.toArray(),
    ]);
    return { settings, categories };
  });

  async function addCategory() {
    if (!newCatName) return;
    await db.categories.put({
      id: crypto.randomUUID(),
      name: newCatName,
      color: newCatColor,
      isDefault: false,
    });
    setNewCatName('');
    setNewCatColor(COLORS.primary);
  }

  async function saveCategory(cat: Category) {
    await db.categories.put(cat);
    setEditingCat(null);
  }

  async function deleteCategory(id: string) {
    await db.categories.delete(id);
  }

  async function updateTheme(t: 'light' | 'dark' | 'system') {
    setTheme(t);
    const settings = data?.settings;
    if (!settings) return;
    await db.settings.put({ ...settings, theme: t });
  }

  return {
    theme,
    periodType,
    setPeriodType,
    data,
    newCatName,
    setNewCatName,
    newCatColor,
    setNewCatColor,
    editingCat,
    setEditingCat,
    importStatus,
    setImportStatus,
    exporting,
    setExporting,
    addCategory,
    saveCategory,
    deleteCategory,
    updateTheme,
  };
}
