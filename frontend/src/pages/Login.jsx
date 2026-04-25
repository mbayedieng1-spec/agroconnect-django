import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

const REGIONS = ['Dakar','Ziguinchor','Thiès','Saint-Louis','Kaolack','Louga','Tambacounda','Kolda','Matam','Kédougou','Diourbel','Fatick','Sédhiou'];
const CULTURES = ['Riziculture','Maraîchage','Maraîchage Bio','Arachide','Mil & Sorgho','Élevage Bovin','Élevage Laitier','Arboriculture','Coton & Maïs','Gomme arabique','Permaculture','Polyculture','Aviculture'];

const DEMOS = [
  { label:'👑 Admin — Mamadou Diallo', email:'admin@agroconnect.sn', pwd:'admin123' },
  { label:'🌾 Khoury Badji (Ziguinchor)', email:'khoury.badji@agro.sn', pwd:'user123' },
  { label:'🥕 Fatou Ndiaye (Thiès)', email:'fatou.ndiaye@agro.sn', pwd:'user123' },
  { label:'💧 Ibrahima Sy (Saint-Louis)', email:'ibrahima.sy@agro.sn', pwd:'user123' },
];

function InputField({ label, type='text', value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>
        {label} {required && <span style={{color:'var(--red)'}}>*</span>}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} className="input" required={required} />
    </div>
  );
}

export default function Login() {
  const { login } = useApp();
  const [mode, setMode]         = useState('login'); // login | register
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Login fields
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [rPrenom,   setRPrenom]   = useState('');
  const [rNom,      setRNom]      = useState('');
  const [rPseudo,   setRPseudo]   = useState('');
  const [rEmail,    setREmail]    = useState('');
  const [rPwd,      setRPwd]      = useState('');
  const [rPwd2,     setRPwd2]     = useState('');
  const [rRegion,   setRRegion]   = useState('');
  const [rCulture,  setRCulture]  = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }
    setLoading(true); setError('');
    try {
      const user = await login(email, password);
      toast.success('Bienvenue ' + user.prenom + ' ! 🌱');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!rPrenom||!rNom||!rPseudo||!rEmail||!rPwd||!rRegion||!rCulture) { setError('Veuillez remplir tous les champs obligatoires'); return; }
    if (rPwd !== rPwd2) { setError('Les mots de passe ne correspondent pas'); return; }
    if (rPwd.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/users/register', { prenom:rPrenom, nom:rNom, pseudo:rPseudo, email:rEmail, motDePasse:rPwd, region:rRegion, type_culture:rCulture });
      toast.success('Compte créé avec succès ! Connectez-vous. 🌱');
      setEmail(rEmail); setPassword(rPwd);
      setMode('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du compte');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#064e3b 0%,#065f46 40%,#047857 100%)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      position:'relative', overflow:'hidden',
    }}>
      {/* Décorations */}
      {[{t:-120,l:-120,s:400},{t:'auto',b:-150,r:-150,s:500},{t:100,r:-80,s:300}].map((d,i)=>(
        <div key={i} style={{
          position:'fixed', top:d.t, left:d.l, right:d.r, bottom:d.b,
          width:d.s, height:d.s, borderRadius:'50%',
          background:'rgba(255,255,255,0.04)', pointerEvents:'none',
        }}/>
      ))}

      <div style={{
        width:'100%', maxWidth:960, display:'grid',
        gridTemplateColumns: mode==='register' ? '1fr 1.4fr' : '1fr 1fr',
        borderRadius:24, overflow:'hidden',
        boxShadow:'0 40px 80px rgba(0,0,0,.4)',
        transition:'all .3s',
      }}>

        {/* ── Panneau gauche ── */}
        <div style={{
          background:'rgba(0,0,0,0.22)', backdropFilter:'blur(20px)',
          padding:48, display:'flex', flexDirection:'column', justifyContent:'center',
          borderRight:'1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{fontSize:60,marginBottom:16}}>🌱</div>
          <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:38,color:'white',lineHeight:1.1,marginBottom:12}}>
            AgroConnect<br/><span style={{color:'#6ee7b7',fontSize:24}}>Sénégal</span>
          </div>
          <p style={{color:'rgba(255,255,255,.7)',fontSize:14,lineHeight:1.8,marginBottom:28}}>
            La plateforme sociale des agriculteurs sénégalais. Partagez vos expériences, photos de cultures et connectez-vous.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {['🌾 Partage de photos de cultures','💧 Conseils en irrigation','🥜 Bassin arachidier','🥭 Arboriculture tropicale'].map(t=>(
              <div key={t} style={{display:'flex',gap:10,alignItems:'center',color:'rgba(255,255,255,.65)',fontSize:13}}>
                <span>{t.split(' ')[0]}</span><span>{t.slice(2)}</span>
              </div>
            ))}
          </div>

          {/* Démo rapide */}
          <div style={{marginTop:28,paddingTop:20,borderTop:'1px solid rgba(255,255,255,.15)'}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,.5)',fontWeight:600,letterSpacing:.5,textTransform:'uppercase',marginBottom:10}}>
              Connexion rapide
            </div>
            {DEMOS.map(d=>(
              <button key={d.email}
                onClick={()=>{ setEmail(d.email); setPassword(d.pwd); setMode('login'); }}
                style={{
                  display:'block',width:'100%',textAlign:'left',
                  padding:'8px 12px',borderRadius:8,marginBottom:4,
                  background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',
                  color:'rgba(255,255,255,.8)',fontSize:12,cursor:'pointer',
                  transition:'all .15s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.15)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)'}}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Panneau droit ── */}
        <div style={{background:'white',padding:mode==='register'?'36px 44px':'48px',overflowY:'auto',maxHeight:'100vh'}}>

          {/* Tabs */}
          <div style={{display:'flex',gap:4,background:'var(--g50)',borderRadius:12,padding:4,marginBottom:28}}>
            {[['login','🔑 Connexion'],['register','✏️ Inscription']].map(([k,l])=>(
              <button key={k} onClick={()=>{setMode(k);setError('');}}
                style={{
                  flex:1,padding:'9px',borderRadius:9,fontSize:13,fontWeight:700,
                  background: mode===k ? 'white' : 'transparent',
                  color: mode===k ? 'var(--g700)' : 'var(--t3)',
                  boxShadow: mode===k ? 'var(--sh)' : 'none',
                  transition:'all .2s', border:'none', cursor:'pointer',
                }}>
                {l}
              </button>
            ))}
          </div>

          {error && (
            <div style={{background:'var(--red2)',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:13,color:'var(--red)',display:'flex',gap:8,alignItems:'center'}}>
              ⚠️ {error}
            </div>
          )}

          {/* ── FORMULAIRE CONNEXION ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:26,color:'var(--g900)',marginBottom:6}}>
                Connexion
              </div>
              <div style={{color:'var(--t3)',fontSize:13,marginBottom:24}}>
                Accédez à votre compte AgroConnect
              </div>
              <InputField label="Adresse email" type="email" value={email} onChange={setEmail} placeholder="votre@email.sn" required />
              <InputField label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
              <button type="submit" className="btn-primary" disabled={loading} style={{width:'100%',padding:'13px',fontSize:15,marginTop:4}}>
                {loading ? '⏳ Connexion...' : '🌱 Se connecter'}
              </button>
            </form>
          )}

          {/* ── FORMULAIRE INSCRIPTION ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:24,color:'var(--g900)',marginBottom:6}}>
                Créer un compte
              </div>
              <div style={{color:'var(--t3)',fontSize:13,marginBottom:20}}>
                Rejoignez la communauté des agriculteurs sénégalais
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
                <InputField label="Prénom" value={rPrenom} onChange={setRPrenom} placeholder="Fatou" required />
                <InputField label="Nom de famille" value={rNom} onChange={setRNom} placeholder="Ndiaye" required />
              </div>
              <InputField label="Pseudo (identifiant unique)" value={rPseudo} onChange={setRPseudo} placeholder="fatou_thiès" required />
              <InputField label="Adresse email" type="email" value={rEmail} onChange={setREmail} placeholder="fatou@email.sn" required />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
                <InputField label="Mot de passe" type="password" value={rPwd} onChange={setRPwd} placeholder="Min. 6 caractères" required />
                <InputField label="Confirmer" type="password" value={rPwd2} onChange={setRPwd2} placeholder="Répéter" required />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
                <div style={{marginBottom:16}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:6}}>
                    Région <span style={{color:'var(--red)'}}>*</span>
                  </label>
                  <select value={rRegion} onChange={e=>setRRegion(e.target.value)} className="input" required>
                    <option value="">Choisir...</option>
                    {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:6}}>
                    Type de culture <span style={{color:'var(--red)'}}>*</span>
                  </label>
                  <select value={rCulture} onChange={e=>setRCulture(e.target.value)} className="input" required>
                    <option value="">Choisir...</option>
                    {CULTURES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{width:'100%',padding:'13px',fontSize:15}}>
                {loading ? '⏳ Création...' : '🌱 Créer mon compte'}
              </button>
              <p style={{fontSize:11,color:'var(--t4)',textAlign:'center',marginTop:12}}>
                Votre compte sera actif immédiatement. Vos publications seront vérifiées par l'administrateur.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
