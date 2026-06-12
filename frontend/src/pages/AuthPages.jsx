import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, register, clearError } from '../store/index.js'
import { BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

function AuthCard({ children, subtitle }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'var(--gray-50)', padding:'1rem' }}>
      <div className="card" style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'.5rem',
            color:'var(--primary)', fontWeight:700, fontSize:'1.4rem' }}>
            <BookOpen size={28} /> AdaptLearn
          </div>
          <p style={{ marginTop:'.5rem', color:'var(--gray-600)', fontSize:'.9rem' }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const [form, setForm] = useState({ email:'', password:'' })

  useEffect(() => { return () => dispatch(clearError()) }, [dispatch])
  useEffect(() => { if (error) toast.error(error) }, [error])

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    const res = await dispatch(login(form))
    if (login.fulfilled.match(res)) { toast.success('Welcome back!'); navigate('/dashboard') }
  }

  return (
    <AuthCard subtitle="Sign in to your account">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" required
            value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" required
            value={form.password} onChange={set('password')} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" type="submit"
          disabled={loading} style={{ width:'100%', marginTop:'.5rem' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'.875rem', color:'var(--gray-600)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color:'var(--primary)', fontWeight:500 }}>Sign up</Link>
      </p>
    </AuthCard>
  )
}

export function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'' })

  useEffect(() => { return () => dispatch(clearError()) }, [dispatch])
  useEffect(() => { if (error) toast.error(error) }, [error])

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password min 6 characters'); return }
    const res = await dispatch(register(form))
    if (register.fulfilled.match(res)) { toast.success('Account created!'); navigate('/dashboard') }
  }

  return (
    <AuthCard subtitle="Create your account">
      <form onSubmit={handleSubmit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
          <div className="form-group">
            <label className="form-label">First name</label>
            <input className="form-input" required value={form.firstName}
              onChange={set('firstName')} placeholder="Ivan" />
          </div>
          <div className="form-group">
            <label className="form-label">Last name</label>
            <input className="form-input" required value={form.lastName}
              onChange={set('lastName')} placeholder="Ivanov" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" required
            value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" required
            value={form.password} onChange={set('password')} placeholder="min 6 characters" />
        </div>
        <button className="btn btn-primary" type="submit"
          disabled={loading} style={{ width:'100%', marginTop:'.5rem' }}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'.875rem', color:'var(--gray-600)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color:'var(--primary)', fontWeight:500 }}>Sign in</Link>
      </p>
    </AuthCard>
  )
}
