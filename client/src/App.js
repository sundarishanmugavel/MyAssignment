import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [user, setUser] = useState(null);
  
  // CRUD States
  const [projects, setProjects] = useState([]);
  const [newProj, setNewProj] = useState({ title: '', description: '' });

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedToken && savedUser) {
      setUser(savedUser);
      fetchProjects(savedUser.id);
    }
  }, []);

  
  const fetchProjects = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/projects/${userId}`);
      setProjects(res.data);
    } catch (err) {
      console.log("Error fetching projects");
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // 1. Frontend Validation
  if (!formData.email || !formData.password) {
    return alert("Please fill in all required fields.");
  }

  // Password length check for security
  if (formData.password.length < 6) {
    return alert("Password must be at least 6 characters long.");
  }

  // Name check only during Signup
  if (!isLogin && !formData.name) {
    return alert("Please enter your full name for signup.");
  }

  const url = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/signup';
  
  try {
    const res = await axios.post(url, formData);
    
    if (isLogin) {
      // --- LOGIN SUCCESS LOGIC ---
      alert(res.data.message);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        
        // Mapping MongoDB _id to frontend id for consistency
        const userData = {
          id: res.data.user._id, 
          name: res.data.user.name,
          email: res.data.user.email
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        // Fetching user specific projects (Like LabLink or KrishiLease data)
        fetchProjects(userData.id);
      }
    } else {
      // --- SIGNUP SUCCESS LOGIC ---
      alert("Registration Successful! Redirecting to Login...");
      
      // Automatic redirection to Login View
      setIsLogin(true); 
      
      // Clearing password field for better User Experience (UX)
      setFormData({ ...formData, password: '' }); 
    }

  } catch (err) {
    // 2. Error Handling (Handling Duplicate Emails & Server Errors)
    if (err.response && err.response.status === 409) {
      alert("Notice: Email already registered. Please login.");
    } else {
      alert("Error: " + (err.response?.data?.message || "Something went wrong. Please try again."));
    }
  }
};

  // CREATE
  const addProject = async () => {
    if(!newProj.title) return alert("Title is required!");
    try {
      const res = await axios.post('http://localhost:5000/api/projects', { 
        ...newProj, 
        userId: user.id 
      });
      setProjects([...projects, res.data]);
      setNewProj({ title: '', description: '' });
    } catch (err) {
      alert("Failed to add project");
    }
  };

  // DELETE
  const deleteProject = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/projects/${id}`);
      setProjects(projects.filter(p => p._id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  // --- Dashboard View ---
  if (user) {
    return (
      <div className="container gradient-bg">
        <div className="card dashboard-card">
          <h1 className="title">Project Manager</h1>
          <p>Welcome, <b>{user.name}</b>!</p>

          {/* Add Section */}
          <div className="add-section">
            <input 
              type="text" placeholder="Project Name (e.g. LabLink)" className="input-field"
              value={newProj.title} onChange={(e) => setNewProj({...newProj, title: e.target.value})}
            />
            <input 
              type="text" placeholder="Brief Description" className="input-field"
              value={newProj.description} onChange={(e) => setNewProj({...newProj, description: e.target.value})}
            />
            <button onClick={addProject} className="btn add-btn">Add Project</button>
          </div>

          {/* List Section */}
          <div className="project-list">
            <h3 className='proj'>MY PROJECTS:</h3>
            {projects.length === 0 && <p className="empty-text">No projects added yet.</p>}
            {projects.map((p) => (
              <div key={p._id} className="project-item">
                <div className="item-text">
                  <strong>{p.title}</strong>
                  <p>{p.description}</p>
                </div>
                <button onClick={() => deleteProject(p._id)} className="delete-btn">🗑️</button>
              </div>
            ))}
          </div>

          <button onClick={handleLogout} className="btn logout-btn">Logout</button>
        </div>
      </div>
    );
  }

  //Login/Signup View 
  return (
    <div className="container gradient-bg">
      <div className="card">
        <h1 className="title">{isLogin ? 'Login' : 'Signup'}</h1>
        <form onSubmit={handleSubmit} className="form-group">
          {!isLogin && (
            <input type="text" placeholder="Full Name" className="input-field"
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
          )}
          <input type="email" placeholder="Email Address" className="input-field"
            onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" className="input-field"
            onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button type="submit" className="btn submit-btn">{isLogin ? 'Login' : 'Signup'}</button>
        </form>
        <p className="toggle-text" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Signup" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}

export default App;