import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import RightPanel from './components/RightPanel.jsx';
import Feed from './pages/Feed.jsx';
import Profile from './pages/Profile.jsx';
import Explore from './pages/Explore.jsx';
import Stats from './pages/Stats.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Login from './pages/Login.jsx';

function ProtectedRoute({ children, adminOnly=false }) {
  const { currentUser, isAdmin } = useApp();
  if (!currentUser) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  return children;
}

function Layout() {
  const { currentUser, loading } = useApp();

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:56,marginBottom:12}}>🌱</div>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:20,color:'var(--g600)'}}>Chargement...</div>
        <div style={{width:40,height:40,border:'3px solid var(--g200)',borderTop:'3px solid var(--g500)',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'16px auto'}}/>
      </div>
    </div>
  );

  if (!currentUser) return <Login />;

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      <div style={{maxWidth:1280,margin:'0 auto',padding:'68px 12px 40px',display:'grid',gridTemplateColumns:'260px 1fr 300px',gap:16,alignItems:'start'}}>
        <Sidebar />
        <main>
          <Routes>
            <Route path="/"            element={<Feed />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/explore"     element={<Explore />} />
            <Route path="/stats"       element={<ProtectedRoute adminOnly><Stats /></ProtectedRoute>} />
            <Route path="/admin"       element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="*"            element={<Navigate to="/" />} />
          </Routes>
        </main>
        <RightPanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" toastOptions={{
        style:{background:'#064e3b',color:'#d1fae5',border:'1px solid #059669',fontFamily:'Source Serif 4,serif',fontSize:13},
        success:{style:{background:'#064e3b',color:'#d1fae5'}},
        error:{style:{background:'#7f1d1d',color:'#fecaca',border:'1px solid #dc2626'}},
      }}/>
      <Layout />
    </AppProvider>
  );
}
