import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Home from './components/Home/Home';
import './styles.css';

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      navigate('/home');
    }
  }, [navigate]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e2e] text-white">
        <Routes>
          <Route
            path="/"
            element={<Login />}  // Ya no pasa la propiedad onFingerprint
          />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </>
  );
};

export default App;
