import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

const Ctx = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const WS_URL = BACKEND_URL
  ? BACKEND_URL.replace(/^http/, 'ws') + '/ws/'
  : (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/';

// ── Bus d'événements simple (remplace socket.on/off) ──
const listeners = {};
export const wsOn  = (evt, fn) => { if (!listeners[evt]) listeners[evt] = []; listeners[evt].push(fn); };
export const wsOff = (evt, fn) => { if (listeners[evt]) listeners[evt] = listeners[evt].filter(f => f !== fn); };
const wsEmit = (evt, data)     => { (listeners[evt] || []).forEach(fn => fn(data)); };

export function AppProvider({ children }) {
  const [currentUser,   setCurrentUser]   = useState(null);
  const [users,         setUsers]         = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [pendingCount,  setPendingCount]  = useState(0);

  const currentUserRef = useRef(null);
  const wsRef          = useRef(null);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // ── Session persistée ──
  useEffect(() => {
    const saved = localStorage.getItem('agroconnect_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        loadNotifications(u.id);
      } catch { localStorage.removeItem('agroconnect_user'); }
    }
    setLoading(false);
  }, []);

  // ── WebSocket natif ──
  useEffect(() => {
    let ws, retryTimer;

    const MSGS = {
      like: 'Quelqu\'un a aimé votre post',
      follow: 'Nouveau follower !',
      commentaire: 'Nouveau commentaire',
      approbation: 'Publication approuvée !',
      rejet: 'Publication refusée',
      suspension: 'Compte suspendu',
      nouveau_post: 'Nouvelle publication soumise',
    };

    const connect = () => {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        const user = currentUserRef.current;
        if (user) ws.send(JSON.stringify({ type: 'join_user', userId: user.id }));
      };

      ws.onmessage = (evt) => {
        const d = JSON.parse(evt.data);
        // Diffuser vers les abonnés locaux
        wsEmit(d.type, d);

        if (d.type === 'notification') {
          setUnreadCount(c => c + 1);
          toast('🔔 ' + (d.message || MSGS[d.type_notif] || 'Notification'), { duration: 4000 });
        }
        if (d.type === 'pending_post') setPendingCount(c => c + 1);
        if (d.type === 'new_post')     toast('🌱 ' + (d.from || 'Quelqu\'un') + ' vient de publier', { duration: 2500 });
      };

      ws.onclose = () => { retryTimer = setTimeout(connect, 3000); };
      ws.onerror = ()  => { ws.close(); };
    };

    connect();
    return () => { clearTimeout(retryTimer); if (ws) ws.close(); };
  }, []);

  // Re-rejoindre après login
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && currentUser) {
      ws.send(JSON.stringify({ type: 'join_user', userId: currentUser.id }));
    }
    if (currentUser) {
      loadUsers();
      if (currentUser.role === 'admin') loadPendingCount();
    }
  }, [currentUser?.id]);

  const loadNotifications = async (id) => {
    try {
      const r = await api.get('/notifications/' + id);
      setNotifications(r.data);
      setUnreadCount(r.data.filter(n => !n.lu).length);
    } catch {}
  };

  const loadUsers = useCallback(async () => {
    try { const r = await api.get('/users/'); setUsers(r.data); } catch {}
  }, []);

  const loadPendingCount = useCallback(async () => {
    if (!currentUserRef.current || currentUserRef.current.role !== 'admin') return;
    try {
      const r = await api.get('/publications/en-attente?adminId=' + currentUserRef.current.id);
      setPendingCount(r.data.length);
    } catch {}
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api.post('/users/login', { email, motDePasse: password });
    const user = r.data;
    setCurrentUser(user);
    localStorage.setItem('agroconnect_user', JSON.stringify(user));
    loadNotifications(user.id);
    return user;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUsers([]);
    setNotifications([]);
    setUnreadCount(0);
    setPendingCount(0);
    localStorage.removeItem('agroconnect_user');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!currentUserRef.current) return;
    const r = await api.get('/users/' + currentUserRef.current.id);
    setCurrentUser(r.data);
    localStorage.setItem('agroconnect_user', JSON.stringify(r.data));
  }, []);

  const markRead = useCallback(async () => {
    if (!currentUserRef.current) return;
    await api.patch('/notifications/' + currentUserRef.current.id + '/read-all');
    setNotifications(p => p.map(n => ({ ...n, lu: true })));
    setUnreadCount(0);
  }, []);

  return (
    <Ctx.Provider value={{
      currentUser, setCurrentUser, login, logout, refreshUser,
      users, loadUsers,
      notifications, unreadCount, markRead,
      loading,
      isAdmin: currentUser?.role === 'admin',
      pendingCount, setPendingCount, loadPendingCount,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
