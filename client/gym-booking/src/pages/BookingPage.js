import React, { useEffect, useState } from 'react';
import { createBooking, getUserBookings, getGyms, updateBooking, deleteBooking } from '../services/bookingService';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import '../css/BookingPage.css'; // Custom CSS file for extra styles

const BookingPage = () => {
  const [userBookings, setUserBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({ slot: '', gymId: '' });
  const [editingBooking, setEditingBooking] = useState(null); // For edit mode
  const [gyms, setGyms] = useState([]); // Store gyms in state
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Loading state

  // Define available timeslots
  const timeslots = [
    '06:00 AM - 07:00 AM',
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM',
    '07:00 PM - 08:00 PM',
    '08:00 PM - 09:00 PM',
  ];

  useEffect(() => {
    fetchUserBookings();
    fetchGyms();
  }, []);

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
    setNewBooking({ slot: booking.slot, gymId: booking.gymId });
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBooking(editingBooking.id, newBooking);
      setMessage('Booking updated successfully!');
      setEditingBooking(null); // Exit edit mode
      await fetchUserBookings(); // Refresh bookings after update
      setNewBooking({ slot: '', gymId: '' }); // Reset the form
    } catch (error) {
      setMessage('Failed to update booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBooking(newBooking);
      await fetchUserBookings(); // Refresh the bookings list after submission
      setMessage('Booking created successfully!');
      setNewBooking({ slot: '', gymId: '' }); // Reset the form
    } catch (error) {
      setMessage('Failed to create booking.');
    } finally {
      setLoading(false);
    }
  };

  const getGymNameById = (gymId) => {
    const gym = gyms.find((g) => g.gymID === gymId);
    return gym ? gym.gymName : 'Unknown Gym';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="booking-page container mt-3">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3 shadow-sm p-2">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">Gym Booking</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
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
          <form onSubmit={editingBooking ? handleUpdateBooking : handleSubmit}>
            <div className="mb-2">
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
            <button type="submit" className="btn btn-gradient btn-sm w-100" disabled={loading}>
              {editingBooking ? 'Update Booking' : 'Create Booking'}
            </button>
          </form>
        </div>
      </div>

      {/* User's Bookings */}
      <div className="card mb-3 shadow-sm rounded">
        <div className="card-header bg-gradient-primary text-white p-2">Your Bookings</div>
        <div className="card-body p-2">
          <ul className="list-group list-group-flush">
            {userBookings.length === 0 && !loading && <li className="list-group-item small">No bookings found.</li>}
            {userBookings.map((booking) => (
              <li key={booking.id} className="list-group-item small p-2 d-flex justify-content-between align-items-center">
                <div>
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
