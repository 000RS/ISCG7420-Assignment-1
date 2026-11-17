import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import api, { messageFromError } from './api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function login(event) {
    event.preventDefault(); setError('');
    try {
      const { data } = await api.post('login/', { username, password });
      localStorage.setItem('token', data.token);
      onLogin(data.user);
      navigate(data.user.is_staff ? '/dashboard' : '/doctors');
    } catch (err) { setError(messageFromError(err)); }
  }
  return <section className="panel narrow"><h2>Log in</h2><form onSubmit={login} className="stack"><label>Username<input value={username} onChange={e => setUsername(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button>Log in</button></form>{error && <p className="error">{error}</p>}<p>New patient? <Link to="/register">Register</Link></p></section>;
}

function Register({ onLogin }) {
  const [form, setForm] = useState({first_name: '', last_name: '', username: '', email: '', password: ''});
  const [error, setError] = useState(''); const navigate = useNavigate();
  async function register(e) { e.preventDefault(); setError(''); try { const { data } = await api.post('register/', form); localStorage.setItem('token', data.token); onLogin(data.user); navigate('/doctors'); } catch(err) { setError(messageFromError(err)); } }
  return <section className="panel narrow"><h2>Patient registration</h2><form onSubmit={register} className="stack">{['first_name','last_name','username','email','password'].map(key => <label key={key}>{key}<input type={key==='password' ? 'password' : key==='email' ? 'email' : 'text'} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} required={key!=='email'} /></label>)}<button>Create account</button></form>{error && <p className="error">{error}</p>}</section>;
}

function Doctors() {
  const [doctors,setDoctors] = useState([]); const [error,setError] = useState('');
  useEffect(() => { api.get('doctors/').then(r => setDoctors(r.data)).catch(e => setError(messageFromError(e))); }, []);
  return <section><h2>Our doctors</h2>{error && <p className="error">{error}</p>}<div className="cards">{doctors.map(d => <article className="panel" key={d.id}><h3>{d.name}</h3><p><strong>{d.specialization}</strong></p><p>{d.bio}</p><p>{d.email}</p><Link className="button-link" to={`/slots?doctor=${d.id}`}>Available appointments</Link></article>)}</div></section>;
}

function Slots({ user }) {
  const [slots,setSlots] = useState([]); const [reason,setReason] = useState({}); const [error,setError] = useState(''); const [success,setSuccess] = useState('');
  const query = new URLSearchParams(window.location.search).get('doctor');
  async function reload() { try { const r = await api.get('slots/', {params:query ? { doctor:query } : {}}); setSlots(r.data); } catch(e) { setError(messageFromError(e)); } }
  useEffect(() => { reload(); }, [query]);
  async function book(slot) { setError(''); setSuccess(''); try { await api.post('appointments/', {slot:slot.id, reason:reason[slot.id] || ''}); setSuccess('Appointment booked successfully.'); reload(); } catch(e) {setError(messageFromError(e));} }
  return <section><h2>Available slots</h2>{error && <p className="error">{error}</p>}{success && <p className="success">{success}</p>}<div className="cards">{slots.map(s => <article key={s.id} className="panel"><h3>{s.doctor_name}</h3><p>{s.date} | {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</p>{user && !user.is_staff ? <><textarea placeholder="Reason for appointment (optional)" value={reason[s.id] || ''} onChange={e => setReason({...reason,[s.id]:e.target.value})}/><button onClick={() => book(s)}>Book appointment</button></> : <p><Link to="/login">Log in as a patient to book</Link></p>}</article>)}</div>{slots.length===0 && <p>No available slots at present.</p>}</section>;
}

function MyAppointments() {
  const [items,setItems] = useState([]);const [error,setError] = useState('');const [notice,setNotice] = useState('');
  async function reload(){try{setItems((await api.get('appointments/')).data);}catch(e){setError(messageFromError(e));}}
  useEffect(() => {reload();},[]);
  async function changeReason(a){const reason=window.prompt('Update appointment reason:',a.reason);if(reason===null)return;try{await api.patch(`appointments/${a.id}/`,{reason});setNotice('Appointment updated.');reload();}catch(e){setError(messageFromError(e));}}
  async function cancel(a){if(!window.confirm('Cancel this appointment?'))return;try{await api.delete(`appointments/${a.id}/`);setNotice('Appointment cancelled.');reload();}catch(e){setError(messageFromError(e));}}
  return <section><h2>My appointments</h2>{error && <p className="error">{error}</p>}{notice && <p className="success">{notice}</p>}<div className="cards">{items.map(a => <article className="panel" key={a.id}><h3>{a.doctor_name}</h3><p>{a.date} at {a.start_time.slice(0,5)}</p><p>Status: {a.status}</p><p>{a.reason}</p><button onClick={()=>changeReason(a)}>Edit reason</button> <button className="danger" onClick={()=>cancel(a)}>Cancel</button></article>)}</div>{!items.length && <p>No appointments yet.</p>}</section>;
}

function Dashboard() {
  const [tab,setTab] = useState('doctors'); const [items,setItems]=useState([]); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const [form,setForm] = useState({}); const [editing,setEditing] = useState(null); const [doctorOptions,setDoctorOptions]=useState([]);
  async function reload(kind=tab){try{setItems((await api.get(`${kind}/`)).data);setError('');}catch(e){setError(messageFromError(e));}}
  useEffect(()=>{reload(tab);setForm({});setEditing(null);if(tab==='slots')api.get('doctors/').then(r=>setDoctorOptions(r.data)).catch(()=>{});},[tab]);
  const fields = {doctors:['name','specialization','phone','email','bio','active'],slots:['doctor','date','start_time','end_time','is_available']};
  function beginEdit(x){setEditing(x.id);setForm({...x});}
  async function save(e){e.preventDefault();setError('');try{const payload={...form};delete payload.id;delete payload.doctor_name;delete payload.patient_username; if(tab==='doctors'){delete payload.created_at;}if(tab==='slots'){delete payload.appointment;} if(editing){await api.patch(`${tab}/${editing}/`,payload);}else{await api.post(`${tab}/`,payload);}setNotice('Saved successfully.');setEditing(null);setForm({});reload();}catch(e){setError(messageFromError(e));}}
  async function remove(x){if(!window.confirm('Delete this record?'))return;try{await api.delete(`${tab}/${x.id}/`);reload();}catch(e){setError(messageFromError(e));}}
  async function editAppointment(x){const reason=window.prompt('Reason:',x.reason);if(reason===null)return;const status=window.prompt('Status (pending, confirmed, cancelled):',x.status);if(status===null)return;try{await api.patch(`appointments/${x.id}/`,{reason,status});reload();}catch(e){setError(messageFromError(e));}}
  async function togglePatient(x){try{await api.patch(`patients/${x.id}/`,{is_active:!x.is_active});reload();}catch(e){setError(messageFromError(e));}}
  return <section><h2>Clinic administration</h2><div className="tabs">{['doctors','slots','appointments','patients'].map(x=><button key={x} className={tab===x?'selected':''} onClick={()=>setTab(x)}>{x}</button>)}</div>{error && <p className="error">{error}</p>}{notice && <p className="success">{notice}</p>}{fields[tab] && <div className="panel"><h3>{editing ? 'Edit' : 'Add'} {tab==='doctors'?'doctor':'appointment slot'}</h3><form onSubmit={save} className="admin-form">{fields[tab].map(key=><label key={key}>{key}{key==='doctor' ? <select value={form.doctor??''} onChange={e=>setForm({...form,doctor:e.target.value})} required><option value="">Choose doctor ID</option>{/* doctor IDs can be obtained from Doctors tab */}{doctorOptions.map(d=><option key={d.id} value={d.id}>{d.name} (#{d.id})</option>)}</select> : key==='active'||key==='is_available'?<input type="checkbox" checked={form[key]??true} onChange={e=>setForm({...form,[key]:e.target.checked})}/>:<input type={key==='date'?'date':key.endsWith('time')?'time':key==='email'?'email':'text'} value={form[key]??''} onChange={e=>setForm({...form,[key]:e.target.value})} required={['name','specialization','phone','email','date','start_time','end_time'].includes(key)}/>}</label>)}<button>{editing?'Save changes':'Create'}</button>{editing && <button type="button" className="secondary" onClick={()=>{setEditing(null);setForm({});}}>Cancel edit</button>}</form></div>}<div className="cards">{items.map(x=><article key={x.id} className="panel"><h3>{x.name || x.username || x.doctor_name || `Slot #${x.id}`}</h3>{Object.entries(x).filter(([k])=>!['id','bio'].includes(k)).map(([k,v])=><p className="field" key={k}><strong>{k}:</strong> {String(v)}</p>)}{x.bio && <p>{x.bio}</p>}{fields[tab]?<><button onClick={()=>beginEdit(x)}>Edit</button> <button className="danger" onClick={()=>remove(x)}>Delete</button></>:tab==='appointments'?<><button onClick={()=>editAppointment(x)}>Edit</button> <button className="danger" onClick={()=>remove(x)}>Cancel booking</button></>:<button onClick={()=>togglePatient(x)}>{x.is_active?'Deactivate':'Activate'}</button>}</article>)}</div>{!items.length && <p>No records found.</p>}</section>;
}

function Private({ user, admin=false, children }){if(!user)return <Navigate to="/login" replace/>;if(admin&&!user.is_staff)return <Navigate to="/doctors" replace/>;return children;}
export default function App(){
  const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{if(!localStorage.getItem('token')){setLoading(false);return;}api.get('me/').then(r=>setUser(r.data)).catch(()=>localStorage.removeItem('token')).finally(()=>setLoading(false));},[]);
  async function logout(){try{await api.post('logout/');}catch(e){}localStorage.removeItem('token');setUser(null);}
  if(loading)return <main className="container">Checking login...</main>;
  return <><header><nav className="container nav"><Link className="brand" to="/">Piki Ora Medical Centre</Link><NavLink to="/doctors">Doctors</NavLink><NavLink to="/slots">Slots</NavLink>{user&&!user.is_staff&&<NavLink to="/appointments">My appointments</NavLink>}{user?.is_staff&&<NavLink to="/dashboard">Admin</NavLink>}{user?<><span className="welcome">Hi, {user.username}</span><button className="secondary" onClick={logout}>Logout</button></>:<><NavLink to="/login">Login</NavLink><NavLink to="/register">Register</NavLink></>}</nav></header><main className="container"><Routes><Route path="/" element={<section className="hero"><h1>Care, made simple.</h1><p>Find a doctor and manage your appointments online.</p><Link className="button-link" to="/doctors">Browse doctors</Link></section>}/><Route path="/login" element={user?<Navigate to={user.is_staff?'/dashboard':'/doctors'}/>:<Login onLogin={setUser}/>}/><Route path="/register" element={user?<Navigate to="/doctors"/>:<Register onLogin={setUser}/>}/><Route path="/doctors" element={<Doctors/>}/><Route path="/slots" element={<Slots user={user}/>}/><Route path="/appointments" element={<Private user={user}><MyAppointments/></Private>}/><Route path="/dashboard" element={<Private user={user} admin><Dashboard/></Private>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></main><footer className="container">Piki Ora | Appointment Management</footer></>;
}
