/**
 * AdminDashboard - main admin page with stats and management tabs.
 */
import { useState, useEffect } from 'react';
import api from '../api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Room form
  const [roomForm, setRoomForm] = useState({ room_number: '', category: '', price_per_night: '', description: '', amenities: '', status: 'available' });
  const [editingRoom, setEditingRoom] = useState(null);

  // Category form
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Employee form
  const [empForm, setEmpForm] = useState({ username: '', password: '', email: '', first_name: '', last_name: '', phone: '', position: 'Front Desk' });

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'rooms') { loadRooms(); loadCategories(); }
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'bookings') loadBookings();
    if (activeTab === 'employees') loadEmployees();
    if (activeTab === 'customers') loadCustomers();
    if (activeTab === 'feedback') { loadFeedbacks(); loadComplaints(); }
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      const res = await api.get('admin/dashboard/');
      setStats(res.data);
    } catch (err) { setError('Failed to load dashboard.'); }
  };

  const loadRooms = async () => {
    try { const res = await api.get('rooms/'); setRooms(res.data); } catch (err) { setError('Failed to load rooms.'); }
  };

  const loadCategories = async () => {
    try { const res = await api.get('categories/'); setCategories(res.data); } catch (err) { setError('Failed to load categories.'); }
  };

  const loadBookings = async () => {
    try {
      let url = 'bookings/';
      if (searchQuery) url += '?search=' + searchQuery;
      const res = await api.get(url);
      setBookings(res.data);
    } catch (err) { setError('Failed to load bookings.'); }
  };

  const loadEmployees = async () => {
    try { const res = await api.get('employees/'); setEmployees(res.data); } catch (err) { setError('Failed to load employees.'); }
  };

  const loadCustomers = async () => {
    try { const res = await api.get('customers/'); setCustomers(res.data); } catch (err) { setError('Failed to load customers.'); }
  };

  const loadFeedbacks = async () => {
    try { const res = await api.get('feedback/'); setFeedbacks(res.data); } catch (err) { /* ignore */ }
  };

  const loadComplaints = async () => {
    try { const res = await api.get('complaints/'); setComplaints(res.data); } catch (err) { /* ignore */ }
  };

  const clearMessages = () => { setError(''); setSuccess(''); };

  // --- Room CRUD ---
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      if (editingRoom) {
        await api.put(`rooms/${editingRoom.id}/`, roomForm);
        setSuccess('Room updated.');
      } else {
        await api.post('rooms/', roomForm);
        setSuccess('Room created.');
      }
      setRoomForm({ room_number: '', category: '', price_per_night: '', description: '', amenities: '', status: 'available' });
      setEditingRoom(null);
      loadRooms();
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed.');
    }
    setLoading(false);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      category: room.category,
      price_per_night: room.price_per_night,
      description: room.description,
      amenities: room.amenities,
      status: room.status,
    });
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.delete(`rooms/${id}/`);
      setSuccess('Room deleted.');
      loadRooms();
      loadDashboard();
    } catch (err) { setError('Failed to delete room.'); }
  };

  // --- Category CRUD ---
  const handleCatSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.post('categories/', catForm);
      setSuccess('Category created.');
      setCatForm({ name: '', description: '' });
      loadCategories();
    } catch (err) { setError(err.response?.data?.error || 'Failed.'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`categories/${id}/`);
      setSuccess('Category deleted.');
      loadCategories();
    } catch (err) { setError('Failed to delete category.'); }
  };

  // --- Employee ---
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.post('employees/', empForm);
      setSuccess('Employee created.');
      setEmpForm({ username: '', password: '', email: '', first_name: '', last_name: '', phone: '', position: 'Front Desk' });
      loadEmployees();
      loadDashboard();
    } catch (err) { setError(err.response?.data?.error || 'Failed.'); }
  };

  const handleToggleEmployee = async (id) => {
    try {
      await api.put(`employees/${id}/toggle/`);
      loadEmployees();
    } catch (err) { setError('Failed.'); }
  };

  // --- Booking status update ---
  const handleBookingStatus = async (id, newStatus) => {
    clearMessages();
    try {
      await api.put(`bookings/${id}/`, { status: newStatus });
      setSuccess('Booking updated.');
      loadBookings();
      loadDashboard();
    } catch (err) { setError(err.response?.data?.error || 'Failed.'); }
  };

  // --- Complaint update ---
  const handleComplaintUpdate = async (id, newStatus, resolution) => {
    try {
      await api.put(`complaints/${id}/`, { status: newStatus, resolution: resolution || '' });
      loadComplaints();
    } catch (err) { setError('Failed to update complaint.'); }
  };

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>

      {error && <div className="alert alert-danger alert-dismissible">{error} <button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success alert-dismissible">{success} <button type="button" className="btn-close" onClick={() => setSuccess('')}></button></div>}

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        {['overview', 'rooms', 'categories', 'bookings', 'employees', 'customers', 'feedback'].map(tab => (
          <li className="nav-item" key={tab}>
            <button className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab); clearMessages(); }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="row">
          {[
            { label: 'Total Rooms', value: stats.total_rooms, color: 'primary' },
            { label: 'Available Rooms', value: stats.available_rooms, color: 'success' },
            { label: 'Occupied Rooms', value: stats.occupied_rooms, color: 'warning' },
            { label: 'Total Bookings', value: stats.total_bookings, color: 'info' },
            { label: 'Active Bookings', value: stats.active_bookings, color: 'dark' },
            { label: 'Total Revenue', value: '$' + stats.total_revenue, color: 'success' },
            { label: 'Customers', value: stats.total_customers, color: 'info' },
            { label: 'Employees', value: stats.total_employees, color: 'secondary' },
          ].map((item, i) => (
            <div className="col-md-3 mb-3" key={i}>
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

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <>
          <h4>{editingRoom ? 'Edit Room' : 'Add Room'}</h4>
          <form onSubmit={handleRoomSubmit} className="row g-2 mb-4">
            <div className="col-md-2">
              <input className="form-control" placeholder="Room Number" value={roomForm.room_number} onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={roomForm.category} onChange={e => setRoomForm({ ...roomForm, category: e.target.value })} required>
                <option value="">Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input className="form-control" type="number" placeholder="Price/Night" value={roomForm.price_per_night} onChange={e => setRoomForm({ ...roomForm, price_per_night: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={roomForm.status} onChange={e => setRoomForm({ ...roomForm, status: e.target.value })}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
            <div className="col-md-2">
              <input className="form-control" placeholder="Amenities" value={roomForm.amenities} onChange={e => setRoomForm({ ...roomForm, amenities: e.target.value })} />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>{editingRoom ? 'Update' : 'Add'}</button>
              {editingRoom && <button type="button" className="btn btn-secondary w-100 mt-1" onClick={() => { setEditingRoom(null); setRoomForm({ room_number: '', category: '', price_per_night: '', description: '', amenities: '', status: 'available' }); }}>Cancel</button>}
            </div>
          </form>

          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr><th>Room#</th><th>Category</th><th>Price</th><th>Status</th><th>Amenities</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id}>
                  <td>{room.room_number}</td>
                  <td>{room.category_name}</td>
                  <td>${room.price_per_night}</td>
                  <td><span className={`badge bg-${room.status === 'available' ? 'success' : room.status === 'occupied' ? 'warning' : 'secondary'}`}>{room.status}</span></td>
                  <td>{room.amenities}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditRoom(room)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRoom(room.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && <tr><td colSpan="6" className="text-center">No rooms found.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          <h4>Add Category</h4>
          <form onSubmit={handleCatSubmit} className="row g-2 mb-4">
            <div className="col-md-4">
              <input className="form-control" placeholder="Category Name" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required />
            </div>
            <div className="col-md-5">
              <input className="form-control" placeholder="Description" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} />
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-primary w-100">Add Category</button>
            </div>
          </form>

          <table className="table table-bordered">
            <thead className="table-dark"><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td><td>{c.description}</td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCategory(c.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <input className="form-control" placeholder="Search by booking ID, customer, or room..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
                    {b.status === 'confirmed' && <button className="btn btn-sm btn-success me-1" onClick={() => handleBookingStatus(b.id, 'checked_in')}>Check In</button>}
                    {b.status === 'checked_in' && <button className="btn btn-sm btn-warning me-1" onClick={() => handleBookingStatus(b.id, 'checked_out')}>Check Out</button>}
                    {(b.status === 'confirmed' || b.status === 'pending') && <button className="btn btn-sm btn-danger" onClick={() => { if (window.confirm('Cancel this booking?')) handleBookingStatus(b.id, 'cancelled'); }}>Cancel</button>}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan="8" className="text-center">No bookings found.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <>
          <h4>Create Employee</h4>
          <form onSubmit={handleEmpSubmit} className="row g-2 mb-4">
            <div className="col-md-2"><input className="form-control" placeholder="Username" value={empForm.username} onChange={e => setEmpForm({ ...empForm, username: e.target.value })} required /></div>
            <div className="col-md-2"><input className="form-control" type="password" placeholder="Password" value={empForm.password} onChange={e => setEmpForm({ ...empForm, password: e.target.value })} required /></div>
            <div className="col-md-2"><input className="form-control" placeholder="First Name" value={empForm.first_name} onChange={e => setEmpForm({ ...empForm, first_name: e.target.value })} /></div>
            <div className="col-md-2"><input className="form-control" placeholder="Last Name" value={empForm.last_name} onChange={e => setEmpForm({ ...empForm, last_name: e.target.value })} /></div>
            <div className="col-md-2"><input className="form-control" placeholder="Position" value={empForm.position} onChange={e => setEmpForm({ ...empForm, position: e.target.value })} /></div>
            <div className="col-md-2"><button type="submit" className="btn btn-primary w-100">Create</button></div>
          </form>

          <table className="table table-bordered">
            <thead className="table-dark"><tr><th>Username</th><th>Name</th><th>Position</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.user.username}</td>
                  <td>{emp.user.first_name} {emp.user.last_name}</td>
                  <td>{emp.position}</td>
                  <td>{emp.phone}</td>
                  <td><span className={`badge bg-${emp.is_active_employee ? 'success' : 'danger'}`}>{emp.is_active_employee ? 'Active' : 'Inactive'}</span></td>
                  <td><button className={`btn btn-sm btn-${emp.is_active_employee ? 'warning' : 'success'}`} onClick={() => handleToggleEmployee(emp.id)}>{emp.is_active_employee ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <table className="table table-bordered">
          <thead className="table-dark"><tr><th>Username</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>{c.username}</td>
                <td>{c.first_name} {c.last_name}</td>
                <td>{c.email}</td>
                <td>{c.phone || '-'}</td>
                <td><span className={`badge bg-${c.is_active ? 'success' : 'danger'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Feedback & Complaints Tab */}
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

export default AdminDashboard;
