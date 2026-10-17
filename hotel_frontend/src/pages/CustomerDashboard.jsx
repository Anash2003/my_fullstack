/**
 * CustomerDashboard - customer can browse rooms, book, view/cancel bookings,
 * update profile, submit feedback and complaints.
 */
import { useState, useEffect } from 'react';
import api from '../api';

function CustomerDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Booking form
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  // Feedback form
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '', booking: '' });

  // Complaint form
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '' });

  // Profile form
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '', id_proof: '' });

  // Booking filter
  const [bookingFilter, setBookingFilter] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (activeTab === 'bookings') loadBookings();
    if (activeTab === 'browse-rooms') loadCategories();
    if (activeTab === 'feedback') { loadFeedbacks(); loadBookings(); }
    if (activeTab === 'complaints') loadComplaints();
    if (activeTab === 'profile') loadProfile();
  }, [activeTab]);

  const loadDashboard = async () => {
    try { const res = await api.get('customer/dashboard/'); setStats(res.data); } catch (err) { setError('Failed to load dashboard.'); }
  };

  const loadBookings = async () => {
    try {
      let url = 'bookings/';
      if (bookingFilter) url += '?status=' + bookingFilter;
      const res = await api.get(url);
      setBookings(res.data);
    } catch (err) { setError('Failed to load bookings.'); }
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

  const loadProfile = async () => {
    try {
      const res = await api.get('customer/profile/');
      setProfile(res.data);
      setProfileForm(res.data);
    } catch (err) { setError('Failed to load profile.'); }
  };

  const clearMessages = () => { setError(''); setSuccess(''); };

  // Search available rooms
  const searchRooms = async () => {
    clearMessages();
    if (!checkIn || !checkOut) { setError('Please select both dates.'); return; }
    try {
      let url = `rooms/available/?check_in=${checkIn}&check_out=${checkOut}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      const res = await api.get(url);
      setAvailableRooms(res.data);
      if (res.data.length === 0) setError('No rooms available for selected dates.');
    } catch (err) { setError(err.response?.data?.error || 'Failed to search rooms.'); }
  };

  // Book a room
  const handleBook = async () => {
    clearMessages();
    if (!selectedRoom) { setError('Please select a room.'); return; }
    try {
      const res = await api.post('bookings/', {
        room: selectedRoom,
        check_in_date: checkIn,
        check_out_date: checkOut,
      });
      setSuccess('Booking confirmed! Booking ID: ' + res.data.booking_id);
      setAvailableRooms([]);
      setSelectedRoom('');
      setCheckIn('');
      setCheckOut('');
      loadDashboard();
    } catch (err) { setError(err.response?.data?.error || 'Booking failed.'); }
  };

  // Cancel booking
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    clearMessages();
    try {
      await api.post(`bookings/${id}/cancel/`);
      setSuccess('Booking cancelled.');
      loadBookings();
      loadDashboard();
    } catch (err) { setError(err.response?.data?.error || 'Failed to cancel.'); }
  };

  // Submit feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const data = { ...feedbackForm };
      if (!data.booking) delete data.booking;
      await api.post('feedback/', data);
      setSuccess('Feedback submitted!');
      setFeedbackForm({ rating: 5, comment: '', booking: '' });
      loadFeedbacks();
    } catch (err) { setError('Failed to submit feedback.'); }
  };

  // Submit complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.post('complaints/', complaintForm);
      setSuccess('Complaint submitted!');
      setComplaintForm({ subject: '', description: '' });
      loadComplaints();
    } catch (err) { setError('Failed to submit complaint.'); }
  };

  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.put('customer/profile/', profileForm);
      setSuccess('Profile updated!');
    } catch (err) { setError('Failed to update profile.'); }
  };

  return (
    <div className="container mt-4">
      <h2>Customer Dashboard</h2>

      {error && <div className="alert alert-danger alert-dismissible">{error} <button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success alert-dismissible">{success} <button type="button" className="btn-close" onClick={() => setSuccess('')}></button></div>}

      <ul className="nav nav-tabs mb-4">
        {['overview', 'browse-rooms', 'bookings', 'feedback', 'complaints', 'profile'].map(tab => (
          <li className="nav-item" key={tab}>
            <button className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab); clearMessages(); }}>
              {tab === 'browse-rooms' ? 'Browse & Book' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* Overview */}
      {activeTab === 'overview' && stats && (
        <div className="row">
          {[
            { label: 'Upcoming Bookings', value: stats.upcoming_bookings, color: 'primary' },
            { label: 'Current Stays', value: stats.current_stays, color: 'success' },
            { label: 'Completed', value: stats.completed_bookings, color: 'info' },
            { label: 'Cancelled', value: stats.cancelled_bookings, color: 'secondary' },
            { label: 'Total Spent', value: '$' + stats.total_spent, color: 'dark' },
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

      {/* Browse Rooms & Book */}
      {activeTab === 'browse-rooms' && (
        <>
          <h4>Search Available Rooms</h4>
          <div className="row g-2 mb-4">
            <div className="col-md-3">
              <label className="form-label">Check-in</label>
              <input type="date" className="form-control" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Check-out</label>
              <input type="date" className="form-control" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Category (optional)</label>
              <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={searchRooms}>Search</button>
            </div>
          </div>

          {availableRooms.length > 0 && (
            <>
              <h5>Available Rooms</h5>
              <div className="row">
                {availableRooms.map(room => (
                  <div className="col-md-4 mb-3" key={room.id}>
                    <div className={`card ${selectedRoom == room.id ? 'border-primary border-3' : ''}`}>
                      <div className="card-body">
                        <h5 className="card-title">Room {room.room_number}</h5>
                        <h6 className="card-subtitle mb-2 text-muted">{room.category_name}</h6>
                        <p className="card-text">{room.description}</p>
                        <p><strong>Amenities:</strong> {room.amenities}</p>
                        <p className="h5 text-success">${room.price_per_night} / night</p>
                        <button
                          className={`btn ${selectedRoom == room.id ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setSelectedRoom(room.id)}
                        >
                          {selectedRoom == room.id ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedRoom && (
                <div className="text-center mt-3">
                  <button className="btn btn-success btn-lg" onClick={handleBook}>Confirm Booking</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Bookings */}
      {activeTab === 'bookings' && (
        <>
          <div className="mb-3">
            <select className="form-select w-auto d-inline-block" value={bookingFilter} onChange={e => { setBookingFilter(e.target.value); }}>
              <option value="">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn btn-primary ms-2" onClick={loadBookings}>Filter</button>
          </div>
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr><th>Booking ID</th><th>Room</th><th>Category</th><th>Check-in</th><th>Check-out</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td><small>{String(b.booking_id).substring(0, 8)}...</small></td>
                  <td>{b.room_number}</td>
                  <td>{b.room_category}</td>
                  <td>{b.check_in_date}</td>
                  <td>{b.check_out_date}</td>
                  <td>${b.total_amount}</td>
                  <td><span className={`badge bg-${b.status === 'confirmed' ? 'primary' : b.status === 'checked_in' ? 'success' : b.status === 'checked_out' ? 'secondary' : b.status === 'cancelled' ? 'danger' : 'warning'}`}>{b.status}</span></td>
                  <td>
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleCancel(b.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan="8" className="text-center">No bookings found.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {/* Feedback */}
      {activeTab === 'feedback' && (
        <>
          <h4>Submit Feedback</h4>
          <form onSubmit={handleFeedbackSubmit} className="mb-4">
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Rating</label>
                <select className="form-select" value={feedbackForm.rating} onChange={e => setFeedbackForm({ ...feedbackForm, rating: parseInt(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Related Booking (optional)</label>
                <select className="form-select" value={feedbackForm.booking} onChange={e => setFeedbackForm({ ...feedbackForm, booking: e.target.value })}>
                  <option value="">None</option>
                  {bookings.map(b => <option key={b.id} value={b.id}>Room {b.room_number} ({b.check_in_date})</option>)}
                </select>
              </div>
              <div className="col-md-5 mb-3">
                <label className="form-label">Comment</label>
                <input type="text" className="form-control" value={feedbackForm.comment} onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Submit Feedback</button>
          </form>

          <h5>Your Feedback</h5>
          <table className="table table-bordered">
            <thead className="table-dark"><tr><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
            <tbody>
              {feedbacks.map(f => (
                <tr key={f.id}><td>{'*'.repeat(f.rating)}</td><td>{f.comment}</td><td>{new Date(f.created_at).toLocaleDateString()}</td></tr>
              ))}
              {feedbacks.length === 0 && <tr><td colSpan="3" className="text-center">No feedback yet.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {/* Complaints */}
      {activeTab === 'complaints' && (
        <>
          <h4>Submit Complaint</h4>
          <form onSubmit={handleComplaintSubmit} className="mb-4">
            <div className="mb-3">
              <label className="form-label">Subject</label>
              <input type="text" className="form-control" value={complaintForm.subject} onChange={e => setComplaintForm({ ...complaintForm, subject: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="3" value={complaintForm.description} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })} required></textarea>
            </div>
            <button type="submit" className="btn btn-danger">Submit Complaint</button>
          </form>

          <h5>Your Complaints</h5>
          <table className="table table-bordered">
            <thead className="table-dark"><tr><th>Subject</th><th>Description</th><th>Status</th><th>Resolution</th><th>Date</th></tr></thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id}>
                  <td>{c.subject}</td><td>{c.description}</td>
                  <td><span className={`badge bg-${c.status === 'resolved' ? 'success' : c.status === 'open' ? 'danger' : 'warning'}`}>{c.status}</span></td>
                  <td>{c.resolution || '-'}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {complaints.length === 0 && <tr><td colSpan="5" className="text-center">No complaints.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {/* Profile */}
      {activeTab === 'profile' && profile && (
        <div className="row">
          <div className="col-md-6">
            <h4>Update Profile</h4>
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" value={profile.username} disabled />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control" value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea className="form-control" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">ID Proof</label>
                <input type="text" className="form-control" value={profileForm.id_proof} onChange={e => setProfileForm({ ...profileForm, id_proof: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary">Update Profile</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
