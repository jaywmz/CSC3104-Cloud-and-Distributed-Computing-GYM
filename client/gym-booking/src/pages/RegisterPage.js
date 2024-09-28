import React, { useState } from 'react';
import { registerUser } from '../services/userService';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap

const RegisterPage = () => {
  const [userData, setUserData] = useState({ username: '', password: '', role: 'user' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when registration starts
    try {
      await registerUser(userData);
      setMessage('User registered successfully!');
      setLoading(false); // Stop loading after registration is successful
      setTimeout(() => {
        navigate('/login'); // Redirect to login after 2 seconds
      }, 2000); // Delay for the loader to show success message
    } catch (error) {
      setMessage('Registration failed.');
      setLoading(false); // Stop loading on error
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="col-md-4">
        <div className="card shadow-lg p-3 mb-5 bg-body rounded">
          <div className="card-body">
            <h2 className="card-title text-center mb-4">Register</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Username"
                  value={userData.username}
                  onChange={handleChange}
                  className="form-control"
                  disabled={loading} // Disable fields while loading
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  value={userData.password}
                  onChange={handleChange}
                  className="form-control"
                  disabled={loading} // Disable fields while loading
                />
              </div>
              <div className="mb-3">
                <label htmlFor="role" className="form-label">Role</label>
                <select
                  name="role"
                  id="role"
                  value={userData.role}
                  onChange={handleChange}
                  className="form-select"
                  disabled={loading} // Disable fields while loading
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Registering...' : 'Register'} {/* Show loader text */}
              </button>
            </form>
            {message && <p className="text-success text-center mt-3">{message}</p>} {/* Success message */}
            <div className="text-center mt-3">
              <Link to="/login" className="link-primary" style={{ textDecoration: 'underline' }}>
                Already have an account? Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
