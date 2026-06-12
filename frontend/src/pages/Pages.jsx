import { Link, useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { coursesAPI, recommendationsAPI, modulesAPI, eventsAPI } from '../api.js'
import Spinner from '../components/common/Spinner.jsx'
import toast from 'react-hot-toast'
import {
  BookOpen, TrendingUp, Star, ArrowRight, Search,
  Users, CheckCircle, Lock, Play, Clock, ArrowLeft
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card" style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
      <div style={{ width:48, height:48, borderRadius:'var(--radius)',
        background:color+'20', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize:'1.5rem', fontWeight:700 }}>{value}</div>
        <div style={{ fontSize:'.8rem', color:'var(--gray-400)' }}>{label}</div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useSelector(s => s.auth)

  const { data: myCourses, isLoading: lc } = useQuery({
    queryKey: ['myCourses'],
    queryFn:  () => coursesAPI.getMy().then(r => r.data.data.courses)
  })

  const { data: recs, isLoading: lr } = useQuery({
    queryKey: ['recommendations'],
    queryFn:  () => recommendationsAPI.get({ limit: 4 }).then(r => r.data.data)
  })

  const enrolled  = myCourses?.length || 0
  const completed = myCourses?.filter(p => p.completionPercentage === 100).length || 0
  const avgProg   = myCourses?.length
    ? Math.round(myCourses.reduce((s,p) => s+(p.completionPercentage||0), 0) / myCourses.length) : 0

  return (
    <div>
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:700 }}>
          Welcome back, {user?.profile?.firstName || 'Student'} 👋
        </h1>
        <p style={{ color:'var(--gray-400)', marginTop:'.25rem' }}>Here's your learning overview.</p>
      </div>

      <div className="grid-3" style={{ marginBottom:'2rem' }}>
        <StatCard icon={BookOpen}   label="Enrolled"     value={enrolled}       color="#6366f1" />
        <StatCard icon={Star}       label="Completed"    value={completed}      color="#22c55e" />
        <StatCard icon={TrendingUp} label="Avg progress" value={`${avgProg}%`}  color="#f59e0b" />
      </div>

      <div style={{ marginBottom:'2rem' }}>
        <h2 className="section-title">Recommended for you</h2>
        {lr ? <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}><Spinner /></div>
          : recs?.recommendations?.length ? (
            <div className="grid-3">
              {recs.recommendations.map((rec, i) => (
                <div key={i} className="card" style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span className="badge badge-purple">{rec.type}</span>
                    <span style={{ fontSize:'.75rem', color:'var(--gray-400)' }}>~{rec.estimatedMinutes}m</span>
                  </div>
                  <div style={{ fontWeight:600 }}>{rec.title}</div>
                  <div style={{ fontSize:'.8rem', color:'var(--gray-400)' }}>{rec.reason}</div>
                  <Link to={`/courses/${rec.courseId}/modules/${rec.moduleId}`}
                    className="btn btn-outline btn-sm" style={{ alignSelf:'flex-start' }}>
                    Start <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <BookOpen size={40} />
              <p>Enroll in a course to get recommendations</p>
              <Link to="/courses" className="btn btn-primary btn-sm" style={{ marginTop:'1rem' }}>
                Browse courses
              </Link>
            </div>
          )}
      </div>

      <div>
        <h2 className="section-title">My courses</h2>
        {lc ? <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}><Spinner /></div>
          : myCourses?.length ? (
            <div className="grid-2">
              {myCourses.map(p => (
                <Link key={p._id} to={`/courses/${p.courseId?._id}`} className="card"
                  style={{ display:'block', cursor:'pointer' }}>
                  <div style={{ fontWeight:600, marginBottom:'.25rem' }}>{p.courseId?.title}</div>
                  <span className="badge badge-gray">{p.courseId?.category}</span>
                  <div style={{ marginTop:'.75rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      fontSize:'.75rem', color:'var(--gray-400)', marginBottom:'.25rem' }}>
                      <span>Progress</span><span>{p.completionPercentage||0}%</span>
                    </div>
                    <div style={{ height:6, background:'var(--gray-100)', borderRadius:9999 }}>
                      <div style={{ height:'100%', borderRadius:9999, background:'var(--primary)',
                        width:`${p.completionPercentage||0}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <BookOpen size={40} />
              <p>No courses yet</p>
              <Link to="/courses" className="btn btn-primary btn-sm" style={{ marginTop:'1rem' }}>
                Explore courses
              </Link>
            </div>
          )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COURSES LIST
// ══════════════════════════════════════════════════════════════
const CATS   = ['all','programming','design','marketing','data-science','business','other']
const LEVELS = ['all','beginner','intermediate','advanced']

export function CoursesPage() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [level,    setLevel]    = useState('all')

  const params = {}
  if (search)            params.search   = search
  if (category !== 'all') params.category = category
  if (level    !== 'all') params.level    = level

  const { data, isLoading } = useQuery({
    queryKey: ['courses', params],
    queryFn:  () => coursesAPI.getAll(params).then(r => r.data.data),
    keepPreviousData: true
  })

  const pill = active => ({
    padding:'.375rem .875rem', borderRadius:9999, fontSize:'.8rem', fontWeight:500,
    cursor:'pointer', border:'1.5px solid',
    borderColor: active ? 'var(--primary)' : 'var(--gray-200)',
    background:  active ? 'var(--primary-light)' : '#fff',
    color:       active ? 'var(--primary-dark)' : 'var(--gray-600)'
  })

  return (
    <div>
      <h1 className="page-title">All Courses</h1>
      <div style={{ position:'relative', maxWidth:400, marginBottom:'1.25rem' }}>
        <Search size={16} style={{ position:'absolute', left:'.75rem', top:'50%',
          transform:'translateY(-50%)', color:'var(--gray-400)' }} />
        <input className="form-input" placeholder="Search courses…"
          style={{ paddingLeft:'2.25rem', width:'100%' }}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {CATS.map(c => <button key={c} style={pill(category===c)} onClick={() => setCategory(c)}>
          {c[0].toUpperCase()+c.slice(1)}</button>)}
        <div style={{ width:1, background:'var(--gray-200)', margin:'0 .25rem' }} />
        {LEVELS.map(l => <button key={l} style={pill(level===l)} onClick={() => setLevel(l)}>
          {l[0].toUpperCase()+l.slice(1)}</button>)}
      </div>

      {isLoading
        ? <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><Spinner /></div>
        : data?.courses?.length
          ? <div className="grid-3">
              {data.courses.map(c => (
                <Link key={c._id} to={`/courses/${c._id}`} className="card"
                  style={{ display:'flex', flexDirection:'column', gap:'.75rem', cursor:'pointer' }}>
                  <div style={{ height:130, borderRadius:'calc(var(--radius) - 4px)',
                    background:'linear-gradient(135deg,var(--primary),#818cf8)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <BookOpen size={36} color="rgba(255,255,255,.7)" />
                  </div>
                  <div style={{ display:'flex', gap:'.4rem' }}>
                    <span className="badge badge-purple">{c.category}</span>
                    <span className={`badge badge-${c.level==='beginner'?'green':c.level==='intermediate'?'amber':'gray'}`}>
                      {c.level}</span>
                  </div>
                  <div style={{ fontWeight:600, fontSize:'.95rem' }}>{c.title}</div>
                  <div style={{ fontSize:'.8rem', color:'var(--gray-400)', lineHeight:1.5,
                    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {c.description}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    paddingTop:'.5rem', borderTop:'1px solid var(--gray-100)',
                    fontSize:'.8rem', color:'var(--gray-400)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:'.3rem' }}>
                      <Users size={13}/>{c.enrollmentCount}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:'.3rem' }}>
                      <Star size={13} color="#f59e0b" fill="#f59e0b"/>
                      {c.averageRating?.toFixed(1)||'—'}</span>
                  </div>
                </Link>
              ))}
            </div>
          : <div className="empty-state card"><BookOpen size={40}/><p>No courses found</p></div>
      }
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COURSE DETAIL
// ══════════════════════════════════════════════════════════════
export function CourseDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const qc          = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn:  () => coursesAPI.getById(id).then(r => r.data.data)
  })

  const enroll = useMutation({
    mutationFn: () => coursesAPI.enroll(id),
    onSuccess: () => {
      toast.success('Enrolled!')
      qc.invalidateQueries({ queryKey: ['course', id] })
      qc.invalidateQueries({ queryKey: ['myCourses'] })
    },
    onError: e => toast.error(e.response?.data?.message || 'Error')
  })

  if (isLoading) return <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><Spinner /></div>
  if (!data) return <div className="empty-state">Course not found</div>

  const { course, progress } = data
  const isEnrolled = !!progress

  const getStatus = mid => {
    if (!progress) return 'locked'
    return progress.moduleProgress?.find(m => m.moduleId?.toString() === mid)?.status || 'not_started'
  }

  return (
    <div>
      <div className="card" style={{ marginBottom:'1.5rem',
        background:'linear-gradient(135deg,var(--primary),#818cf8)', color:'#fff' }}>
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'.75rem' }}>
          <span style={{ background:'rgba(255,255,255,.2)', padding:'.2rem .65rem',
            borderRadius:9999, fontSize:'.75rem' }}>{course.category}</span>
          <span style={{ background:'rgba(255,255,255,.2)', padding:'.2rem .65rem',
            borderRadius:9999, fontSize:'.75rem' }}>{course.level}</span>
        </div>
        <h1 style={{ fontSize:'1.75rem', fontWeight:700, marginBottom:'.5rem' }}>{course.title}</h1>
        <p style={{ opacity:.85, lineHeight:1.6, marginBottom:'1rem' }}>{course.description}</p>
        <div style={{ display:'flex', gap:'1.5rem', fontSize:'.875rem', opacity:.85 }}>
          <span style={{ display:'flex', alignItems:'center', gap:'.35rem' }}>
            <Users size={14}/>{course.enrollmentCount} students</span>
          <span style={{ display:'flex', alignItems:'center', gap:'.35rem' }}>
            <BookOpen size={14}/>{course.modules?.length} modules</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.5rem', alignItems:'start' }}>
        <div className="card">
          <h2 className="section-title">Course content</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
            {course.modules?.map((m, idx) => {
              const mod    = m.moduleId
              const status = getStatus(mod?._id)
              const done   = status === 'completed'
              return (
                <div key={mod?._id||idx} style={{
                  display:'flex', alignItems:'center', gap:'.75rem', padding:'.75rem',
                  borderRadius:'calc(var(--radius) - 4px)',
                  background: done ? '#f0fdf4' : 'var(--gray-50)',
                  border:`1px solid ${done?'#bbf7d0':'var(--gray-100)'}`
                }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
                    background:done?'var(--success)':'var(--gray-200)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {done ? <CheckCircle size={16} color="#fff"/>
                      : isEnrolled ? <Play size={14} color="var(--gray-600)"/>
                      : <Lock size={14} color="var(--gray-400)"/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:'.9rem' }}>{idx+1}. {mod?.title}</div>
                    <div style={{ display:'flex', gap:'.5rem', marginTop:'.2rem' }}>
                      <span className="badge badge-gray">{mod?.type}</span>
                      <span style={{ fontSize:'.75rem', color:'var(--gray-400)',
                        display:'flex', alignItems:'center', gap:'.2rem' }}>
                        <Clock size={11}/>{mod?.estimatedMinutes}m</span>
                    </div>
                  </div>
                  {isEnrolled && (
                    <button className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/courses/${id}/modules/${mod._id}`)}>
                      {done?'Review':'Start'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ position:'sticky', top:80 }}>
          {isEnrolled ? (
            <>
              <div style={{ marginBottom:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  fontSize:'.8rem', color:'var(--gray-400)', marginBottom:'.35rem' }}>
                  <span>Progress</span><span>{progress.completionPercentage}%</span>
                </div>
                <div style={{ height:8, background:'var(--gray-100)', borderRadius:9999 }}>
                  <div style={{ height:'100%', borderRadius:9999, background:'var(--primary)',
                    width:`${progress.completionPercentage}%` }} />
                </div>
              </div>
              <button className="btn btn-primary" style={{ width:'100%' }}
                onClick={() => {
                  const next = course.modules?.find(m => {
                    const s = getStatus(m.moduleId?._id)
                    return s === 'not_started' || s === 'in_progress'
                  })
                  if (next) navigate(`/courses/${id}/modules/${next.moduleId._id}`)
                  else toast('All done! 🎉')
                }}>Continue learning</button>
            </>
          ) : (
            <>
              <p style={{ fontSize:'.9rem', color:'var(--gray-600)', marginBottom:'1rem', lineHeight:1.6 }}>
                Enroll to access all {course.modules?.length} modules.
              </p>
              <button className="btn btn-primary" style={{ width:'100%' }}
                disabled={enroll.isPending} onClick={() => enroll.mutate()}>
                {enroll.isPending ? 'Enrolling…' : 'Enroll for free'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MODULE PLAYER
// ══════════════════════════════════════════════════════════════
function QuizModule({ content, onComplete }) {
  const [answers, setAnswers]     = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore]         = useState(0)

  const handleSubmit = () => {
    let correct = 0
    content.questions?.forEach((q, i) => { if (answers[i] === q.correct) correct++ })
    const pct = Math.round((correct / content.questions.length) * 100)
    setScore(pct); setSubmitted(true)
    if (pct >= 70) onComplete(pct)
  }

  return (
    <div style={{ maxWidth:680 }}>
      {content.questions?.map((q, qi) => (
        <div key={qi} className="card" style={{ marginBottom:'1rem' }}>
          <p style={{ fontWeight:600, marginBottom:'.75rem' }}>{qi+1}. {q.question}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
            {q.options?.map((opt, oi) => {
              const sel = answers[qi] === oi
              const ok  = submitted && oi === q.correct
              const bad = submitted && sel && oi !== q.correct
              return (
                <label key={oi} style={{
                  display:'flex', alignItems:'center', gap:'.6rem', padding:'.6rem .75rem',
                  borderRadius:'calc(var(--radius) - 4px)', cursor:submitted?'default':'pointer',
                  border:`1.5px solid ${ok?'#22c55e':bad?'#ef4444':sel?'var(--primary)':'var(--gray-200)'}`,
                  background: ok?'#f0fdf4':bad?'#fef2f2':sel?'var(--primary-light)':'#fff'
                }}>
                  <input type="radio" name={`q${qi}`} disabled={submitted}
                    checked={sel} onChange={() => setAnswers(p => ({ ...p, [qi]: oi }))} />
                  {opt}
                </label>
              )
            })}
          </div>
          {submitted && q.explanation && (
            <p style={{ marginTop:'.75rem', fontSize:'.85rem', color:'var(--gray-600)',
              background:'var(--gray-50)', padding:'.5rem .75rem',
              borderRadius:'calc(var(--radius) - 4px)' }}>💡 {q.explanation}</p>
          )}
        </div>
      ))}
      {!submitted
        ? <button className="btn btn-primary"
            disabled={Object.keys(answers).length < (content.questions?.length||0)}
            onClick={handleSubmit}>Submit answers</button>
        : <div className="card" style={{ textAlign:'center',
            background:score>=70?'#f0fdf4':'#fef2f2' }}>
            <div style={{ fontSize:'2rem', fontWeight:700,
              color:score>=70?'var(--success)':'var(--danger)' }}>{score}%</div>
            <p style={{ color:'var(--gray-600)', marginTop:'.25rem' }}>
              {score>=70?'✅ Passed!':'❌ Below 70%. Try again.'}</p>
          </div>
      }
    </div>
  )
}

export function ModulePage() {
  const { courseId, moduleId } = useParams()
  const qc = useQueryClient()
  const [startTime] = useState(Date.now())

  const { data, isLoading } = useQuery({
    queryKey: ['module', moduleId],
    queryFn:  () => modulesAPI.getById(moduleId).then(r => r.data.data.module)
  })

  const complete = useMutation({
    mutationFn: payload => modulesAPI.complete(courseId, moduleId, payload),
    onSuccess: () => {
      toast.success('Module completed! 🎉')
      qc.invalidateQueries({ queryKey: ['course', courseId] })
      qc.invalidateQueries({ queryKey: ['myCourses'] })
      qc.invalidateQueries({ queryKey: ['recommendations'] })
    }
  })

  const track = (eventType, payload = {}) =>
    eventsAPI.track({ moduleId, courseId, eventType, payload }).catch(() => {})

  const handleComplete = (score = null) => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    complete.mutate({ score, timeSpent })
  }

  useEffect(() => { if (data) track('view_start') }, [data])

  if (isLoading) return <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><Spinner /></div>
  if (!data)     return <div className="empty-state">Module not found</div>

  return (
    <div>
      <Link to={`/courses/${courseId}`} style={{ display:'inline-flex', alignItems:'center',
        gap:'.4rem', color:'var(--gray-600)', fontSize:'.875rem', marginBottom:'1.25rem' }}>
        <ArrowLeft size={16}/> Back to course
      </Link>

      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:700, marginBottom:'.4rem' }}>{data.title}</h1>
          <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
            <span className="badge badge-purple">{data.type}</span>
            <span style={{ display:'flex', alignItems:'center', gap:'.3rem',
              fontSize:'.8rem', color:'var(--gray-400)' }}>
              <Clock size={13}/>{data.estimatedMinutes} min</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => handleComplete()}
          disabled={complete.isPending}>
          <CheckCircle size={16}/>
          {complete.isPending ? 'Saving…' : 'Mark complete'}
        </button>
      </div>

      <div className="card">
        {data.type === 'video' && (
          <div style={{ background:'#000', borderRadius:'var(--radius)',
            aspectRatio:'16/9', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {data.content?.videoUrl
              ? <video controls style={{ width:'100%' }} src={data.content.videoUrl}
                  onEnded={() => track('view_end', { watchedSeconds: data.content.videoDuration })} />
              : <p style={{ color:'#fff', opacity:.5 }}>Video not available</p>}
          </div>
        )}
        {data.type === 'text' && (
          <div style={{ lineHeight:1.8, maxWidth:720 }}
            dangerouslySetInnerHTML={{ __html: data.content?.body || '<p>No content</p>' }} />
        )}
        {data.type === 'quiz' && (
          <QuizModule content={data.content} onComplete={handleComplete} />
        )}
        {data.type === 'code' && (
          <div style={{ textAlign:'center', padding:'2rem', color:'var(--gray-400)' }}>
            Code editor — coming soon
          </div>
        )}
      </div>
    </div>
  )
}
