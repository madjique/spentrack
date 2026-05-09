import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ListView } from './pages/ListView';
import { AddPage } from './pages/AddPage';
import { SettingsPage } from './pages/SettingsPage';
import { seedDefaultData } from './db/database';

export default function App() {
  useEffect(() => {
    seedDefaultData();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/list" element={<ListView />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
