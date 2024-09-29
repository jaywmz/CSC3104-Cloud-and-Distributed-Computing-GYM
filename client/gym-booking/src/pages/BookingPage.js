import React, { useEffect, useState } from 'react';
import { getBookings, createBooking, getUserBookings, deleteBooking, getGymBookings } from '../services/bookingService';

const BookingPage = () => {
  const [bookings, setBookings] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [gymBookings, setGymBookings] = useState([]);
  const [gymIdSearch, setGymIdSearch] = useState('');
  const [newBooking, setNewBooking] = useState({ user: '', slot: '', gymId: '' });
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
      setMessage('Failed to delete booking.');
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
      setNewBooking({ user: '', slot: '', gymId: '' }); // Reset the form
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
      <h2>All Gym Bookings</h2>
      <h5>Format: user - slot - gymId</h5>

      {/* Logout Button */}
      <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>

      {/* Loading Indicator */}
      {loading && <p>Loading...</p>}

      {/* Display bookings */}
      <ul>
        {bookings.length === 0 && !loading && <p>No bookings found.</p>}
        {bookings.map((booking) => (
          <li key={booking.id}>
            {booking.user} - {booking.slot} - {booking.gymId}
            <button onClick={() => handleDeleteBooking(booking.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <h3>Create a New Booking</h3>

      {/* Booking form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="user"
          placeholder="User"
          value={newBooking.user}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="slot"
          placeholder="Time Slot"
          value={newBooking.slot}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="gymId"
          placeholder="Gym ID"
          value={newBooking.gymId}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>Create Booking</button>
      </form>

      {/* Display success/error message */}
      {message && <p>{message}</p>}

      <h3>Your Bookings</h3>
      <h5>(currenty only showing bookings by "fekux" user, for now)</h5>
        {/* Display bookings */}
      <ul>
        {userBookings.length === 0 && !loading && <p>No bookings found.</p>}
        {userBookings.map((booking) => (
          <li key={booking.id}>
            {booking.user} - {booking.slot} - {booking.gymId}
          </li>
        ))}
      </ul>

      <h3>Search bookings by Gym ID</h3>
      <form onSubmit={handleGymBookingSearch}>
        <input
          type="text"
          name="gymIdSearch"
          placeholder="Gym ID Search"
          value={gymIdSearch}
          onChange={(e) => setGymIdSearch(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>Search</button>
      </form>

      {/* Display bookings */}
      <ul>
        {gymBookings.length === 0 && !loading && <p>No bookings found.</p>}
        {gymBookings.map((booking) => (
          <li key={booking.id}>
            {booking.user} - {booking.slot} - {booking.gymId}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingPage;