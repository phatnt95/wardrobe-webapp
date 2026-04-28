import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ItemList } from './pages/ItemList';
import { HomeDashboard } from './pages/HomeDashboard';
import { AddItem } from './pages/AddItem';
import { ItemDetail } from './pages/ItemDetail';
import { OutfitList } from './pages/OutfitList';
import { OutfitDetail } from './pages/OutfitDetail';
import { OutfitBuilder } from './pages/OutfitBuilder';
import { Settings, LocationManager, AttributeManager } from './pages/Settings';
import { ProfilePage } from './pages/Profile';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { UserProfileDto } from './api/model';

import { authControllerGetMe  } from './api/endpoints/auth/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ─── Session Bootstrap ──────────────────────────────────────────────────────
// Checks localStorage for an existing token and validates it via GET /auth/me.
// Keeps the user logged in after F5 refresh.
const SessionBootstrap = ({ children }: { children: React.ReactNode }) => {
  const [checking, setChecking] = useState(true);
  const login = useStore((state) => state.login);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }
    // Token exists — validate it against the backend
    authControllerGetMe()
      .then((profile: UserProfileDto) => {
        login({
          id: profile._id,
          name: `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email,
          username: profile.email,
        });
      })
      .catch(() => {
        // Token invalid or expired — clear it
        localStorage.removeItem('token');
      })
      .finally(() => setChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show nothing while checking — prevents flash of login redirect
  if (checking) return null;

  return <>{children}</>;
};

// ─── SSO Callback Handler ───────────────────────────────────────────────────
// Handles /auth/callback?token=... redirect from Google/Facebook OAuth
const SSOCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useStore((state) => state.login);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      login({ id: decoded.sub, name: decoded.email, username: decoded.email });
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

// ─── Protected Route ────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const authUser = useStore((state) => state.authUser);
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" />
      <BrowserRouter>
        <SessionBootstrap>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<SSOCallback />} />

            {/* Protected Application Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <AppLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }>
              <Route index element={<HomeDashboard />} />
              <Route path="items" element={<ItemList />} />
              <Route path="favorites" element={<ItemList />} />
              <Route path="add" element={<AddItem />} />
              <Route path="item/:id" element={<ItemDetail />} />
              <Route path="outfits" element={<OutfitList />} />
              <Route path="outfits/new" element={<OutfitBuilder />} />
              <Route path="outfits/:id" element={<OutfitDetail />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<Settings />}>
                <Route path="locations" element={<LocationManager />} />
                <Route path="attributes" element={<AttributeManager />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
