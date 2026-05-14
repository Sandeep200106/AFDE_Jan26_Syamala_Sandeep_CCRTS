import { useMemo, useState } from 'react';

const defaultUsers = [
  { id: 1, name: 'Admin User', email: 'admin@prodapt.com', empNo: '1001', role: 'Admin', password: 'admin123' },
  { id: 2, name: 'Support Agent', email: 'agent@prodapt.com', empNo: '1002', role: 'Support Agent', password: 'agent123' },
  { id: 3, name: 'Supervisor', email: 'supervisor@prodapt.com', empNo: '1003', role: 'Supervisor', password: 'super123' },
  { id: 4, name: 'Sandeep', email: 'Sandeep@prodapt.com', empNo: '1004', role: 'Employee', password: 'Sandeep123' }
];

const categories = [
  'Billing Issues',
  'Service Disruption',
  'Product Defects',
  'Technical Problems',
  'Delivery Delays',
  'Account Issues',
  'Customer Service Complaints',
];

const priorities = ['Low', 'Medium', 'High', 'Critical'];
const statuses = ['Open', 'Assigned', 'In Progress', 'Pending Customer Response', 'Escalated', 'Resolved', 'Closed'];

function App() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [view, setView] = useState('dashboard');
  const [complaints, setComplaints] = useState([]);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [newComplaint, setNewComplaint] = useState({
    customerName: '',
    contact: '',
    category: categories[0],
    priority: priorities[1],
    description: '',
  });

  const metrics = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((item) => item.status === 'Open').length;
    const resolved = complaints.filter((item) => item.status === 'Resolved').length;
    const escalated = complaints.filter((item) => item.status === 'Escalated').length;
    const breaches = complaints.filter((item) => item.slaBreach).length;
    return { total, open, resolved, escalated, breaches };
  }, [complaints]);

  const getFilteredComplaints = () => {
    if (!user) return complaints;
    if (user.role === 'Employee') {
      return complaints.filter((item) => item.createdBy === user.name || item.assignedTo === user.name);
    }
    return complaints;
  };

  const canAccessFeature = (feature) => {
    if (user.role === 'Admin' || user.role === 'Supervisor') return true;
    if (user.role === 'Employee') {
      return ['dashboard', 'complaints', 'newComplaint', 'feedback'].includes(feature);
    }
    return false;
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value.trim();
    const empNo = form.empNo.value.trim();
    const password = form.password.value.trim();
    const found = defaultUsers.find((item) => item.email === email && item.empNo === empNo && item.password === password);
    if (!found) {
      setAuthError('Invalid email, employee number, or password. Use one of the sample users.');
      return;
    }
    setAuthError('');
    setUser(found);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const handleAddComplaint = (event) => {
    event.preventDefault();
    const id = `CCR-${String(complaints.length + 1).padStart(5, '0')}`;
    const createdDate = new Date().toLocaleString();
    const complaint = {
      id,
      ...newComplaint,
      status: 'Open',
      category: newComplaint.category,
      priority: newComplaint.priority,
      createdDate,
      createdBy: user?.name || 'Unknown',
      assignedTo: 'Unassigned',
      history: [
        { date: createdDate, actor: newComplaint.customerName || user?.name || 'Customer', status: 'Open', note: 'Complaint registered' },
      ],
      slaBreach: false,
      feedback: '',
    };
    setComplaints((current) => [complaint, ...current]);
    setNewComplaint({
      customerName: '',
      contact: '',
      category: categories[0],
      priority: priorities[1],
      description: '',
    });
    setView('complaints');
  };

  const handleStatusUpdate = (complaintId, status) => {
    setComplaints((current) =>
      current.map((item) =>
        item.id === complaintId
          ? {
              ...item,
              status,
              assignedTo: item.assignedTo === 'Unassigned' ? user?.name || 'Support Agent' : item.assignedTo,
              history: [
                ...item.history,
                { date: new Date().toLocaleString(), actor: user?.name || 'System', status, note: `Status changed to ${status}` },
              ],
            }
          : item
      )
    );
  };

  const handleSelectComplaint = (complaint) => {
    setActiveComplaint(complaint);
    setSelectedStatus(complaint.status);
    setView('details');
  };

  const handleSubmitStatus = () => {
    if (!activeComplaint || !selectedStatus || selectedStatus === activeComplaint.status) {
      return;
    }

    const updatedHistoryItem = {
      date: new Date().toLocaleString(),
      actor: user?.name || 'System',
      status: selectedStatus,
      note: `Status changed to ${selectedStatus}`,
    };

    handleStatusUpdate(activeComplaint.id, selectedStatus);
    setActiveComplaint((prev) =>
      prev
        ? {
            ...prev,
            status: selectedStatus,
            assignedTo: prev.assignedTo === 'Unassigned' ? user?.name || 'Support Agent' : prev.assignedTo,
            history: [...prev.history, updatedHistoryItem],
          }
        : prev
    );
  };

  const activeRole = user?.role || 'Guest';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <img className="logo" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='45' font-size='40' font-weight='bold' fill='white' font-family='Arial, sans-serif'%3EProdapt%3C/text%3E%3C/svg%3E" alt="Prodapt Logo" />
          <div>
            <h1>IT Support Services</h1>
          </div>
        </div>
        <div className="header-actions">
          {user && <span className="user-chip">{user.name} • EMP: {user.empNo} • {user.role}</span>}
          {user && <button className="btn-secondary" onClick={handleLogout}>Logout</button>}
        </div>
      </header>

      <main className="app-main">
        {!user ? (
          <section className="login-pane">
            <div className="panel">
              <h2>Login</h2>
              <form onSubmit={handleLogin} className="form-grid">
                <label>
                  Email
                  <input name="email" type="email" placeholder="admin@ccrts.com" required />
                </label>
                <label>
                  Employee Number
                  <input name="empNo" type="text" placeholder="1001" required />
                </label>
                <label>
                  Password
                  <input name="password" type="password" placeholder="admin123" required />
                </label>
                <button type="submit" className="btn-primary">Sign In</button>
                {authError && <p className="error-text">{authError}</p>}
              </form>
            </div>
          </section>
        ) : (
          <section className="dashboard-grid">
            <aside className="sidebar">
              <nav>
                <button className={view === 'dashboard' ? 'nav-active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
                <button className={view === 'complaints' ? 'nav-active' : ''} onClick={() => setView('complaints')}>Complaint List</button>
                <button className={view === 'newComplaint' ? 'nav-active' : ''} onClick={() => setView('newComplaint')}>New Complaint</button>
                {(user.role === 'Admin' || user.role === 'Supervisor') && (
                  <button className={view === 'feedback' ? 'nav-active' : ''} onClick={() => setView('feedback')}>Feedback</button>
                )}
              </nav>
            </aside>

            <section className="content-area">
              {view === 'dashboard' && (
                <div>
                  <h2>Welcome back, {user.name}</h2>
                  <p>Current role: {activeRole}</p>
                  <div className="metric-row">
                    <div className="metric-card"><strong>{metrics.total}</strong><span>Total Complaints</span></div>
                    <div className="metric-card"><strong>{metrics.open}</strong><span>Open</span></div>
                    <div className="metric-card"><strong>{metrics.resolved}</strong><span>Resolved</span></div>
                    <div className="metric-card"><strong>{metrics.escalated}</strong><span>Escalated</span></div>
                    <div className="metric-card"><strong>{metrics.breaches}</strong><span>SLA Breaches</span></div>
                  </div>
                  <div className="panel">
                    <h3>Quick actions</h3>
                    <div className="action-grid">
                      <button onClick={() => setView('newComplaint')}>Register Complaint</button>
                      <button onClick={() => setView('complaints')}>View Complaints</button>
                      <button onClick={() => setView('feedback')}>View Feedback</button>
                    </div>
                  </div>
                </div>
              )}

              {view === 'newComplaint' && (
                <div className="panel">
                  <h2>Register New Complaint</h2>
                  <form onSubmit={handleAddComplaint} className="form-grid">
                    <label>
                      Customer Name
                      <input
                        value={newComplaint.customerName}
                        onChange={(e) => setNewComplaint({ ...newComplaint, customerName: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Contact Details
                      <input
                        value={newComplaint.contact}
                        onChange={(e) => setNewComplaint({ ...newComplaint, contact: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Category
                      <select
                        value={newComplaint.category}
                        onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Priority
                      <select
                        value={newComplaint.priority}
                        onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                      >
                        {priorities.map((priority) => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </label>
                    <label className="full-width">
                      Description
                      <textarea
                        value={newComplaint.description}
                        onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                        rows="5"
                        required
                      />
                    </label>
                    <button type="submit" className="btn-primary">Submit Complaint</button>
                  </form>
                </div>
              )}

              {view === 'complaints' && (
                <div className="panel">
                  <h2>Complaint List {user.role === 'Employee' ? '(Your Complaints)' : '(All Complaints)'}</h2>
                  {getFilteredComplaints().length === 0 ? (
                    <p>No complaints found.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Customer</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          {(user.role === 'Admin' || user.role === 'Supervisor') && <th>Created By</th>}
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredComplaints().map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.customerName}</td>
                            <td>{item.category}</td>
                            <td>{item.priority}</td>
                            <td>{item.status}</td>
                            <td>{item.assignedTo}</td>
                            {(user.role === 'Admin' || user.role === 'Supervisor') && <td>{item.createdBy}</td>}
                            <td>
                              <button className="btn-secondary" onClick={() => handleSelectComplaint(item)}>Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {view === 'details' && activeComplaint && (
                <div className="panel">
                  <button className="link-button" onClick={() => setView('complaints')}>← Back to complaint list</button>
                  <h2>Complaint Details</h2>
                  <div className="detail-grid">
                    <div>
                      <strong>Complaint ID</strong>
                      <p>{activeComplaint.id}</p>
                    </div>
                    <div>
                      <strong>Customer</strong>
                      <p>{activeComplaint.customerName}</p>
                    </div>
                    <div>
                      <strong>Contact</strong>
                      <p>{activeComplaint.contact}</p>
                    </div>
                    <div>
                      <strong>Category</strong>
                      <p>{activeComplaint.category}</p>
                    </div>
                    <div>
                      <strong>Priority</strong>
                      <p>{activeComplaint.priority}</p>
                    </div>
                    <div>
                      <strong>Status</strong>
                      <p>{activeComplaint.status}</p>
                    </div>
                    <div className="full-width">
                      <strong>Description</strong>
                      <p>{activeComplaint.description}</p>
                    </div>
                  </div>
                  <div className="panel">
                    <h3>History</h3>
                    <ul className="timeline">
                      {activeComplaint.history.map((entry, index) => (
                        <li key={index}>
                          <strong>{entry.date}</strong> — {entry.actor} — <em>{entry.status}</em>
                          <p>{entry.note}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="panel">
                    <h3>Update Status</h3>
                    <div className="action-grid">
                      {statuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`btn-secondary ${status === selectedStatus ? 'status-active' : ''}`}
                          onClick={() => setSelectedStatus(status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <div className="action-grid" style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!selectedStatus || selectedStatus === activeComplaint.status}
                        onClick={handleSubmitStatus}
                      >
                        Submit Status
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {view === 'feedback' && (
                <div className="panel">
                  <h2>Feedback and Quality</h2>
                  <p>Feedback collection and satisfaction rating support will be available in later sprints.</p>
                  <div className="panel-summary">
                    <p>Use the complaint details screen to review status history and escalation notes.</p>
                  </div>
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
