
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { UserRole } from './types';

// Pages
import { VeiculosPage } from './pages/VeiculosPage';
import { VeiculoDetalhePage } from './pages/VeiculoDetalhePage';
import { VeiculoNovoPage } from './pages/VeiculoNovoPage';
import { VeiculoEditarPage } from './pages/VeiculoEditarPage';
import { OficinaPage } from './pages/OficinaPage';
import { OficinaNovePage } from './pages/OficinaNovePage';
import { OficinaDetalhePage } from './pages/OficinaDetalhePage';
import { ClientesPage } from './pages/ClientesPage';
import { ClienteDetalhePage } from './pages/ClienteDetalhePage';
import { ClienteNovoPage } from './pages/ClienteNovoPage';
import { ClienteEditarPage } from './pages/ClienteEditarPage';
import { WhatsAppPage } from './pages/WhatsAppPage';
import { AlugueisPage } from './pages/AlugueisPage';
import { AluguelNovoPage } from './pages/AluguelNovoPage';

const AppRoutes: React.FC = () => {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.MECHANIC) {
        navigate('/oficina');
      } else if (user.role === UserRole.BILLING) {
        navigate('/clientes');
      } else {
        navigate('/');
      }
    }
  }, [user]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Layout user={user} onLogout={() => setUser(null)}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/veiculos" element={<VeiculosPage />} />
        <Route path="/veiculo/novo_veiculo" element={<VeiculoNovoPage />} />
        <Route path="/veiculo/editar/:id" element={<VeiculoEditarPage />} />
        <Route path="/veiculo/:id" element={<VeiculoDetalhePage />} />
        <Route path="/oficina" element={<OficinaPage />} />
        <Route path="/oficina/novo_entrada" element={<OficinaNovePage />} />
        <Route path="/oficina/:id" element={<OficinaDetalhePage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/cliente/novo" element={<ClienteNovoPage />} />
        <Route path="/cliente/editar/:id" element={<ClienteEditarPage />} />
        <Route path="/cliente/:id" element={<ClienteDetalhePage />} />
        <Route path="/alugueis" element={<AlugueisPage />} />
        <Route path="/aluguel/novo/:vehicleId" element={<AluguelNovoPage />} />
        <Route path="/automacao/whatsapp" element={<WhatsAppPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
};

export default App;
