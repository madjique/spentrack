import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { AddEditModal } from '../components/AddEditModal';
import { useNavigate } from 'react-router-dom';

export function AddPage() {
  const navigate = useNavigate();
  const data = useLiveQuery(async () => {
    const [settings, categories] = await Promise.all([
      db.settings.get('global'),
      db.categories.toArray(),
    ]);
    return { settings, categories };
  });

  if (!data) return null;

  const currencies = data.settings?.currencies ?? [];

  return (
    <AddEditModal
      onClose={() => navigate(-1)}
      categories={data.categories}
      currencies={currencies}
    />
  );
}
