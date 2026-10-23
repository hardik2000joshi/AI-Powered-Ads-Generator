
import {Route, Routes } from 'react-router-dom'
import './App.css'
import { SIGNINPAGE } from './components/SIGNINPAGE'
import { Dashboard } from './components/Dashboard'
import { SIGNUPPAGE } from './components/SIGNUPPAGE'
import { Layout } from './layout'
import { Features } from './components/Features';
import { Pricing } from './components/Pricing'
import { Faq } from './components/Faq'
import { CTA } from './components/Cta'
import LenisScroll from './components/LenisScroll'
import { SoftBackdrop } from './components/SoftBackdrop'
import {Create} from "./components/CreatePage"
import Generation from './components/Generation'
import { Plan } from './components/Plan'
import { DashboardSidebar } from './components/LoginHomePage'
import GenerationResult from './components/GenerationResult'
import { AdminLogin } from './components/AdminLogin'
import { AdminDashboard } from './components/AdminDashboard'
import { useEffect } from 'react'
import { useAuth } from '@clerk/react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007'

function SyncSignedInUser() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let cancelled = false

    async function syncUser() {
      try {
        const token = await getToken()
        if (!token || cancelled) return
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (!response.ok) {
          console.error('Could not save signed-in user profile.')
        }
      } catch (error) {
        if (!cancelled) console.error('Could not save signed-in user profile:', error)
      }
    }

    syncUser()
    return () => { cancelled = true }
  }, [getToken, isLoaded, isSignedIn])

  return null
}

function App() {
  return (
    <>
    <SyncSignedInUser />
     <Routes>
      <Route element={<Layout />}>
      <Route path='/' element={
        <>
        <SoftBackdrop />
        <LenisScroll />
        <Dashboard />
        <Features /> 
        <Pricing />
        <Faq/>
        <CTA />
        </>
      }
        />
      <Route path='/create' element={<Create />} />
      <Route path='/generation' element={<Generation/>}/>
      <Route path="/generation/:id" element={<GenerationResult />} />
      <Route path='/plans' element={<Plan />}/>
      </Route>
      
      <Route path="/loginHomePage" element={<DashboardSidebar />} />
      <Route path="/admin-login/*" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path='/sign-in/*' element={<SIGNINPAGE />} />
      <Route path='/sign-up/*' element={<SIGNUPPAGE/>} />
    </Routes>
    </>
  )
}

export default App
