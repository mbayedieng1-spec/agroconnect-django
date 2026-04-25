import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const timeAgo = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr }); }
  catch { return ''; }
};

export const TAG_COLORS = {
  irrigation:'#0284c7',eau:'#0ea5e9',sécheresse:'#ea580c',viticulture:'#7c3aed',
  vendange:'#9333ea',bio:'#16a34a',sol:'#92400e',gel:'#0369a1',ravageurs:'#dc2626',
  formation:'#2563eb',maraîchage:'#15803d',blé:'#ca8a04',céréales:'#d97706',
  innovation:'#0891b2',drone:'#6366f1',abeilles:'#f59e0b',colza:'#65a30d',
  rotation:'#0d9488',couverts:'#059669',protection:'#b45309',conseil:'#7c3aed',
};

export const getTagColor = (t) => TAG_COLORS[t?.toLowerCase()] || '#059669';

export const COVER_GRADIENTS = [
  'linear-gradient(135deg,#064e3b,#065f46)',
  'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
  'linear-gradient(135deg,#3b0764,#7e22ce)',
  'linear-gradient(135deg,#7f1d1d,#dc2626)',
  'linear-gradient(135deg,#422006,#d97706)',
  'linear-gradient(135deg,#022c22,#065f46)',
];
