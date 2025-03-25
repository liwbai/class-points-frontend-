import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ClassDetail from './pages/ClassDetail';
import StudentDetail from './pages/StudentDetail';
import PointItems from './pages/PointItems';
import Rewards from './pages/Rewards';
import Statistics from './pages/Statistics';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ff8c00',
          borderRadius: 8,
          fontFamily: "'Comic Sans MS', cursive, sans-serif",
        },
        components: {
          Button: {
            colorPrimary: '#ff8c00',
            colorPrimaryHover: '#ff9a2e',
          },
        },
      }}
    >
      <Router>
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/class/:id"
                element={
                  <ProtectedRoute>
                    <ClassDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/:id"
                element={
                  <ProtectedRoute>
                    <StudentDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/class/:id/point-items"
                element={
                  <ProtectedRoute>
                    <PointItems />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/class/:id/rewards"
                element={
                  <ProtectedRoute>
                    <Rewards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/class/:id/statistics"
                element={
                  <ProtectedRoute>
                    <Statistics />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ConfigProvider>
  );
};

export default App;
