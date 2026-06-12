import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/index.js'
import { BookOpen, LayoutDashboard, LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses',   label: 'Courses',   icon: BookOpen }
]

export function Navbar() {
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await dispatch(logout())
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100,
      background:'#fff', borderBottom:'1px solid var(--gray-200)',
      height:60, display:'flex', alignItems:'center', padding:'0 2rem', gap:'2rem' }}>
      <Link to="/dashboard" style={{ display:'flex', alignItems:'center', gap:'.5rem',
        fontWeight:700, fontSize:'1.1rem', color:'var(--primary)' }}>
        <BookOpen size={22} /> AdaptLearn
      </Link>

      <div style={{ display:'flex', gap:'.25rem', flex:1 }}>
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to)
          return (
            <Link key={to} to={to} style={{
              display:'flex', alignItems:'center', gap:'.4rem',
              padding:'.4rem .85rem', borderRadius:'var(--radius)',
              fontSize:'.875rem', fontWeight: active ? 600 : 400,
              color: active ? 'var(--primary)' : 'var(--gray-600)',
              background: active ? 'var(--primary-light)' : 'transparent'
            }}><Icon size={16} />{label}</Link>
          )
        })}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
        <span style={{ display:'flex', alignItems:'center', gap:'.4rem',
          fontSize:'.875rem', color:'var(--gray-600)' }}>
          <User size={16} />{user?.profile?.firstName || user?.email}
        </span>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </nav>
  )
}
