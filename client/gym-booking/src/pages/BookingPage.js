import React, { useEffect, useState } from 'react';
import { getBookings, createBooking, getUserBookings, deleteBooking, getGymBookings } from '../services/bookingService';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap


const BookingPage = () => {
  const [bookings, setBookings] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [gymBookings, setGymBookings] = useState([]);
  const [gymIdSearch, setGymIdSearch] = useState('');
  const [newBooking, setNewBooking] = useState({slot: '', gymId: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    fetchBookings();
  }, []);

  // Function to fetch bookings from the API
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const allBookings = await getBookings();
      if(!allBookings) {
        setBookings([]);
      }else{
        setBookings(allBookings);
      }
      const userBookings = await getUserBookings();
      if(!userBookings) {
        setUserBookings([]);
      }else{
        setUserBookings(userBookings);
      }
      setMessage(''); // Clear any previous message
    } catch (error) {
      setMessage('Failed to fetch bookings.');
    } finally {
      setLoading(false); // Stop the loading state
    }
  };

  // Function to delete a booking through the API using the booking ID
  const handleDeleteBooking = async (id) => {
    setLoading(true);
    try {
      await deleteBooking(id);
      await fetchBookings(); // Refresh the bookings list after successful deletion
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

  // Handle input changes for the booking form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBooking({ ...newBooking, [name]: value });
  };

  // Handle form submission to create a new booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading when submitting
    try {
      await createBooking(newBooking);
      await fetchBookings(); // Refresh the bookings list after successful submission
      setMessage('Booking created successfully!');
      setNewBooking({ slot: '', gymId: '' }); // Reset the form
    } catch (error) {
      setMessage('Failed to create booking.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Handle form submission to search bookings by Gym ID
  const handleGymBookingSearch = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading when submitting
    try {
      const gymBookings = await getGymBookings(gymIdSearch);
      if(!gymBookings) {
        setGymBookings([]);
      }else{
        setGymBookings(gymBookings);
      }
      setMessage(''); // Clear any previous message
    } catch (error) {
      setMessage('Failed to fetch bookings.');
    } finally {
      setLoading(false); // Stop loading
    }
}

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from localStorage
    window.location.href = '/login';  // Redirect to the login page
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">Gym Booking</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {/* <li className="nav-item">
                <a className="nav-link" href="/login">Login</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/register">Register</a>
              </li> */}
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-danger">Logout</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>


      <div className="container mt-4 mb-4">
        {/* Display success/error message */}
        {message && <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}      
        <h2>All Gym Bookings</h2>
        <h5>Format: user - slot - gymId</h5>

        {/* Loading Indicator */}
        {loading && <div className="alert alert-info">Loading...</div>}

        {/* Display bookings */}
        <ul className="list-group mb-4">
          {bookings.length === 0 && !loading && <li className="list-group-item">No bookings found.</li>}
          {bookings.map((booking) => (
            <li key={booking.id} className="list-group-item d-flex justify-content-between align-items-center">
              {booking.user} - {booking.slot} - {booking.gymId}
              <button onClick={() => handleDeleteBooking(booking.id)} className="btn btn-danger btn-sm">Delete</button>
            </li>
          ))}
        </ul>

        <h3>Create a New Booking</h3>

        {/* Booking form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <input
              type="text"
              name="slot"
              className="form-control"
              placeholder="Time Slot"
              value={newBooking.slot}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              name="gymId"
              className="form-control"
              placeholder="Gym ID"
              value={newBooking.gymId}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>Create Booking</button>
        </form>

        <h3>Your Bookings</h3>
        {/* Display user bookings */}
        <ul className="list-group mb-4">
          {userBookings.length === 0 && !loading && <li className="list-group-item">No bookings found.</li>}
          {userBookings.map((booking) => (
            <li key={booking.id} className="list-group-item">
              {booking.user} - {booking.slot} - {booking.gymId}
            </li>
          ))}
        </ul>

        <h3>Search bookings by Gym ID</h3>
        <form onSubmit={handleGymBookingSearch} className="mb-4">
          <div className="mb-3">
            <input
              type="text"
              name="gymIdSearch"
              className="form-control"
              placeholder="Gym ID Search"
              value={gymIdSearch}
              onChange={(e) => setGymIdSearch(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>Search</button>
        </form>

        {/* Display gym bookings */}
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
  );
};

export default BookingPage;