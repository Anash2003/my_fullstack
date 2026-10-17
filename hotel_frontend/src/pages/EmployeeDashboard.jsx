/**
 * EmployeeDashboard - employee can view rooms, manage bookings, check-in/out, register walk-in customers.
 */
import { useState, useEffect } from 'react';
import api from '../api';

function EmployeeDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Walk-in registration form
  const [walkinForm, setWalkinForm] = useState({ username: '', password: '', email: '', first_name: '', last_name: '', phone: '' });

  // Booking form
  const [bookingForm, setBookingForm] = useState({ customer: '', room: '', check_in_date: '', check_out_date: '' });
  const [availableRooms, setAvailableRooms] = useState([]);

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (activeTab === 'rooms') loadRooms();
    if (activeTab === 'bookings') loadBookings();
    if (activeTab === 'create-booking') { loadCustomers(); loadCategories(); }
    if (activeTab === 'feedback') { loadFeedbacks(); loadComplaints(); }
  }, [activeTab]);

  const loadDashboard = async () => {
    try { const res = await api.get('employee/dashboard/'); setStats(res.data); } catch (err) { setError('Failed to load dashboard.'); }
  };

  const loadRooms = async () => {
    try { const res = await api.get('rooms/'); setRooms(res.data); } catch (err) { setError('Failed to load rooms.'); }
  };

  const loadBookings = async () => {
    try {
      let url = 'bookings/';
      if (searchQuery) url += '?search=' + searchQuery;
      const res = await api.get(url);
      setBookings(res.data);
    } catch (err) { setError('Failed to load bookings.'); }
  };

  const loadCustomers = async () => {
    try { const res = await api.get('customers/'); setCustomers(res.data); } catch (err) { /* ignore */ }
  };

  const loadCategories = async () => {
    try { const res = await api.get('categories/'); setCategories(res.data); } catch (err) { /* ignore */ }
  };

  const loadFeedbacks = async () => {
    try { const res = await api.get('feedback/'); setFeedbacks(res.data); } catch (err) { /* ignore */ }
  };

  const loadComplaints = async () => {
    try { const res = await api.get('complaints/'); setComplaints(res.data); } catch (err) { /* ignore */ }
  };

  const clearMessages = () => { setError(''); setSuccess(''); };

  // Check available rooms for booking dates
  const checkAvailability = async () => {
    if (!bookingForm.check_in_date || !bookingForm.check_out_date) return;
    try {
      const res = await api.get(`rooms/available/?check_in=${bookingForm.check_in_date}&check_out=${bookingForm.check_out_date}`);
      setAvailableRooms(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to check availability.'); }
  };

  // Walk-in registration
  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const res = await api.post('customer/register-walkin/', walkinForm);
      setSuccess('Customer registered: ' + res.data.customer.username);
      setWalkinForm({ username: '', password: '', email: '', first_name: '', last_name: '', phone: '' });
      loadCustomers();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Registration failed.');
    }
  };

  // Create booking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.post('bookings/', bookingForm);
      setSuccess('Booking created successfully!');
      setBookingForm({ customer: '', room: '', check_in_date: '', check_out_date: '' });
      setAvailableRooms([]);
      loadDashboard();
    } catch (err) { setError(err.response?.data?.error || 'Booking failed.'); }
  };

  // Booking status update (check-in, check-out, cancel)
  const handleBookingAction = async (id, newStatus) => {
    clearMessages();
    try {
      await api.put(`bookings/${id}/`, { status: newStatus });
      setSuccess('Booking updated.');
      loadBookings();
      loadDashboard();
    } catch (err) { setError(err.response?.data?.error || 'Failed.'); }
  };

  // Complaint update
  const handleComplaintUpdate = async (id, newStatus, resolution) => {
    try {
      await api.put(`complaints/${id}/`, { status: newStatus, resolution: resolution || '' });
      loadComplaints();
    } catch (err) { setError('Failed to update complaint.'); }
  };

  return (
    <div className="container mt-4">
      <h2>Employee Dashboard</h2>

      {error && <div className="alert alert-danger alert-dismissible">{error} <button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success alert-dismissible">{success} <button type="button" className="btn-close" onClick={() => setSuccess('')}></button></div>}

      <ul className="nav nav-tabs mb-4">
        {['overview', 'rooms', 'bookings', 'create-booking', 'register-walkin', 'feedback'].map(tab => (
          <li className="nav-item" key={tab}>
            <button className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab); clearMessages(); }}>
              {tab === 'create-booking' ? 'Create Booking' : tab === 'register-walkin' ? 'Register Walk-in' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* Overview */}
      {activeTab === 'overview' && stats && (
        <div className="row">
          {[
            { label: 'Available Rooms', value: stats.available_rooms, color: 'success' },
            { label: 'Occupied Rooms', value: stats.occupied_rooms, color: 'warning' },
            { label: "Today's Check-ins", value: stats.todays_checkins, color: 'info' },
            { label: "Today's Check-outs", value: stats.todays_checkouts, color: 'primary' },
            { label: 'Pending Bookings', value: stats.pending_bookings, color: 'dark' },
          ].map((item, i) => (
            <div className="col-md-4 mb-3" key={i}>
              <div className={`card text-white bg-${item.color}`}>
                <div className="card-body text-center">
                  <h5>{item.label}</h5>
                  <h3>{item.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rooms */}
      {activeTab === 'rooms' && (
        <table className="table table-bordered table-striped">
          <thead className="table-dark"><tr><th>Room#</th><th>Category</th><th>Price</th><th>Status</th><th>Amenities</th></tr></thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td>{room.room_number}</td>
                <td>{room.category_name}</td>
                <td>${room.price_per_night}</td>
                <td><span className={`badge bg-${room.status === 'available' ? 'success' : room.status === 'occupied' ? 'warning' : 'secondary'}`}>{room.status}</span></td>
                <td>{room.amenities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Bookings */}
      {activeTab === 'bookings' && (
        <>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <input className="form-control" placeholder="Search bookings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <button className="btn btn-primary" onClick={loadBookings}>Search</button>
              </div>
            </div>
          </div>
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr><th>Booking ID</th><th>Customer</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td><small>{String(b.booking_id).substring(0, 8)}...</small></td>
                  <td>{b.customer_name || b.customer_username}</td>
                  <td>{b.room_number}</td>
                  <td>{b.check_in_date}</td>
                  <td>{b.check_out_date}</td>
                  <td>${b.total_amount}</td>
                  <td><span className={`badge bg-${b.status === 'confirmed' ? 'primary' : b.status === 'checked_in' ? 'success' : b.status === 'checked_out' ? 'secondary' : b.status === 'cancelled' ? 'danger' : 'warning'}`}>{b.status}</span></td>
                  <td>
                    {b.status === 'confirmed' && <button className="btn btn-sm btn-success me-1" onClick={() => handleBookingAction(b.id, 'checked_in')}>Check In</button>}
                    {b.status === 'checked_in' && <button className="btn btn-sm btn-warning me-1" onClick={() => handleBookingAction(b.id, 'checked_out')}>Check Out</button>}
                    {(b.status === 'confirmed' || b.status === 'pending') && <button className="btn btn-sm btn-danger" onClick={() => { if (window.confirm('Cancel this booking?')) handleBookingAction(b.id, 'cancelled'); }}>Cancel</button>}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan="8" className="text-center">No bookings found.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {/* Create Booking */}
      {activeTab === 'create-booking' && (
        <div className="row">
          <div className="col-md-6">
            <h4>Create Reservation</h4>
            <form onSubmit={handleBookingSubmit}>
              <div className="mb-3">
                <label className="form-label">Customer</label>
                <select className="form-select" value={bookingForm.customer} onChange={e => setBookingForm({ ...bookingForm, customer: e.target.value })} required>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.username} - {c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Check-in Date</label>
                <input type="date" className="form-control" value={bookingForm.check_in_date} onChange={e => setBookingForm({ ...bookingForm, check_in_date: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Check-out Date</label>
                <input type="date" className="form-control" value={bookingForm.check_out_date} onChange={e => setBookingForm({ ...bookingForm, check_out_date: e.target.value })} required />
              </div>
              <button type="button" className="btn btn-outline-primary mb-3" onClick={checkAvailability}>Check Availability</button>
              {availableRooms.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Select Room</label>
                  <select className="form-select" value={bookingForm.room} onChange={e => setBookingForm({ ...bookingForm, room: e.target.value })} required>
                    <option value="">Select Room</option>
                    {availableRooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number} - {r.category_name} (${r.price_per_night}/night)</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="btn btn-primary">Create Booking</button>
            </form>
          </div>
        </div>
      )}

      {/* Register Walk-in */}
      {activeTab === 'register-walkin' && (
        <div className="row">
          <div className="col-md-6">
            <h4>Register Walk-in Customer</h4>
            <form onSubmit={handleWalkinSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control" value={walkinForm.first_name} onChange={e => setWalkinForm({ ...walkinForm, first_name: e.target.value })} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" value={walkinForm.last_name} onChange={e => setWalkinForm({ ...walkinForm, last_name: e.target.value })} required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" value={walkinForm.username} onChange={e => setWalkinForm({ ...walkinForm, username: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={walkinForm.email} onChange={e => setWalkinForm({ ...walkinForm, email: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={walkinForm.password} onChange={e => setWalkinForm({ ...walkinForm, password: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" value={walkinForm.phone} onChange={e => setWalkinForm({ ...walkinForm, phone: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-success">Register Customer</button>
            </form>
          </div>
        </div>
      )}

      {/* Feedback & Complaints */}
      {activeTab === 'feedback' && (
        <>
          <h4>Customer Feedback</h4>
          <table className="table table-bordered mb-5">
            <thead className="table-dark"><tr><th>Customer</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
            <tbody>
              {feedbacks.map(f => (
                <tr key={f.id}>
                  <td>{f.customer_name}</td>
                  <td>{'*'.repeat(f.rating)}</td>
                  <td>{f.comment}</td>
                  <td>{new Date(f.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {feedbacks.length === 0 && <tr><td colSpan="4" className="text-center">No feedback yet.</td></tr>}
            </tbody>
          </table>

          <h4>Customer Complaints</h4>
          <table className="table table-bordered">
            <thead className="table-dark"><tr><th>Customer</th><th>Subject</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id}>
                  <td>{c.customer_name}</td>
                  <td>{c.subject}</td>
                  <td>{c.description}</td>
                  <td><span className={`badge bg-${c.status === 'resolved' ? 'success' : c.status === 'open' ? 'danger' : 'warning'}`}>{c.status}</span></td>
                  <td>
                    {c.status !== 'resolved' && c.status !== 'closed' && (
                      <>
                        <button className="btn btn-sm btn-warning me-1" onClick={() => handleComplaintUpdate(c.id, 'in_progress')}>In Progress</button>
                        <button className="btn btn-sm btn-success" onClick={() => { const res = prompt('Enter resolution:'); if (res) handleComplaintUpdate(c.id, 'resolved', res); }}>Resolve</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && <tr><td colSpan="5" className="text-center">No complaints.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default EmployeeDashboard;
