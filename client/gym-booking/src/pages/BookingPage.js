import React, { useEffect, useState } from 'react';
import { createBooking, getUserBookings, getGyms, updateBooking, deleteBooking } from '../services/bookingService';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import '../css/BookingPage.css'; // Custom CSS file for extra styles
import { jwtDecode } from 'jwt-decode';

const BookingPage = () => {
  const [userBookings, setUserBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({ date: '', slot: '', gymId: '' });
  const [editingBooking, setEditingBooking] = useState(null); // For edit mode
  const [gyms, setGyms] = useState([]); // Store gyms in state
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const [username, setUsername] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({});
  const [role, setRole] = useState('');
  const [dateOptions, setDateOptions] = useState([]);

  // Define available timeslots
  const timeslots = [
    '06:00 AM - 08:00 AM',
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM',
    '08:00 PM - 10:00 PM',
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode the token to get the username
      const decodedToken = jwtDecode(token);
      setUsername(decodedToken.username); // Set the username from the token
      setRole(decodedToken.role);

      fetchUserBookings();
      fetchGyms();
      generateDateOptions();
    }
  }, []);

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push(date.toISOString().split('T')[0]);
    }
    setDateOptions(options);
  };

  const fetchGyms = async () => {
    setLoading(true);
    try {
      const response = await getGyms();
      setGyms(response || []);
    } catch (error) {
      console.error('Failed to fetch gyms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const userBookings = await getUserBookings();
      setUserBookings(userBookings || []);
      setMessage('');
    } catch (error) {
      setMessage('Failed to fetch your bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (id) => {
    setLoading(true);
    try {
      setNewBooking({ date: '', slot: '', gymId: '' }); // Reset the form
      setEditingBooking(null); // Exit edit mode
      await deleteBooking(id);
      await fetchUserBookings(); // Refresh the bookings list after deletion
      setMessage('Booking deleted successfully!');
    } catch (error) {
      setMessage('Failed to delete booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setNewBooking({ date: booking.date, slot: booking.slot, gymId: booking.gymId });
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBooking(editingBooking.id, newBooking);
      setEditingBooking(null); // Exit edit mode
      await fetchUserBookings(); // Refresh bookings after update
      setNewBooking({ date: '', slot: '', gymId: '' }); // Reset the form
      setMessage('Booking updated successfully!');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    const gymName = gyms.find((g) => g.gymID === parseInt(newBooking.gymId, 10)).gymName;
    const details = { date: newBooking.date, gymName: gymName, time: newBooking.slot };
    openModal(details);
  };


  const getGymNameById = (gymId) => {
    const gym = gyms.find((g) => g.gymID === gymId);
    return gym ? gym.gymName : 'Unknown Gym';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const ConfirmModal = ({ isOpen, details, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
      <>
        <div className="modal-backdrop"></div>
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Booking</h5>
                <button type="button" className="btn-close" onClick={onClose}></button>
              </div>
              <div className="modal-body">
                <p>Date: {details.date}</p>
                <p>Gym: {details.gymName}</p>
                <p>Time: {details.time}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={onConfirm}>Confirm Booking</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const openModal = (details) => {
    setBookingDetails(details);
    setIsConfirmModalOpen(true);
  };

  const confirmBooking = async () => {
    try {
      setLoading(true);
      await createBooking(newBooking);
      await fetchUserBookings(); // Refresh the bookings list after submission
      setNewBooking({ date: '', slot: '', gymId: '' }); // Reset the form
      setMessage('Booking created successfully!');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
    setNewBooking({ date: '', slot: '', gymId: '' });
  }

  return (
    <div className="booking-page container mt-3">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3 shadow-sm p-2">
        <div className="container-fluid">
          <a className="navbar-brand" href="/user">GymKube</a>
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><a className="nav-link" href="/bookings">Bookings</a></li>
            <li className="nav-item"><a className="nav-link" href="/occupancy">Gyms</a></li>
            {role === 'admin' && (
              <li className="nav-item"><a className="nav-link" href="/admin">Admin Dashboard</a></li>
            )}
          </ul>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                {/* Display the username here */}
                <span className="navbar-text me-3">Logged in as: <strong>{username}</strong></span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-gradient btn-sm">Logout</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Alerts */}
      {message && (
        <div className={`alert ${/Failed|Duplicate/i.test(message) ? 'alert-danger' : 'alert-success'} shadow-sm`}>
          {message}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Create or Update Booking */}
      <div className="card mb-3 shadow-sm rounded">
        <div className="card-header bg-gradient-primary text-white p-2">
          {editingBooking ? 'Edit Booking' : 'Create a New Booking'}
        </div>
        <div className="card-body p-2">
          <form onSubmit={editingBooking ? handleUpdateBooking : handleCreateBooking}>
            <div className="mb-2">
              <label htmlFor="date" className="form-label small">Date</label>
              <select
                name="date"
                className="form-control form-control-sm"
                value={newBooking.date}
                onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                required
              >
                <option value="">Select a date</option>
                {dateOptions.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
              <label htmlFor="slot" className="form-label small">Time Slot</label>
              <select
                name="slot"
                className="form-control form-control-sm"
                value={newBooking.slot}
                onChange={(e) => setNewBooking({ ...newBooking, slot: e.target.value })}
                required
              >
                <option value="">Select Time Slot</option>
                {timeslots.map((slot, index) => (
                  <option key={index} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label htmlFor="gymId" className="form-label small">Select Gym</label>
              <select
                name="gymId"
                className="form-control form-control-sm"
                value={newBooking.gymId}
                onChange={(e) => setNewBooking({ ...newBooking, gymId: e.target.value })}
                required
              >
                <option value="">Select Gym</option>
                {gyms.map((gym) => (
                  <option key={gym.gymID} value={gym.gymID}>
                    {gym.gymName}
                  </option>
                ))}
              </select>
            </div>
            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-gradient btn-sm w-100 me-2" disabled={loading}>
                {editingBooking ? 'Update Booking' : 'Create Booking'}
              </button>
              {editingBooking && (
                <button type="button" className="btn btn-secondary btn-sm w-100" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        details={bookingDetails}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmBooking}
      />


      {/* User's Bookings */}
      <div className="card mb-3 shadow-sm rounded">
        <div className="card-header bg-gradient-primary text-white p-2">Your Bookings</div>
        <div className="card-body p-2">
          <ul className="list-group list-group-flush">
            {userBookings.length === 0 && !loading && <li className="list-group-item small">No bookings found.</li>}
            {userBookings.map((booking) => (
              <li key={booking.id} className="list-group-item small p-2 d-flex justify-content-between align-items-center">
                <div>
                  <strong>Date: </strong> {booking.date} <br />
                  <strong>Time Slot:</strong> {booking.slot} <br />
                  <strong>Gym:</strong> {getGymNameById(booking.gymId)}
                </div>
                <div>
                  <button className="btn btn-warning btn-sm me-1" onClick={() => handleEditBooking(booking)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBooking(booking.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
