// Multi-page app with client-side routing
// Use dynamic API base so mobile devices can call the same host/IP the page was served from.
const API_BASE = (function() {
  try {
    const host = window.location.host; // includes port
    const protocol = window.location.protocol;
    return `${protocol}//${host}/api`;
  } catch (e) {
    return 'http://localhost:5000/api';
  }
})();

let currentUser = null;
let authToken = localStorage.getItem('authToken') || null;

// Restore currentUser from localStorage
if (localStorage.getItem('currentUser')) {
  try {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  } catch (e) {
    console.error('Failed to parse stored currentUser');
    currentUser = null;
  }
}

// Fetch with auth header
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      if (res.status === 401) {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        navigate('login');
        throw new Error('Unauthorized');
      }
      throw new Error(`API Error: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error('API call failed:', err);
    alert(`Error: ${err.message}`);
    throw err;
  }
}

// Simple routing
let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  render();
}

function render() {
  const root = document.getElementById('app-root');
  if (!root) return;
  
  // Show login if not authenticated
  if (!authToken && currentPage !== 'login' && currentPage !== 'register') {
    currentPage = 'login';
  }

  switch (currentPage) {
    case 'login':
      root.innerHTML = renderLogin();
      attachLoginHandlers();
      break;
    case 'register':
      root.innerHTML = renderRegister();
      attachRegisterHandlers();
      break;
    case 'dashboard':
      root.innerHTML = renderDashboard();
      attachDashboardHandlers();
      break;
    case 'symptoms':
      root.innerHTML = renderSymptoms();
      attachSymptomsHandlers();
      break;
    case 'reminders':
      root.innerHTML = renderReminders();
      attachRemindersHandlers();
      break;
    case 'devices':
      root.innerHTML = renderDevices();
      attachDevicesHandlers();
      break;
    case 'vitals':
      root.innerHTML = renderVitals();
      break;
    case 'nutrition':
      root.innerHTML = renderNutrition();
      break;
    case 'reports':
      root.innerHTML = renderReports();
      break;
    case 'profile':
      root.innerHTML = renderProfile();
      attachProfileHandlers();
      break;
    case 'complaints':
      root.innerHTML = renderComplaints();
      attachComplaintsHandlers();
      break;
    default:
      root.innerHTML = renderDashboard();
  }
}

// ===== LOGIN PAGE =====
function renderLogin() {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo-large">💙</div>
        <h1>Healthcare Virtual Assistant</h1>
        <p>Sign in to your account</p>
        
        <div class="form-group">
          <label>📧 Email Address</label>
          <input type="email" id="login-email" placeholder="user@example.com" />
        </div>
        
        <div class="form-group">
          <label>🔐 Password</label>
          <input type="password" id="login-password" placeholder="••••••••" />
        </div>
        
        <button id="login-btn" class="btn primary full">Sign In</button>
        
        <p class="auth-switch">
          Don't have an account? <a href="#" onclick="navigate('register'); return false;">Create one now</a>
        </p>
      </div>
    </div>
  `;
}

function attachLoginHandlers() {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    
    try {
      const data = await apiCall('/auth/login', 'POST', { email, password });
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      currentUser = { id: data.userId, role: data.role, email: data.email, name: data.name };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      navigate('dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  });
}

// ===== REGISTER PAGE =====
function renderRegister() {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo-large">💙</div>
        <h1>Create Your Account</h1>
        <p>Get started with Healthcare Virtual Assistant</p>
        
        <div class="form-group">
          <label>👤 Full Name</label>
          <input type="text" id="register-name" placeholder="John Doe" />
        </div>
        
        <div class="form-group">
          <label>📧 Email Address</label>
          <input type="email" id="register-email" placeholder="user@example.com" />
        </div>
        
        <div class="form-group">
          <label>🔐 Password</label>
          <input type="password" id="register-password" placeholder="••••••••" />
        </div>

        <div class="form-group">
          <label>👨‍⚕️ I am a...</label>
          <select id="register-role">
            <option value="patient">🏥 Patient</option>
            <option value="doctor">👨‍⚕️ Doctor</option>
          </select>
        </div>
        
        <button id="register-btn" class="btn primary full">Create Account</button>
        
        <p class="auth-switch">
          Already have an account? <a href="#" onclick="navigate('login'); return false;">Sign in here</a>
        </p>
      </div>
    </div>
  `;
}

function attachRegisterHandlers() {
  document.getElementById('register-btn').addEventListener('click', async () => {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const role = document.getElementById('register-role').value;
    
    if (!name || !email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const data = await apiCall('/auth/register', 'POST', { name, email, password, role, language: 'en' });
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      currentUser = { id: data.userId, role: data.role, email: data.email, name: data.name };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      navigate('dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  });
}

// ===== DASHBOARD PAGE =====
function renderDashboard() {
  const role = currentUser ? currentUser.role : 'patient';
  if (role === 'doctor') {
    return renderDoctorDashboard();
  } else if (role === 'admin') {
    return renderAdminDashboard();
  } else {
    return renderPatientDashboard();
  }
}

function renderPatientDashboard() {
  return `
    ${renderHeader()}
    ${renderNav()}
    
    <main class="container">
      <section class="row top-row">
        <div class="col-lg-8">
          <div class="card symptom-card">
            <h3>Symptom Analysis</h3>
            <p class="muted">Describe your symptoms</p>
            <textarea id="symptom-input" placeholder="e.g. I have a headache and sore throat..."></textarea>
            <div class="actions">
              <button id="analyze-btn" class="btn primary">Analyze</button>
            </div>
            <div id="analysis-result" style="margin-top:12px; display:none; padding:12px; background:#e8f5e9; border-radius:8px; color:#1b5e20;"></div>
          </div>
        </div>
        <div class="col-lg-4 stats-col">
          <div class="card stats-grid">
            <div class="stat">
              <div class="stat-title">Symptom Reports</div>
              <div class="stat-value">0</div>
              <div class="stat-sub">Total reports</div>
            </div>
            <div class="stat">
              <div class="stat-title">Active Reminders</div>
              <div class="stat-value">0</div>
              <div class="stat-sub">Active alerts</div>
            </div>
            <div class="stat">
              <div class="stat-title">Connected Devices</div>
              <div class="stat-value">0</div>
              <div class="stat-sub">Active devices</div>
            </div>
            <div class="stat">
              <div class="stat-title">Health Metrics</div>
              <div class="stat-value">0</div>
              <div class="stat-sub">Measurements</div>
            </div>
          </div>
        </div>
      </section>

      <section class="row cards-row">
        <div class="card wide">
          <h4>Health Metrics</h4>
          <div class="metrics-list">
            <div class="metric"> <div class="metric-icon">💓</div>
              <div class="metric-label">Heart Rate</div>
              <div class="metric-value">No data</div>
            </div>
            <div class="metric"> <div class="metric-icon">🩺</div>
              <div class="metric-label">Blood Pressure</div>
              <div class="metric-value">No data</div>
            </div>
            <div class="metric"> <div class="metric-icon">🫁</div>
              <div class="metric-label">Oxygen</div>
              <div class="metric-value">No data</div>
            </div>
            <div class="metric"> <div class="metric-icon">🥾</div>
              <div class="metric-label">Steps</div>
              <div class="metric-value">No data</div>
            </div>
            <div class="metric"> <div class="metric-icon">⚖️</div>
              <div class="metric-label">Weight</div>
              <div class="metric-value">No data</div>
            </div>
            <div class="metric"> <div class="metric-icon">🌡️</div>
              <div class="metric-label">Temperature</div>
              <div class="metric-value">No data</div>
            </div>
          </div>
        </div>
      </section>

      <section class="row lower-row">
        <div class="card half">
          <h4>Reminders</h4>
          <p class="muted">Manage your health reminders</p>
          <div class="empty-state">🔔 No reminders set</div>
        </div>
        <div class="card half">
          <h4>Connected Devices</h4>
          <p class="muted">Manage wearable devices</p>
          <div class="empty-state">⌚ No devices connected</div>
        </div>
      </section>
    </main>

    ${renderFooter()}
  `;
}

function renderDoctorDashboard() {
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="card">
        <h2>Doctor Dashboard</h2>
        <p>View and manage your patients.</p>
        <div id="patients-list"></div>
      </div>
    </main>${renderFooter()}`;
}

function renderAdminDashboard() {
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div style="margin-bottom:30px;">
        <h2 style="font-size:32px; margin-bottom:8px; color:#0b0838;">👥 User Management</h2>
        <p style="color:#99a0ac; margin-bottom:20px;">Manage system users, roles, and permissions</p>
        <div id="users-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(350px, 1fr)); gap:16px; margin-bottom:30px;"></div>
      </div>
      
      <div style="margin-top:40px; border-top:2px solid #e6e9ef; padding-top:30px;">
        <h2 style="font-size:28px; margin-bottom:8px; color:#0b0838;">📋 System Complaints</h2>
        <p style="color:#99a0ac; margin-bottom:20px;">Review and manage user complaints</p>
        <div id="complaints-list"></div>
      </div>
    </main>
    
    <!-- User Edit Modal -->
    <div id="user-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:1000; justify-content:center; align-items:center;">
      <div style="background:white; padding:30px; border-radius:14px; width:90%; max-width:500px; max-height:90vh; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3 style="margin:0; color:#0b0838;">Edit User</h3>
          <button onclick="closeUserModal()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#99a0ac;">&times;</button>
        </div>
        <div id="modal-content"></div>
      </div>
    </div>
    ${renderFooter()}`;
}

function attachDashboardHandlers() {
  const role = currentUser ? currentUser.role : 'patient';
  if (role === 'patient') {
    attachPatientDashboardHandlers();
  } else if (role === 'doctor') {
    attachDoctorDashboardHandlers();
  } else if (role === 'admin') {
    attachAdminDashboardHandlers();
  }
}

function attachPatientDashboardHandlers() {
  const analyzeBtn = document.getElementById('analyze-btn');
  const symptomInput = document.getElementById('symptom-input');
  const resultDiv = document.getElementById('analysis-result');
  
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      const text = symptomInput.value.trim();
      if (!text) {
        alert('Please enter symptoms to analyze');
        return;
      }
      
      try {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        
        const result = await apiCall('/symptoms/analyze', 'POST', { symptoms: text });
        
        resultDiv.style.display = 'block';
        let html = `<strong style="font-size:1.2em; color:#1a1a1a;">📋 Comprehensive Analysis Result</strong><br><hr style="margin:10px 0; border:none; border-top:2px solid #e0e0e0;"><br>`;
        
        // Symptoms detected summary
        if (result.detectedSymptoms && result.detectedSymptoms.length > 0) {
          html += `<div style="margin-bottom:12px; padding:10px; background-color:#e8f5e9; border-left:4px solid #4caf50; border-radius:4px;"><strong>🔍 Symptoms Detected:</strong> <span style="color:#2e7d32; font-weight:bold;">${result.symptomsCount}</span> - ${result.detectedSymptoms.map(s => '<strong>' + s.charAt(0).toUpperCase() + s.slice(1) + '</strong>').join(', ')}</div>`;
        }
        
        // Urgency alert with enhanced styling
        if (result.urgency === 'URGENT') {
          html += `<div style="color:#fff; background-color:#d32f2f; padding:14px; border-radius:6px; margin-bottom:12px; font-weight:bold; border:2px solid #b71c1c;">⚠️ URGENT ALERT: Call 911 immediately - This requires emergency medical attention!</div>`;
        } else if (result.urgency.includes('ER') || result.urgency.includes('Emergency')) {
          html += `<div style="color:#fff; background-color:#f57c00; padding:14px; border-radius:6px; margin-bottom:12px; font-weight:bold; border:2px solid #e65100;">🚨 Emergency Alert: ${result.urgency} - Seek emergency care immediately!</div>`;
        } else if (result.urgency.includes('Consult') || result.urgency.includes('See')) {
          html += `<div style="color:#d32f2f; background-color:#ffebee; padding:12px; border-radius:6px; margin-bottom:12px; border-left:4px solid #d32f2f;"><strong>⏱️ Recommended Action:</strong> ${result.urgency}</div>`;
        }
        
        // Severity with visual indicator
        const severityColors = {
          'High': { bg: '#ffcdd2', text: '#d32f2f' },
          'Medium': { bg: '#ffe0b2', text: '#f57c00' },
          'Low-Medium': { bg: '#fff9c4', text: '#f9a825' },
          'Low': { bg: '#e8f5e9', text: '#388e3c' }
        };
        const sColor = severityColors[result.severity] || severityColors['Low'];
        html += `<div style="margin-bottom:12px; padding:10px; background-color:${sColor.bg}; border-radius:4px; border-left:4px solid ${sColor.text};"><strong>📊 Severity Level:</strong> <span style="color:${sColor.text}; font-weight:bold; font-size:1.05em;">${result.severity}</span></div>`;
        
        // Possible conditions
        html += `<div style="margin-bottom:12px;"><strong>🏥 Possible Conditions (${result.conditions.length}):</strong><div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">`;
        result.conditions.forEach(cond => {
          html += `<span style="background-color:#e3f2fd; color:#1565c0; padding:6px 12px; border-radius:20px; font-size:0.9em;">${cond}</span>`;
        });
        html += `</div></div>`;
        
        // Detailed Analysis
        const analysisLines = result.analysis.split('\n').filter(l => l.trim());
        html += `<div style="margin-bottom:12px; padding:12px; background-color:#f5f5f5; border-left:5px solid #2b67ff; border-radius:4px;"><strong style="font-size:1.05em;">📝 Detailed Analysis:</strong><br><div style="margin-top:8px; line-height:1.6; color:#333;">`;
        analysisLines.forEach((line, idx) => {
          if (line.includes('⚠️') || line.includes('Multiple') || line.includes('ALERT')) {
            html += `<div style="color:#d32f2f; font-weight:600; margin-bottom:4px;">${line}</div>`;
          } else if (line.startsWith('•')) {
            html += `<div style="margin-left:12px; margin-bottom:4px; color:#555;">${line}</div>`;
          } else {
            html += `<div style="margin-bottom:4px; color:#333;">${line}</div>`;
          }
        });
        html += `</div></div>`;
        
        // Treatments
        if (result.treatments && result.treatments.length > 0) {
          html += `<div style="margin-bottom:12px; padding:12px; background-color:#f3e5f5; border-left:4px solid:#7b1fa2; border-radius:4px;"><strong>💊 Treatment Recommendations:</strong><ul style="margin:8px 0; padding-left:20px;">`;
          result.treatments.forEach(treatment => {
            html += `<li style="margin-bottom:6px; color:#4a148c;">${treatment}</li>`;
          });
          html += `</ul></div>`;
        }
        
        // Diagnostic tests
        if (result.diagnosticTests && result.diagnosticTests.length > 0) {
          html += `<div style="margin-bottom:12px; padding:12px; background-color:#e0f2f1; border-left:4px solid #00695c; border-radius:4px;"><strong>🔬 Recommended Diagnostic Tests:</strong><ul style="margin:8px 0; padding-left:20px;">`;
          result.diagnosticTests.slice(0, 8).forEach(test => {
            html += `<li style="margin-bottom:6px;"><code style="background-color:#ffffff; padding:4px 8px; border-radius:3px; border:1px solid #b2dfdb; color:#00695c; font-weight:500;">${test}</code></li>`;
          });
          if (result.diagnosticTests.length > 8) {
            html += `<li style="color:#666; font-style:italic;">+ ${result.diagnosticTests.length - 8} more tests</li>`;
          }
          html += `</ul></div>`;
        }
        
        // Health advice
        if (result.healthAdvice && result.healthAdvice.length > 0) {
          html += `<div style="margin-bottom:12px; padding:12px; background-color:#fef3e2; border-left:4px solid #ff6f00; border-radius:4px;"><strong>💡 Health Tips & Advice:</strong><ul style="margin:8px 0; padding-left:20px;">`;
          result.healthAdvice.slice(0, 6).forEach(advice => {
            html += `<li style="margin-bottom:6px; color:#e65100;">${advice}</li>`;
          });
          if (result.healthAdvice.length > 6) {
            html += `<li style="color:#999; font-style:italic;">+ ${result.healthAdvice.length - 6} more tips</li>`;
          }
          html += `</ul></div>`;
        }
        
        // When to seek help box
        html += `<div style="margin-bottom:12px; padding:12px; background-color:#fff3cd; border:2px solid #ff9800; border-radius:4px;"><strong style="color:#ff6f00;">⚠️ Seek Immediate Medical Care If:</strong><ul style="margin:8px 0; padding-left:20px; color:#d84315;">
          <li>Symptoms worsen suddenly</li>
          <li>Difficulty breathing or chest pain develops</li>
          <li>Loss of consciousness or severe confusion</li>
          <li>Severe allergic reactions or difficulty swallowing</li>
          <li>Symptoms persist or new symptoms appear</li>
        </ul></div>`;
        
        // Disclaimer
        html += `<div style="font-size:0.9em; color:#d32f2f; background-color:#fff3e0; margin-top:16px; padding:14px; border-left:5px solid #d32f2f; border-radius:4px; border: 1px solid #ffb74d;"><strong>⚖️ Medical Disclaimer:</strong><br><span style="line-height:1.6;">${result.disclaimer} <strong>Always consult with a healthcare professional for proper diagnosis and treatment.</strong></span></div>`;
        
        resultDiv.innerHTML = html;
        
        analyzeBtn.textContent = 'Analyze';
        analyzeBtn.disabled = false;
      } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `<strong style="color:#d32f2f; font-size:1.05em;">❌ Analysis Error:</strong><br><div style="margin-top:8px; color:#666;">${err.message}</div>`;
        analyzeBtn.textContent = 'Analyze';
        analyzeBtn.disabled = false;
      }
    });
  }
}

function attachDoctorDashboardHandlers() {
  loadPatients();
}

async function loadPatients() {
  try {
    const patients = await apiCall('/auth/patients/all', 'GET');
    const listDiv = document.getElementById('patients-list');
    if (patients.length === 0) {
      listDiv.innerHTML = '<p>No patients found.</p>';
      return;
    }
    let html = '<h3>Patients</h3><ul>';
    patients.forEach(p => {
      html += `<li><strong>${p.name}</strong> (${p.email}) - Age: ${p.profile.age || 'N/A'}, Height: ${p.profile.height || 'N/A'}, Weight: ${p.profile.weight || 'N/A'}</li>`;
    });
    html += '</ul>';
    listDiv.innerHTML = html;
  } catch (err) {
    console.error('Load patients failed:', err);
  }
}

function attachAdminDashboardHandlers() {
  loadUsers();
  loadComplaints();
}

async function loadUsers() {
  try {
    const users = await apiCall('/auth/users/all', 'GET');
    const gridDiv = document.getElementById('users-grid');
    if (users.length === 0) {
      gridDiv.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#99a0ac; padding:40px;">No users found.</p>';
      return;
    }
    let html = '';
    users.forEach(u => {
      const roleColor = u.role === 'admin' ? '#d32f2f' : u.role === 'doctor' ? '#2196f3' : '#4caf50';
      const roleIcon = u.role === 'admin' ? '👨‍💼' : u.role === 'doctor' ? '👨‍⚕️' : '👤';
      html += `
        <div style="background:white; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(20,30,60,0.06); border-left:4px solid ${roleColor}; transition:all 0.3s ease; cursor:pointer;" onmouseover="this.style.boxShadow='0 8px 20px rgba(20,30,60,0.12)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(20,30,60,0.06)'">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">${roleIcon}</span>
              <div>
                <h4 style="margin:0; color:#0b0838; font-size:16px;">${u.name}</h4>
                <p style="margin:4px 0; color:#99a0ac; font-size:12px;">${u.email}</p>
              </div>
            </div>
            <span style="background:${roleColor}; color:white; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; text-transform:uppercase;">${u.role}</span>
          </div>
          
          <div style="background:#f5f5f5; padding:12px; border-radius:8px; margin-bottom:12px; font-size:13px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div><span style="color:#99a0ac;">Age:</span> <strong style="color:#0b0838;">${u.profile?.age || 'N/A'}</strong></div>
              <div><span style="color:#99a0ac;">Height:</span> <strong style="color:#0b0838;">${u.profile?.height || 'N/A'}</strong></div>
              <div><span style="color:#99a0ac;">Weight:</span> <strong style="color:#0b0838;">${u.profile?.weight || 'N/A'}</strong></div>
              <div><span style="color:#99a0ac;">Joined:</span> <strong style="color:#0b0838;">${new Date(u.createdAt).toLocaleDateString()}</strong></div>
            </div>
          </div>
          
          <div style="display:flex; gap:8px;">
            <button onclick="openEditUserModal('${u.id}', '${u.name}', '${u.email}', '${u.role}')" style="flex:1; background:#2b67ff; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:background 0.2s;">✏️ Edit</button>
            <button onclick="changeUserRole('${u.id}', '${u.role}')" style="flex:1; background:#ff9800; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:background 0.2s;">🔄 Role</button>
            <button onclick="confirmDeleteUser('${u.id}', '${u.name}')" style="flex:1; background:#d32f2f; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:background 0.2s;">🗑️ Delete</button>
          </div>
        </div>
      `;
    });
    gridDiv.innerHTML = html;
  } catch (err) {
    console.error('Load users failed:', err);
    document.getElementById('users-grid').innerHTML = '<p style="grid-column:1/-1; color:red; text-align:center;">Failed to load users.</p>';
  }
}

function openEditUserModal(userId, name, email, role) {
  const modal = document.getElementById('user-modal');
  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <form style="display:flex; flex-direction:column; gap:12px;" onsubmit="handleUpdateUser(event, '${userId}')">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="edit-name" value="${name}" required style="width:100%; padding:10px; border:1px solid #efeff2; border-radius:8px; font-size:14px;">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="edit-email" value="${email}" required style="width:100%; padding:10px; border:1px solid #efeff2; border-radius:8px; font-size:14px;">
      </div>
      <div class="form-group">
        <label>Role</label>
        <select id="edit-role" value="${role}" style="width:100%; padding:10px; border:1px solid #efeff2; border-radius:8px; font-size:14px;">
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div style="display:flex; gap:10px; margin-top:16px;">
        <button type="submit" style="flex:1; background:#2b67ff; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:600; font-size:14px;">Save Changes</button>
        <button type="button" onclick="closeUserModal()" style="flex:1; background:#e6e9ef; color:#0b0838; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:600; font-size:14px;">Cancel</button>
      </div>
    </form>
  `;
  modal.style.display = 'flex';
}

function closeUserModal() {
  document.getElementById('user-modal').style.display = 'none';
}

async function handleUpdateUser(event, userId) {
  event.preventDefault();
  const name = document.getElementById('edit-name').value;
  const email = document.getElementById('edit-email').value;
  const role = document.getElementById('edit-role').value;
  
  try {
    await apiCall(`/auth/users/${userId}`, 'PUT', { name, email, role });
    alert('User updated successfully!');
    closeUserModal();
    loadUsers();
  } catch (err) {
    console.error('Update failed:', err);
    alert('Failed to update user: ' + err.message);
  }
}

async function changeUserRole(userId, currentRole) {
  const roles = ['patient', 'doctor', 'admin'];
  const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
  const confirm_msg = `Change user role from "${currentRole}" to "${nextRole}"?`;
  
  if (confirm(confirm_msg)) {
    try {
      await apiCall(`/auth/users/${userId}`, 'PUT', { role: nextRole });
      alert(`Role changed to ${nextRole}!`);
      loadUsers();
    } catch (err) {
      console.error('Role change failed:', err);
      alert('Failed to change role: ' + err.message);
    }
  }
}

function confirmDeleteUser(userId, userName) {
  if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
    deleteUser(userId, userName);
  }
}

async function deleteUser(userId, userName) {
  try {
    await apiCall(`/auth/users/${userId}`, 'DELETE');
    alert(`User "${userName}" deleted successfully!`);
    loadUsers();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete user: ' + err.message);
  }
}

async function loadComplaints() {
  try {
    const complaints = await apiCall('/complaints', 'GET');
    const listDiv = document.getElementById('complaints-list');
    if (complaints.length === 0) {
      listDiv.innerHTML = '<div style="text-align:center; color:#99a0ac; padding:40px;">No complaints found.</div>';
      return;
    }
    let html = '<div style="display:grid; gap:12px;">';
    complaints.forEach(c => {
      const statusColor = c.status === 'pending' ? '#ff9800' : c.status === 'resolved' ? '#4caf50' : '#99a0ac';
      const statusIcon = c.status === 'pending' ? '⏳' : c.status === 'resolved' ? '✅' : '❓';
      html += `
        <div style="background:white; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(20,30,60,0.06); border-left:4px solid ${statusColor};">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-size:12px; color:#99a0ac; margin-bottom:4px;">${new Date(c.createdAt).toLocaleString()}</div>
              <p style="margin:0; color:#0b0838; line-height:1.5;">${c.message}</p>
            </div>
            <span style="background:${statusColor}; color:white; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; text-transform:uppercase; margin-left:12px; white-space:nowrap;">${statusIcon} ${c.status}</span>
          </div>
          ${c.user ? `<div style="background:#f5f5f5; padding:8px 12px; border-radius:8px; font-size:12px; color:#0b0838;"><strong>User:</strong> ${c.user.name} (${c.user.email}) • <strong>Role:</strong> ${c.user.role}</div>` : ''}
        </div>
      `;
    });
    html += '</div>';
    listDiv.innerHTML = html;
  } catch (err) {
    console.error('Load complaints failed:', err);
    document.getElementById('complaints-list').innerHTML = '<p style="color:red; text-align:center;">Failed to load complaints.</p>';
  }
}

// ===== OTHER PAGES (STUB) =====
function renderSymptoms() {
  return `${renderHeader()}${renderNav()}<main class="container"><div class="card"><h2>Symptoms</h2><p>Track and manage your symptoms here.</p></div></main>${renderFooter()}`;
}

function attachSymptomsHandlers() {}

function renderReminders() {
  return `${renderHeader()}${renderNav()}<main class="container"><div class="card"><h2>Reminders</h2><p>Manage your health reminders.</p></div></main>${renderFooter()}`;
}

function attachRemindersHandlers() {}

function renderDevices() {
  return `${renderHeader()}${renderNav()}<main class="container"><div class="card"><h2>Devices</h2><p>Connect and manage your wearable devices.</p></div></main>${renderFooter()}`;
}

function attachDevicesHandlers() {}

function renderVitals() {
  return `${renderHeader()}${renderNav()}<main class="container"><div class="card"><h2>Vitals</h2><p>View your vital signs.</p></div></main>${renderFooter()}`;
}

function renderNutrition() {
  return `${renderHeader()}${renderNav()}<main class="container"><div class="card"><h2>Nutrition</h2><p>Track your nutrition intake.</p></div></main>${renderFooter()}`;
}

function renderReports() {
  return `${renderHeader()}${renderNav()}<main class="container"><div class="card"><h2>Reports</h2><p>View your health reports.</p></div></main>${renderFooter()}`;
}

function renderComplaints() {
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="card">
        <h2>Complaints</h2>
        <p>Submit a complaint or view your complaints.</p>
        <div class="form-group">
          <label>Message</label>
          <textarea id="complaint-message" placeholder="Describe your complaint..."></textarea>
        </div>
        <button id="submit-complaint-btn" class="btn primary">Submit Complaint</button>
        <div id="complaints-list" style="margin-top:20px;"></div>
      </div>
    </main>${renderFooter()}`;
}

function attachComplaintsHandlers() {
  document.getElementById('submit-complaint-btn').addEventListener('click', async () => {
    const message = document.getElementById('complaint-message').value.trim();
    if (!message) {
      alert('Please enter a message');
      return;
    }
    try {
      await apiCall('/complaints', 'POST', { message });
      alert('Complaint submitted successfully');
      document.getElementById('complaint-message').value = '';
      loadComplaints();
    } catch (err) {
      console.error('Submit complaint failed:', err);
    }
  });
  loadComplaints();
}

async function loadComplaints() {
  try {
    const complaints = await apiCall('/complaints', 'GET');
    const listDiv = document.getElementById('complaints-list');
    if (complaints.length === 0) {
      listDiv.innerHTML = '<p>No complaints found.</p>';
      return;
    }
    let html = '<h3>Your Complaints</h3><ul>';
    complaints.forEach(c => {
      html += `<li><strong>${new Date(c.createdAt).toLocaleString()}</strong>: ${c.message} (${c.status})`;
      if (currentUser.role === 'admin' && c.user) {
        html += ` - User: ${c.user.name} (${c.user.email}, ${c.user.role})`;
      }
      html += '</li>';
    });
    html += '</ul>';
    listDiv.innerHTML = html;
  } catch (err) {
    console.error('Load complaints failed:', err);
  }
}

function renderProfile() {
  if (!currentUser || !currentUser.profile) {
    return `<div class="container"><p>Loading profile...</p></div>`;
  }
  const profile = currentUser.profile || {};
  return `${renderHeader()}${renderNav()}
    <main class="container">
      <div class="card">
        <h2>Profile Settings</h2>
        <hr style="margin:16px 0; border:none; border-top:1px solid #e0e0e0;">
        
        <form id="profile-form">
          <div class="form-section" style="margin-bottom:24px;">
            <h3 style="margin-bottom:16px;">Personal Information</h3>
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="profile-name" value="${currentUser.name || ''}" placeholder="Enter your full name">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" value="${currentUser.email || ''}" disabled style="background-color:#f5f5f5; cursor:not-allowed;">
            </div>
            <div class="form-group">
              <label>Role</label>
              <input type="text" value="${({patient: 'Patient', doctor: 'Doctor', admin: 'Administrator'}[currentUser.role] || 'User')}" disabled style="background-color:#f5f5f5; cursor:not-allowed;">
            </div>
          </div>
          
          <div class="form-section" style="margin-bottom:24px;">
            <h3 style="margin-bottom:16px;">Health Information</h3>
            <div class="form-group" style="display:inline-block; width:48%; margin-right:4%;">
              <label>Age (years)</label>
              <input type="number" id="profile-age" value="${profile.age || ''}" min="0" max="150" placeholder="Enter your age">
            </div>
            <div class="form-group" style="display:inline-block; width:48%;">
              <label>Blood Type</label>
              <select id="profile-bloodType">
                <option value="">-- Select Blood Type --</option>
                <option value="O+" ${profile.bloodType === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${profile.bloodType === 'O-' ? 'selected' : ''}>O-</option>
                <option value="A+" ${profile.bloodType === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${profile.bloodType === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${profile.bloodType === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${profile.bloodType === 'B-' ? 'selected' : ''}>B-</option>
                <option value="AB+" ${profile.bloodType === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${profile.bloodType === 'AB-' ? 'selected' : ''}>AB-</option>
              </select>
            </div>
            
            <div class="form-group" style="display:inline-block; width:32%; margin-right:2%;">
              <label>Height (cm)</label>
              <input type="number" id="profile-height" value="${profile.height || ''}" min="0" placeholder="cm">
            </div>
            <div class="form-group" style="display:inline-block; width:32%; margin-right:2%;">
              <label>Weight (kg)</label>
              <input type="number" id="profile-weight" value="${profile.weight || ''}" min="0" placeholder="kg" step="0.1">
            </div>
            <div class="form-group" style="display:inline-block; width:32%;">
              <label>Phone Number</label>
              <input type="tel" id="profile-phone" value="${profile.phoneNumber || ''}" placeholder="+1 (555) 000-0000">
            </div>
            
            <div class="form-group">
              <label>Allergies</label>
              <textarea id="profile-allergies" placeholder="List any known allergies (e.g., Penicillin, Peanuts)" style="min-height:60px;">${profile.allergies || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label>Current Medications</label>
              <textarea id="profile-medications" placeholder="List current medications with dosages" style="min-height:60px;">${profile.medications || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label>Medical History</label>
              <textarea id="profile-history" placeholder="Relevant medical history, conditions, surgeries, etc." style="min-height:80px;">${profile.medicalHistory || ''}</textarea>
            </div>
          </div>
          
          <div class="form-section">
            <h3 style="margin-bottom:16px;">Emergency Contact</h3>
            <div class="form-group">
              <label>Emergency Contact</label>
              <input type="text" id="profile-emergency" value="${profile.emergencyContact || ''}" placeholder="Name and phone number of emergency contact">
            </div>
          </div>
          
          <div style="margin-top:24px; display:flex; gap:12px;">
            <button type="submit" class="btn primary">Save Profile</button>
            <button type="button" class="btn" id="cancel-profile" style="background-color:#f5f5f5; color:#333;">Cancel</button>
            <button type="button" class="btn primary" id="logout-btn" style="background-color:#d32f2f; margin-left:auto;">Logout</button>
          </div>
        </form>
      </div>
    </main>
    ${renderFooter()}`;
}

function attachProfileHandlers() {
  if (!currentUser.profile) {
    // Load user profile data first
    (async () => {
      try {
        const userData = await apiCall(`/auth/${currentUser.id}`, 'GET');
        currentUser = userData;
        // Re-render to show the loaded data
        render();
      } catch (err) {
        if (err.message.includes('404') || err.message.includes('not found') || err.message.includes('Unauthorized')) {
          console.error('User account not found or deleted. Logging out...');
          alert('Your account was not found. You have been logged out.');
          logout();
        } else {
          console.error('Failed to load profile:', err);
          alert('Failed to load profile data. Please try again.');
          navigate('dashboard');
        }
      }
    })();
  } else {
    // Profile already loaded, attach handlers
    attachProfileFormHandlers();
  }
}

function attachProfileFormHandlers() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
  });
  
  document.getElementById('cancel-profile').addEventListener('click', () => {
    navigate('dashboard');
  });
  
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const profileData = {
        name: document.getElementById('profile-name').value,
        profile: {
          age: document.getElementById('profile-age').value ? parseInt(document.getElementById('profile-age').value) : null,
          height: document.getElementById('profile-height').value ? parseInt(document.getElementById('profile-height').value) : null,
          weight: document.getElementById('profile-weight').value ? parseFloat(document.getElementById('profile-weight').value) : null,
          bloodType: document.getElementById('profile-bloodType').value,
          phoneNumber: document.getElementById('profile-phone').value,
          allergies: document.getElementById('profile-allergies').value,
          medications: document.getElementById('profile-medications').value,
          medicalHistory: document.getElementById('profile-history').value,
          emergencyContact: document.getElementById('profile-emergency').value
        }
      };
      
      const result = await apiCall(`/auth/${currentUser.id}/profile`, 'PUT', profileData);
      currentUser = result;
      alert('Profile saved successfully!');
      navigate('profile');
    } catch (err) {
      alert('Error saving profile: ' + err.message);
    }
  });
}

// ===== SHARED COMPONENTS =====
function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  navigate('login');
}

function renderHeader() {
  const roleLabel = currentUser ? ({ patient: 'Patient', doctor: 'Doctor', admin: 'Administrator' }[currentUser.role] || 'User') : 'User';
  return `
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo">
          <span class="logo-icon">💙</span>
          <div class="branding">
            <div class="app-title">Healthcare Virtual Assistant</div>
            <div class="app-sub">Welcome, ${roleLabel}</div>
          </div>
        </div>
      </div>
      <div class="topbar-right">
        <button class="logout" onclick="navigate('profile')">Profile ⟶</button>
        <button class="logout" onclick="logout()" style="background-color:#d32f2f; color:white; margin-left:8px; padding:8px 16px; border:none; border-radius:4px; cursor:pointer;">Logout</button>
      </div>
    </header>
  `;
}

function renderNav() {
  return `
    <nav class="main-nav" aria-label="Primary">
      <div class="nav-scroll">
        <button class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" onclick="navigate('dashboard')">📈 Dashboard</button>
        <button class="nav-item ${currentPage === 'symptoms' ? 'active' : ''}" onclick="navigate('symptoms')">🩺 Symptoms</button>
        <button class="nav-item ${currentPage === 'reminders' ? 'active' : ''}" onclick="navigate('reminders')">🔔 Reminders</button>
        <button class="nav-item ${currentPage === 'devices' ? 'active' : ''}" onclick="navigate('devices')">⌚ Devices</button>
        <button class="nav-item ${currentPage === 'vitals' ? 'active' : ''}" onclick="navigate('vitals')">❤️ Vitals</button>
        <button class="nav-item ${currentPage === 'nutrition' ? 'active' : ''}" onclick="navigate('nutrition')">🍽️ Nutrition</button>
        <button class="nav-item ${currentPage === 'reports' ? 'active' : ''}" onclick="navigate('reports')">📊 Reports</button>
        <button class="nav-item ${currentPage === 'complaints' ? 'active' : ''}" onclick="navigate('complaints')">📝 Complaints</button>
      </div>
    </nav>
  `;
}

function renderFooter() {
  return `<footer class="site-footer">&copy; 2026 Healthcare Virtual Assistant</footer>`;
}

// Validate session on page load
async function validateSession() {
  console.log('validateSession called, authToken exists:', !!authToken);
  
  if (!authToken) {
    console.log('No token found, showing login');
    currentPage = 'login';
    render();
    return;
  }
  
  // If we have token and currentUser data, just show dashboard
  // Actual validation will happen when making API calls
  if (currentUser && currentUser.id) {
    console.log('CurrentUser exists, showing dashboard:', currentUser.id);
    currentPage = 'dashboard';
    render();
    return;
  }
  
  // Token exists but no currentUser - try to restore from backend
  console.log('Token exists but no currentUser, fetching profile...');
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Profile response status:', response.status);
    
    if (response.status === 401 || response.status === 404) {
      console.error('User not found (401/404), clearing session');
      authToken = null;
      currentUser = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      currentPage = 'login';
      render();
      return;
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    // Session valid - update currentUser
    const userData = await response.json();
    console.log('Profile data received, setting currentUser');
    currentUser = {
      id: userData.id,
      role: userData.role,
      email: userData.email,
      name: userData.name,
      profile: userData.profile
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    currentPage = 'dashboard';
    render();
  } catch (err) {
    console.error('Session validation error:', err.message);
    // If fetch fails, just show login
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    currentPage = 'login';
    render();
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
  // Clear invalid tokens
  if (authToken && typeof authToken !== 'string') {
    authToken = null;
    localStorage.removeItem('authToken');
  }
  
  // Validate and restore session
  validateSession();
});
