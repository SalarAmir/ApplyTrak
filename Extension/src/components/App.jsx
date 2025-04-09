import React, { useState, useEffect } from 'react';
import '../styles.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/check-auth');
      const result = await response.json();
      setIsAuthenticated(result.authenticated);
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const handleConnectGmail = () => {
    window.open('http://localhost:3000/auth/google', '_blank');
  };

  return (
    <div className="app">
      <h2>Internship Email Tracker</h2>
      <button 
        onClick={handleConnectGmail} 
        disabled={isAuthenticated}
      >
        {isAuthenticated ? 'Gmail Connected' : 'Connect Gmail'}
      </button>
      <h3>Status</h3>
      <p>{isAuthenticated ? 'Gmail connected. Tracking emails...' : 'Please connect your Gmail account.'}</p>
    </div>
  );
};

export default App;