import React, { useEffect, useState } from 'react';
import { getBookings, createBooking } from '../services/bookingService';

const BookingPage = () => {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({ user: '', slot: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const data = await getBookings();
    setBookings(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBooking({ ...newBooking, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBooking(newBooking);
      setMessage('Booking created successfully!');
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      setMessage('Failed to create booking.');
    }
  };

  return (
    <div>
      <h2>Gym Bookings</h2>
      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            {booking.user} - {booking.slot}
          </li>
        ))}
      </ul>

      <h3>Create a New Booking</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="user"
          placeholder="User"
          value={newBooking.user}
          onChange={handleChange}
        />
        <input
          type="text"
          name="slot"
          placeholder="Time Slot"
          value={newBooking.slot}
          onChange={handleChange}
        />
        <button type="submit">Create Booking</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default BookingPage;
