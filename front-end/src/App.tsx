import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ItemList } from './pages/ItemList';
import { AddItem } from './pages/AddItem';
import { ItemDetail } from './pages/ItemDetail';
import { OutfitList } from './pages/OutfitList';
import { OutfitBuilder } from './pages/OutfitBuilder';
import { Settings } from './pages/Settings';
import { useStore } from './store/useStore';

// Simple protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const authUser = useStore(state => state.authUser);
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Application Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ItemList />} />
          <Route path="favorites" element={<ItemList />} /> {/* Reusing ItemList for demo */}
          <Route path="add" element={<AddItem />} />
          <Route path="item/:id" element={<ItemDetail />} />
          <Route path="outfits" element={<OutfitList />} />
          <Route path="outfits/new" element={<OutfitBuilder />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
