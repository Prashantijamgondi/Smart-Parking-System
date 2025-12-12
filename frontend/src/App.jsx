import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ParkingProvider } from './context/ParkingContext';
import Dashboard from './pages/Dashboard';
import Slots from './pages/Slots';
import History from './pages/History';
import './App.css';

function App() {
  return (
    <ParkingProvider>
      <Router>
        <div className="app">
          <nav className="navbar">
            <div className="nav-brand">
              <h2>🚗 Smart Parking</h2>
            </div>
            <ul className="nav-links">
              <li>
                <Link to="/">Dashboard</Link>
              </li>
              <li>
                <Link to="/slots">Slots</Link>
              </li>
              <li>
                <Link to="/history">History</Link>
              </li>
            </ul>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/slots" element={<Slots />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ParkingProvider>
  );
}

export default App;
