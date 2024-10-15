import React, { useEffect, useState } from 'react';
import { getBookings, createBooking, getUserBookings, deleteBooking, getGymBookings, getGyms } from '../services/bookingService';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import '../css/BookingPage.css'; // Custom CSS file for extra styles

const BookingPage = () => {
  const [bookings, setBookings] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [gymBookings, setGymBookings] = useState([]);
  const [gymIdSearch, setGymIdSearch] = useState('');
  const [newBooking, setNewBooking] = useState({ slot: '', gymId: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const [gyms, setGyms] = useState([]); // Store gyms in state

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
    fetchBookings();
    fetchGyms(); // Fetch gyms on component load
  }, []);

  const fetchGyms = async () => {
    setLoading(true);
    try {
      const response = await getGyms();
      setGyms(response); // Assuming response contains an array of gyms
    } catch (error) {
      console.error('Failed to fetch gyms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const allBookings = await getBookings();
      setBookings(allBookings || []);
      const userBookings = await getUserBookings();
      setUserBookings(userBookings || []);
      setMessage('');
    } catch (error) {
      setMessage('Failed to fetch bookings.');
    } finally {
      setLoading(false); // Stop the loading state
    }
  };

  const handleDeleteBooking = async (id) => {
    setLoading(true);
    try {
      await deleteBooking(id);
      await fetchBookings(); // Refresh the bookings list after deletion
      setMessage('Booking deleted successfully!');
    } catch (error) {
      if (error.response.status === 403) {
        setMessage('Failed: You are not authorized to delete this booking.');
      } else {
        setMessage('Failed to delete booking.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBooking({ ...newBooking, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBooking(newBooking);
      await fetchBookings(); // Refresh the bookings list after submission
      setMessage('Booking created successfully!');
      setNewBooking({ slot: '', gymId: '' }); // Reset the form
    } catch (error) {
      setMessage('Failed to create booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleGymBookingSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const gymBookings = await getGymBookings(gymIdSearch);
      setGymBookings(gymBookings || []);
      setMessage('');
    } catch (error) {
      setMessage('Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="booking-page">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">Gym Booking</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-gradient">Logout</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Alerts */}
      {message && <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'} shadow-sm`}>{message}</div>}

      {/* Loading Spinner */}
      {loading && (
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* All Bookings */}
      <div className="card mb-4 shadow-lg rounded">
        <div className="card-header bg-gradient-primary text-white">All Gym Bookings</div>
        <div className="card-body">
          <ul className="list-group">
            {bookings.length === 0 && !loading && <li className="list-group-item">No bookings found.</li>}
            {bookings.map((booking) => (
              <li key={booking.id} className="list-group-item d-flex justify-content-between align-items-center">
                {booking.user} - {booking.slot} - {booking.gymId}
                <button onClick={() => handleDeleteBooking(booking.id)} className="btn btn-danger btn-sm">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Create a New Booking */}
      <div className="card mb-4 shadow-lg rounded">
        <div className="card-header bg-gradient-primary text-white">Create a New Booking</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="slot" className="form-label">Time Slot</label>
              <select
                name="slot"
                className="form-control"
                value={newBooking.slot}
                onChange={handleChange}
                required
              >
                <option value="">Select Time Slot</option>
                {timeslots.map((slot, index) => (
                  <option key={index} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="gymId" className="form-label">Select Gym</label>
              <select
                name="gymId"
                className="form-control"
                value={newBooking.gymId}
                onChange={handleChange}
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
            <button type="submit" className="btn btn-gradient w-100" disabled={loading}>
              Create Booking
            </button>
          </form>
        </div>
      </div>

      {/* User's Bookings */}
      <div className="card mb-4 shadow-lg rounded">
        <div className="card-header bg-gradient-primary text-white">Your Bookings</div>
        <div className="card-body">
          <ul className="list-group">
            {userBookings.length === 0 && !loading && <li className="list-group-item">No bookings found.</li>}
            {userBookings.map((booking) => (
              <li key={booking.id} className="list-group-item">
                {booking.user} - {booking.slot} - {booking.gymId}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Search Bookings by Gym ID */}
      <div className="card mb-4 shadow-lg rounded">
        <div className="card-header bg-gradient-primary text-white">Search Bookings by Gym ID</div>
        <div className="card-body">
          <form onSubmit={handleGymBookingSearch}>
            <div className="mb-3">
              <label htmlFor="gymIdSearch" className="form-label">Gym</label>
              <select
                name="gymIdSearch"
                className="form-control"
                value={gymIdSearch}
                onChange={(e) => setGymIdSearch(e.target.value)}
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
            <button type="submit" className="btn btn-gradient w-100" disabled={loading}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Gym Bookings */}
      <div className="card mb-4 shadow-lg rounded">
        <div className="card-header bg-gradient-primary text-white">Gym Bookings</div>
        <div className="card-body">
          <ul className="list-group">
            {gymBookings.length === 0 && !loading && <li className="list-group-item">No bookings found.</li>}
            {gymBookings.map((booking) => (
              <li key={booking.id} className="list-group-item">
                {booking.user} - {booking.slot} - {booking.gymId}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
