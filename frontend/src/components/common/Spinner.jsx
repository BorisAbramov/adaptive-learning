export default function Spinner({ fullScreen, size = 32 }) {
  const spinner = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin .8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
  if (fullScreen) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      {spinner}
    </div>
  )
  return spinner
}
