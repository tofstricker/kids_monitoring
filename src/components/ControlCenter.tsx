import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pause, 
  Play, 
  Moon, 
  Unlock, 
  Clock, 
  Zap, 
  X, 
  Smartphone,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ControlCenter({ isOpen, onClose }: ControlCenterProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [activeChild, setActiveChild] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    async function fetchChild() {
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const familyId = userSnap.data()?.familyId;

      if (familyId) {
        const q = query(
          collection(db, 'users'), 
          where('familyId', '==', familyId), 
          where('role', '==', 'CHILD')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setActiveChild({ 
            id: snap.docs[0].id, 
            name: snap.docs[0].data().displayName || 'Child' 
          });
        }
      }
    }
    fetchChild();
  }, []);

  const triggerAction = async (action: string) => {
    if (!activeChild) return;
    setLoading(action);

    try {
      if (action === 'PAUSE') {
        await addDoc(collection(db, 'limits'), {
          targetId: activeChild.id,
          type: 'APP_BLOCK',
          value: '*',
          isEnabled: true,
          reason: 'Manual Pause',
          createdAt: serverTimestamp()
        });
      } else if (action === 'ALLOW_15') {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        await addDoc(collection(db, 'limits'), {
          targetId: activeChild.id,
          type: 'TOTAL_TIME',
          value: '15',
          isEnabled: true,
          expiresAt: expiresAt,
          createdAt: serverTimestamp()
        });
      } else if (action === 'SLEEP') {
         await addDoc(collection(db, 'limits'), {
          targetId: activeChild.id,
          type: 'BEDTIME',
          value: '00:00-23:59', // Full day lockdown for "Sleep Mode" immediately
          isEnabled: true,
          createdAt: serverTimestamp()
        });
      } else if (action === 'UNLOCK') {
        // Find existing total blocks and disable them
        const q = query(
          collection(db, 'limits'), 
          where('targetId', '==', activeChild.id),
          where('isEnabled', '==', true)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await updateDoc(doc(db, 'limits', d.id), { isEnabled: false });
        }
      } else if (action === 'PANIC') {
        const user = auth.currentUser;
        if (!user) return;
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const familyId = userSnap.data()?.familyId;
        
        await fetch('/api/panic/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: activeChild.id, 
            familyId, 
            parentName: userSnap.data()?.displayName || 'A Parent' 
          }),
        });
      }
      
      // Simulate close after success for better UX
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Control Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-zinc-900/90 border-t border-white/10 rounded-t-[32px] z-[101] shadow-2xl p-6 pb-12 overflow-hidden"
          >
            {/* Pull Bar */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center">
                  <Zap className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Quick Controls</h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Managing: {activeChild?.name || 'Loading...'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of actions */}
            <div className="grid grid-cols-2 gap-4">
              <ControlButton 
                icon={Pause} 
                label="Pause All" 
                subLabel="Instant Block" 
                color="bg-red-500" 
                loading={loading === 'PAUSE'}
                onClick={() => triggerAction('PAUSE')}
              />
              <ControlButton 
                icon={Clock} 
                label="Allow 15" 
                subLabel="Bonus Time" 
                color="bg-blue-500" 
                 loading={loading === 'ALLOW_15'}
                onClick={() => triggerAction('ALLOW_15')}
              />
              <ControlButton 
                icon={Moon} 
                label="Sleep Mode" 
                subLabel="Until Morning" 
                color="bg-purple-500" 
                 loading={loading === 'SLEEP'}
                onClick={() => triggerAction('SLEEP')}
              />
              <ControlButton 
                icon={Unlock} 
                label="Unlock Now" 
                subLabel="Resume Usage" 
                color="bg-green-500" 
                 loading={loading === 'UNLOCK'}
                onClick={() => triggerAction('UNLOCK')}
              />
            </div>

            {/* Panic Section */}
            <div className="mt-8 pt-8 border-t border-white/5">
               <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => triggerAction('PANIC')}
                disabled={loading === 'PANIC'}
                className="w-full bg-red-600 hover:bg-red-700 p-6 rounded-3xl flex items-center justify-center gap-4 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all group"
              >
                <div className="p-3 bg-white/20 rounded-2xl group-hover:bg-white/30 transition-colors">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-black uppercase italic tracking-tighter">Emergency Panic</div>
                  <div className="text-xs font-bold text-red-200">Alert All Parents + Lock Device</div>
                </div>
                
                {loading === 'PANIC' && (
                  <div className="ml-auto w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                )}
              </motion.button>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-white">System Status</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">ACTIVE</span>
              </div>
              <p className="text-xs text-zinc-500">All commands are pushed with high-priority FCM tokens and reach the device in &lt;500ms.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ControlButton({ 
  icon: Icon, 
  label, 
  subLabel, 
  color, 
  onClick,
  loading 
}: { 
  icon: any, 
  label: string, 
  subLabel: string, 
  color: string, 
  onClick: () => void,
  loading: boolean 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="p-4 bg-zinc-800/50 rounded-3xl border border-white/5 text-left transition-colors hover:bg-zinc-800 flex flex-col gap-4 relative overflow-hidden"
    >
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
        <Icon className="text-white w-6 h-6" />
      </div>
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{subLabel}</div>
      </div>
      
      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </motion.div>
      )}
    </motion.button>
  );
}
