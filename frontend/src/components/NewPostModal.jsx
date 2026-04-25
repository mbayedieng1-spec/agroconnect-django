import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

const FEELINGS = [
  {e:'😊',l:'Satisfait'},{e:'🎉',l:'Fier'},{e:'🤔',l:'Questionneur'},
  {e:'😌',l:'Soulagé'},{e:'🚀',l:'Enthousiaste'},{e:'😟',l:'Préoccupé'},
  {e:'❤️',l:'Passionné'},{e:'📚',l:'Inspiré'},{e:'🌅',l:'Contemplatif'},
  {e:'🔧',l:'Bricoleur'},{e:'🐝',l:'Pollinisateur'},{e:'🌱',l:'Écolo'},
];

export default function NewPostModal({ onClose, onCreated }) {
  const { currentUser } = useApp();
  const [contenu,    setContenu]    = useState('');
  const [tagsInput,  setTagsInput]  = useState('');
  const [feeling,    setFeeling]    = useState('');
  const [location,   setLocation]   = useState('');
  const [images,     setImages]     = useState([]);   // File objects
  const [previews,   setPreviews]   = useState([]);   // URLs preview
  const [submitting, setSubmitting] = useState(false);
  const [tab,        setTab]        = useState('post');
  const fileRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_,idx) => idx !== i));
    setPreviews(prev => prev.filter((_,idx) => idx !== i));
  };

  const submit = async () => {
    if (!contenu.trim()) return;
    setSubmitting(true);
    try {
      let imageUrls = [];

      // 1. Upload les images si présentes
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(f => formData.append('images', f));
        const upRes = await api.post('/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrls = upRes.data.urls;
      }

      // 2. Créer la publication
      const tags = tagsInput.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean);
      const r = await api.post('/publications', {
        auteur: currentUser.id,
        contenu: contenu.trim(),
        tags, feeling, localisation: location,
        images: imageUrls,
      });

      const isAdmin = currentUser.role === 'admin';
      toast.success(isAdmin ? '✅ Publication publiée !' : '⏳ Publication envoyée — en attente d\'approbation');
      onCreated?.(r.data);
      onClose();
    } catch {
      toast.error('Erreur lors de la publication');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="pop-in" style={{
        background:'white',borderRadius:20,width:'100%',maxWidth:540,
        boxShadow:'var(--sh3)',overflow:'hidden',maxHeight:'90vh',display:'flex',flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:18,color:'var(--g900)'}}>
            Créer une publication
          </span>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:'50%',background:'var(--g50)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'var(--t3)'}}>✕</button>
        </div>

        <div style={{overflowY:'auto',flex:1}}>
          {/* User info */}
          <div style={{padding:'14px 20px 0',display:'flex',gap:10,alignItems:'center'}}>
            <div style={{width:46,height:46,borderRadius:'50%',background:'var(--g100)',border:'2px solid var(--g200)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>
              {currentUser?.avatar}
            </div>
            <div>
              <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,color:'var(--g900)'}}>
                {currentUser?.prenom} {currentUser?.nom}
              </div>
              {(feeling||location) && (
                <div style={{fontSize:12,color:'var(--t3)'}}>
                  {feeling && `se sent ${feeling}`}{feeling&&location&&' · '}{location&&`📍 ${location}`}
                </div>
              )}
              {currentUser?.role !== 'admin' && (
                <div style={{fontSize:11,color:'var(--amber)',fontWeight:600}}>⏳ En attente d'approbation après publication</div>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div style={{padding:'10px 20px'}}>
            <textarea value={contenu} onChange={e=>setContenu(e.target.value)}
              placeholder={`Quoi de neuf sur l'exploitation, ${currentUser?.prenom} ?`}
              rows={4} style={{width:'100%',resize:'none',border:'none',background:'transparent',fontSize:16,color:'var(--t1)',lineHeight:1.6}} />
          </div>

          {/* Aperçu des images */}
          {previews.length > 0 && (
            <div style={{padding:'0 20px 10px'}}>
              <div style={{
                display:'grid',
                gridTemplateColumns: previews.length===1?'1fr':previews.length===2?'1fr 1fr':'1fr 1fr 1fr',
                gap:6, borderRadius:12, overflow:'hidden',
              }}>
                {previews.map((src,i)=>(
                  <div key={i} style={{position:'relative',paddingTop:'75%',background:'#f0fdf4'}}>
                    <img src={src} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
                    <button onClick={()=>removeImage(i)} style={{
                      position:'absolute',top:6,right:6,width:24,height:24,borderRadius:'50%',
                      background:'rgba(0,0,0,.6)',color:'white',fontSize:12,display:'flex',
                      alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer',
                    }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div style={{padding:'0 20px 10px'}}>
            <input value={tagsInput} onChange={e=>setTagsInput(e.target.value)}
              placeholder="🏷️ Tags : irrigation, bio, récolte... (séparés par virgules)"
              className="input" style={{fontSize:13}} />
          </div>

          {/* Feeling */}
          {tab === 'feeling' && (
            <div style={{padding:'0 20px 10px'}}>
              <div style={{fontSize:12,color:'var(--t3)',fontWeight:600,marginBottom:8}}>Comment vous sentez-vous ?</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                {FEELINGS.map(f=>(
                  <button key={f.l} onClick={()=>{setFeeling(f.e+' '+f.l);setTab('post')}} style={{
                    padding:'8px 4px',borderRadius:10,border:'1px solid',
                    borderColor: feeling===f.e+' '+f.l?'var(--g400)':'var(--border)',
                    background: feeling===f.e+' '+f.l?'var(--g50)':'white',
                    fontSize:12,display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',
                  }}>
                    <span style={{fontSize:20}}>{f.e}</span><span style={{color:'var(--t2)'}}>{f.l}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {tab === 'location' && (
            <div style={{padding:'0 20px 10px'}}>
              <input value={location} onChange={e=>setLocation(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&setTab('post')}
                placeholder="📍 Où êtes-vous ? Ex: Casamance, champ nord..."
                className="input" />
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div style={{padding:'10px 20px',borderTop:'1px solid var(--border)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{fontSize:13,color:'var(--t3)',fontWeight:600}}>Ajouter à votre publication</div>
          </div>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            {[
              { icon:'📷', label:'Photos', action: () => fileRef.current?.click() },
              { icon:'😊', label:'Feeling', action: ()=>setTab(tab==='feeling'?'post':'feeling') },
              { icon:'📍', label:'Lieu', action: ()=>setTab(tab==='location'?'post':'location') },
            ].map(b=>(
              <button key={b.label} onClick={b.action} style={{
                display:'flex',gap:5,alignItems:'center',padding:'7px 12px',
                borderRadius:8,fontSize:13,fontWeight:600,
                background: (b.label==='Feeling'&&tab==='feeling')||(b.label==='Lieu'&&tab==='location') ? 'var(--g100)':'var(--g50)',
                color:'var(--g700)',border:'1px solid var(--border2)',transition:'all .15s',
              }}>
                <span style={{fontSize:17}}>{b.icon}</span>{b.label}
              </button>
            ))}
            <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleFiles} />
            {images.length > 0 && (
              <span style={{fontSize:12,color:'var(--g600)',fontWeight:600,display:'flex',alignItems:'center'}}>
                📎 {images.length} photo{images.length>1?'s':''}
              </span>
            )}
          </div>
          <button onClick={submit} disabled={!contenu.trim()||submitting} className="btn-primary"
            style={{width:'100%',padding:'11px',fontSize:14}}>
            {submitting ? '⏳ Publication...' : currentUser?.role==='admin' ? '✅ Publier maintenant' : '📤 Soumettre pour approbation'}
          </button>
        </div>
      </div>
    </div>
  );
}
