import React, { useState } from 'react';
import { loginUser } from '../services/userService';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Disable form and button when submitting
    try {
      const response = await loginUser(credentials);

      localStorage.setItem('token', response.token);
      setMessage('Login successful!');

      const decodedToken = JSON.parse(atob(response.token.split('.')[1])); // Decode JWT token
      if (decodedToken.role === 'admin') {
        navigate('/occupancy-page');
      } else {
        navigate('/bookings');
      }
    } catch (error) {
      setMessage('Login failed. Please check your credentials.');
    } finally {
      setLoading(false); // Re-enable the form and button
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="col-md-4">
        <div className="card shadow-lg p-3 mb-5 bg-body rounded">
          <div className="card-body">
            <h2 className="card-title text-center mb-4">Login</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="form-control"
                  disabled={loading} // Disable input while loading
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="form-control"
                  disabled={loading} // Disable input while loading
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'} {/* Change button text when loading */}
              </button>
            </form>
            {message && <p className="text-danger text-center mt-3">{message}</p>}
            <div className="text-center mt-3">
              <Link to="/register" className="link-primary">Don't have an account? Register here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
