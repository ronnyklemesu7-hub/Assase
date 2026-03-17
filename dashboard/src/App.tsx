import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import type { ViewType } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EnvironmentalView from './components/EnvironmentalView';
import WaterView from './components/WaterView';
import EnergyView from './components/EnergyView';
import ControlCenter from './components/ControlCenter';
import Login from './components/Login';
import AsaaseView from './components/asaase/AsaaseView';

import { NotificationProvider } from './components/NotificationSystem';
import { ThemeProvider } from './components/ThemeContext';

// Main Application Hub
function App() {
  const [currentView, setCurrentView] = useState<ViewType>('overview');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] flex items-center justify-center text-emerald-500 font-bold tracking-widest uppercase">Initializing...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'overview': return <Dashboard />;
      case 'environmental': return <EnvironmentalView />;
      case 'water': return <WaterView />;
      case 'energy': return <EnergyView />;
      case 'control': return <ControlCenter />;
      case 'asaase': return <AsaaseView />;
      default: return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <div className="flex bg-slate-50 dark:bg-[#0d1117] min-h-screen text-slate-900 dark:text-slate-200 selection:bg-emerald-500/30 transition-colors duration-300">
          <Sidebar 
            currentView={currentView} 
            onViewChange={setCurrentView} 
            onLogout={handleLogout}
          />
          <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
            {renderContent()}
          </main>
        </div>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
