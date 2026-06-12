import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar.jsx'

export default function Layout() {
  return (
    <div style={{ minHeight:'100vh' }}>
      <Navbar />
      <main style={{ paddingTop:60 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'2rem 1.5rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
