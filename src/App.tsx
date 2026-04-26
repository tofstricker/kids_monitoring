/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Smartphone, 
  Database as DatabaseIcon, 
  Layers, 
  ArrowRightLeft, 
  Lock, 
  MapPin, 
  Clock, 
  Eye, 
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
  Zap,
  Activity,
  Server,
  ExternalLink,
  Moon,
  Camera,
  Search,
  Wifi,
  WifiOff,
  Bug,
  Battery,
  Terminal,
  CheckSquare,
  Zap as ZapIcon,
  Lightbulb,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { testFirebaseConnection } from './lib/firebase';
import ControlCenter from './components/ControlCenter';

// --- Types ---
type Section = 'overview' | 'previews' | 'components' | 'data-flow' | 'database' | 'security' | 'implementation' | 'guardian' | 'testing' | 'geofencing' | 'smart-modes' | 'content-filtering' | 'publishing';

interface ComponentInfo {
  name: string;
  description: string;
  subComponents: string[];
}

// --- Data ---
const PARENT_APP_COMPONENTS: ComponentInfo = {
  name: "Parent Dashboard App",
  description: "The control center used by parents to manage their family ecosystem.",
  subComponents: [
    "Family Management (Invite, Onboard)",
    "Real-time Dashboard (Map, Stats)",
    "Policy Editor (App Blocks, Time Limits)",
    "Alert System (Geofencing, Panic)",
    "Shared Authentication (Family Scoping)"
  ]
};

const CHILD_APP_COMPONENTS: ComponentInfo = {
  name: "Child Guardian App",
  description: "The background enforcement agent running on child devices.",
  subComponents: [
    "Foreground Service (System Persistance)",
    "Accessibility Service (App Monitoring/Blocking)",
    "Location Tracking Engine (Fused Provider)",
    "Device Administrator (Anti-Uninstall)",
    "Usage Stats Service (Metric Collection)"
  ]
};

const DATA_FLOWS = [
  { from: "Parent App", to: "Firestore", action: "Update Config", data: "Block List", icon: DatabaseIcon },
  { from: "Firestore", to: "Child App", action: "Push Sync", data: "Real-time Update", icon: Zap },
  { from: "Child App", to: "Firestore", action: "Stream Data", data: "Location / Usage", icon: ArrowRightLeft },
  { from: "Backend", to: "Parent App", action: "FCM Push", data: "Limit Alerts / Suspicious Activity", icon: Server },
];

// --- Components ---

function Header({ activeSection, setActiveSection, isMenuOpen, setIsMenuOpen }: { 
  activeSection: Section; 
  setActiveSection: (s: Section) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (o: boolean) => void;
}) {
  const sections: { id: Section; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'previews', label: 'UI Preview', icon: Smartphone },
    { id: 'components', label: 'Components', icon: Layers },
    { id: 'data-flow', label: 'Data Flow', icon: ArrowRightLeft },
    { id: 'database', label: 'Database', icon: DatabaseIcon },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'smart-modes', label: 'Smart Modes', icon: Zap },
    { id: 'content-filtering', label: 'Content Filter', icon: ShieldAlert },
    { id: 'implementation', label: 'Parent App', icon: Smartphone },
    { id: 'guardian', label: 'Child App', icon: ShieldAlert },
    { id: 'geofencing', label: 'Family Map', icon: MapPin },
    { id: 'testing', label: 'Testing & QA', icon: CheckSquare },
    { id: 'publishing', label: 'Play Store Hub', icon: ExternalLink },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#141414] border-b border-[#2a2a2a] px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
          <ShieldAlert className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white leading-tight">KiteControl</span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Architecture Spec</span>
        </div>
      </div>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 rounded-md ${
              activeSection === s.id ? 'bg-[#2a2a2a] text-orange-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]'
            }`}
          >
            <s.icon className="w-4 h-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Mobile Toggle */}
      <button 
        className="md:hidden text-zinc-400"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-[#141414] border-b border-[#2a2a2a] p-4 flex flex-col gap-2 md:hidden"
          >
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSection(s.id);
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${
                  activeSection === s.id ? 'bg-[#2a2a2a] text-orange-400' : 'text-zinc-400'
                }`}
              >
                <s.icon className="w-5 h-5" />
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function SectionHeading({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon?: any }) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className="text-orange-500 w-6 h-6" />}
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <p className="text-zinc-400 max-w-2xl">{subtitle}</p>
    </div>
  );
}

function Overview() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="System Ecosystem" 
        subtitle="The KiteControl architecture bridges two highly specialized Android clients through a real-time serverless backend designed for low latency and high reliability."
        icon={Eye}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 px-4 md:px-0">
        <div className="p-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Smartphone className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-4">Parent App</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Command and oversight platform. Built for visualization and policy management. Communicates primarily with Firestore to update states.
            </p>
            <ul className="space-y-3">
              {['Real-time Map', 'Usage Analytics', 'Content Filtering'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-8 bg-[#201c18] border border-orange-900/30 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DatabaseIcon className="w-24 h-24 text-orange-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-4">Cloud Infrastructure</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Firebase-centric backend providing real-time synchronization, identity management, and edge push notification delivery via FCM.
            </p>
            <ul className="space-y-3">
              {['Firestore Real-time Sync', 'Firebase FCM', 'Serverless Logic'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Activity className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-4">Child App</h3>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Enforcement specialist. Runs as a persistent agent utilizing platform-level APIs to monitor and restrict OS behavior in real-time.
            </p>
            <ul className="space-y-3">
              {['App Blocking', 'Location Streaming', 'Device Locking'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Intelligent Insights Section */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Premium Intelligent Insights</h3>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">AI Behavioral Analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-6 bg-gradient-to-br from-purple-900/10 to-zinc-900 border border-purple-500/20 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Lightbulb className="w-32 h-32 text-purple-400" />
            </div>
            
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shrink-0">
                <Activity className="text-white w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-purple-300 uppercase tracking-tighter italic">Behavior Insight</h4>
                <p className="text-white font-bold text-lg leading-tight">Ahmed used phone during school hours</p>
              </div>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Suggestion</span>
              </div>
              <p className="text-sm text-zinc-300">"We've detected activity during school time. Enabling <strong>School Mode</strong> will automatically restrict social apps and games while he's at school."</p>
            </div>

            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group">
              Enable School Mode <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="p-6 bg-[#121212] border border-zinc-800 rounded-3xl"
          >
             <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="text-white w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-blue-300 uppercase tracking-tighter italic">Usage Trend</h4>
                <p className="text-white font-bold text-lg leading-tight">20% Increase in night-time gaming</p>
              </div>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Suggestion</span>
              </div>
              <p className="text-sm text-zinc-300">"Night usage is trending upwards. Smart Auto-Pilot recommends shifting <strong>Bedtime</strong> to 9:30 PM to ensure better rest."</p>
            </div>

             <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
              Apply Recommendation
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function Components() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="Component Breakdown" 
        subtitle="Each application is partitioned into specific modules focusing on security, data acquisition, or user interface."
        icon={Layers}
      />
      
      <div className="space-y-8">
        {[PARENT_APP_COMPONENTS, CHILD_APP_COMPONENTS].map((app, idx) => (
          <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className={`p-6 border-b border-[#2a2a2a] flex items-center justify-between ${idx === 0 ? 'bg-zinc-900/50' : 'bg-orange-950/20'}`}>
              <div>
                <h3 className="text-lg font-bold text-white">{app.name}</h3>
                <p className="text-sm text-zinc-400">{app.description}</p>
              </div>
              <div className="p-2 bg-[#2a2a2a] rounded flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase text-zinc-500">Android SDK 31+</span>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {app.subComponents.map((comp, cIdx) => (
                <div key={cIdx} className="flex items-start gap-3 p-4 bg-[#141414] border border-[#232323] rounded-lg">
                  <div className="mt-1 flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-orange-500/60" />
                  </div>
                  <div>
                    <h4 className="text-zinc-200 text-sm font-semibold">{comp.split('(')[0].trim()}</h4>
                    <p className="text-zinc-500 text-xs mt-1 italic">{comp.includes('(') ? comp.match(/\(([^)]+)\)/)?.[1] : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DataFlow() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="Interactive Data Flow" 
        subtitle="How data and control signals propagate through the system lifecycle."
        icon={ArrowRightLeft}
      />

      <div className="relative bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 overflow-hidden min-h-[400px]">
        {/* Connection visualization */}
        <div className="flex flex-col gap-12 relative z-10">
          {DATA_FLOWS.map((flow, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center gap-6 group">
              <div className="w-32 text-right">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-tighter">{flow.from}</span>
              </div>
              
              <div className="flex-1 flex items-center justify-center relative px-8">
                <div className="h-[1px] w-full bg-[#2a2a2a] group-hover:bg-orange-500/50 transition-colors" />
                <div className="absolute inset-x-0 flex items-center justify-center">
                  <div className="bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-2 rounded-full flex items-center gap-3 shadow-lg group-hover:border-orange-500/50 transition-all">
                    <flow.icon className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-zinc-300 font-medium">{flow.action}</span>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs text-zinc-500 italic">{flow.data}</span>
                  </div>
                </div>
              </div>

              <div className="w-32 text-left">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-tighter">{flow.to}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Ambient background grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />
      </div>

      <div className="mt-8 p-6 bg-zinc-900/50 border border-[#2a2a2a] rounded-xl flex items-start gap-4">
        <AlertTriangle className="text-orange-500 w-5 h-5 flex-shrink-0 mt-1" />
        <div>
          <h4 className="text-white font-bold text-sm mb-1">Latency Consideration</h4>
          <p className="text-zinc-400 text-sm leading-relaxed">
            While Firestore provides sub-second sync for regular UI updates, critical command triggers (like Remote Lock) MUST utilize 
            <strong> FCM (Firebase Cloud Messaging)</strong> with <code>high priority</code> to wake the device from Doze mode instantly.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Database() {
  const schemaItems = [
    { name: "Family", path: "/families/{id}", fields: ["name", "adminIds", "createdAt"] },
    { name: "User", path: "/users/{id}", fields: ["displayName", "role", "familyId", "email"] },
    { name: "Device", path: "/devices/{id}", fields: ["userId", "model", "fcmToken", "isLocked"] },
    { name: "Location", path: "/locations/{id}", fields: ["userId", "lat", "lng", "timestamp"] },
    { name: "Usage", path: "/usage/{id}", fields: ["userId", "packageName", "duration", "date"] },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="Firestore Schema Design" 
        subtitle="A non-relational document structure optimized for real-time reads and high-throughput logging."
        icon={DatabaseIcon}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemaItems.map((item, idx) => (
          <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 font-mono">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2a2a2a]">
              <h3 className="text-orange-500 font-bold text-sm">{item.name}</h3>
              <span className="text-[10px] text-zinc-600 bg-zinc-800/50 px-2 py-1 rounded">Collection</span>
            </div>
            <div className="text-zinc-500 text-xs mb-4">{item.path}</div>
            <div className="space-y-2">
              {item.fields.map((f, fIdx) => (
                <div key={fIdx} className="flex items-center justify-between text-xs py-1">
                  <span className="text-zinc-300">{f}</span>
                  <span className="text-zinc-600 opacity-50 italic">property</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
        <div className="p-6 bg-blue-900/10 border border-blue-900/30 rounded-xl">
          <h4 className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2">
            <Activity className="w-4 h-4" /> Usage Indexing
          </h4>
          <p className="text-zinc-400 text-sm">
            Usage data is partitioned by Day and User. This allows lightning-fast weekly reports without fetching massive historical sets.
          </p>
        </div>
        <div className="p-6 bg-purple-900/10 border border-purple-900/30 rounded-xl">
          <h4 className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-2">
            <ArrowRightLeft className="w-4 h-4" /> Location TTL
          </h4>
          <p className="text-zinc-400 text-sm">
            Location record collection uses Cloud Functions to expire records older than 30 days, keeping database costs and overhead predictable.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Security() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="Security & Privacy Policy" 
        subtitle="Ensuring the integrity of parental controls and the privacy of child data."
        icon={Lock}
      />

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <ShieldAlert className="text-orange-500" /> Control Integrity
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-zinc-200 text-sm font-bold mb-2">Anti-Uninstall Mechanism</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Child app requests <strong>Device Administrator</strong> privileges, allowing it to block uninstallation unless authorized by the parent cloud token.
                  </p>
                </div>
                <div>
                  <h4 className="text-zinc-200 text-sm font-bold mb-2">Accessibility Service Persistence</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Used to monitor window changes. If the user tries to disable the service, the app immediately re-prompts or locks the device until reactivated.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <Lock className="text-blue-500" /> Data Sovereignty
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-zinc-200 text-sm font-bold mb-2">Family Scoping</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Firestore Security Rules ensure that users can ONLY read/write documents where the <code>familyId</code> matches their authenticated profile.
                  </p>
                </div>
                <div>
                  <h4 className="text-zinc-200 text-sm font-bold mb-2">Zero-Access Backups</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    User PII (emails/names) is stored separately from technical telemetry (UIs/pings) to reduce exposure root during potential edge breaches.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Implementation() {
  const [selectedFile, setSelectedFile] = useState('main.dart');

  const files: Record<string, string> = {
    'main.dart': 'void main() async {\n  WidgetsFlutterBinding.ensureInitialized();\n  await Firebase.initializeApp();\n  runApp(KiteControlApp());\n}',
    'auth_service.dart': 'class AuthService {\n  final FirebaseAuth _auth = FirebaseAuth.instance;\n  Future<User?> login(String email, String password) async { ... }\n}',
    'firestore_service.dart': 'Future<bool> linkChildWithCode(String code, String userId) async {\n  // Atomic Batch: Update PairingCode + User FamilyId\n}',
    'login_screen.dart': 'class LoginScreen extends StatefulWidget { ... }\n// Implements Parent UI with Firebase Auth',
    'dashboard_screen.dart': 'class DashboardScreen extends StatelessWidget { ... }\n// Real-time Child Monitoring Grid',
    'pairing_screen.dart': 'class PairingScreen extends StatefulWidget { ... }\n// 6-Digit Pairing Code Generator',
    'child_link_screen.dart': 'class ChildLinkScreen extends StatefulWidget { ... }\n// Child Entry with Error Validation',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="Flutter Mobile Implementation" 
        subtitle="The reference implementation for the Parent App, built with Flutter and Clean Architecture."
        icon={Smartphone}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 space-y-2">
          {Object.keys(files).map(f => (
            <button
              key={f}
              onClick={() => setSelectedFile(f)}
              className={`w-full text-left px-4 py-2 rounded text-xs font-mono transition-colors ${
                selectedFile === f ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl">
          <div className="p-3 bg-zinc-900 border-b border-[#2a2a2a] flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{selectedFile}</span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
            </div>
          </div>
          <pre className="p-6 text-sm font-mono text-zinc-300 overflow-x-auto">
            <code>{files[selectedFile]}</code>
          </pre>
          <div className="p-4 bg-zinc-900/50 border-t border-[#2a2a2a] text-[10px] text-zinc-600 flex justify-between">
            <span>Generated according to Clean Architecture standards</span>
            <span>UTF-8 // Dart 3.0</span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-orange-950/10 border border-orange-900/30 rounded-xl">
        <h4 className="flex items-center gap-2 text-orange-400 font-bold text-sm mb-2">
          <Layers className="w-4 h-4" /> Architectural Pattern
        </h4>
        <p className="text-zinc-400 text-sm leading-relaxed">
          The code follows a <strong>Layered Architecture</strong>: The UI (Screens) 
          is separated from the Domain (Models/Services), which allows for easy testing 
          and maintenance of the core parental control logic independently of the mobile platform.
        </p>
      </div>
    </motion.div>
  );
}

function SmartModesView() {
  const modes = [
    { 
      name: 'Worship Mode', 
      icon: <Moon className="w-6 h-6 text-indigo-400" />,
      desc: 'Silent + Block Media',
      condition: 'Location == Mosque / Church',
      activeStatus: 'AUTO-WAITING',
      color: 'indigo'
    },
    { 
      name: 'School Mode', 
      icon: <Smartphone className="w-6 h-6 text-blue-400" />,
      desc: 'Block Games + Social',
      condition: 'Time == 8AM-3PM & Location == School',
      activeStatus: 'ACTIVE',
      color: 'blue'
    },
    { 
      name: 'Sleep Mode', 
      icon: <Lock className="w-6 h-6 text-slate-400" />,
      desc: 'Total Lock (Calls Only)',
      condition: 'Time == 10PM-6AM',
      activeStatus: 'AUTO-WAITING',
      color: 'slate'
    },
    { 
      name: 'Study Mode', 
      icon: <DatabaseIcon className="w-6 h-6 text-orange-400" />,
      desc: 'Educational Apps Only',
      condition: 'Manual Activation',
      activeStatus: 'STANDBY',
      color: 'orange'
    },
    { 
      name: 'Focus Mode', 
      icon: <CheckSquare className="w-6 h-6 text-emerald-400" />,
      desc: 'Ed-Apps only during Study',
      condition: 'Scheduled Study Hours',
      activeStatus: 'STANDBY',
      color: 'emerald'
    },
    { 
      name: 'Travel Mode', 
      icon: <Activity className="w-6 h-6 text-amber-400" />,
      desc: 'Power-Save Tracking',
      condition: 'Activity == VEHICLE',
      activeStatus: 'STANDBY',
      color: 'amber'
    },
    { 
      name: 'Weekend Mode', 
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      desc: '+1h Gaming Bonus',
      condition: 'Day == Sat / Sun',
      activeStatus: 'AUTO-WAITING',
      color: 'pink'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Zap className="text-orange-500 w-8 h-8" /> Smart Context Modes
        </h2>
        <p className="text-zinc-500 mt-2 max-w-2xl leading-relaxed italic">
          "The best parental control is the one you don't have to manage." — 
          Our context engine automatically shifts phone behavior based on location, time, and usage patterns.
        </p>
      </div>

      {/* Auto-Setup Discovery Panel */}
      <div className="bg-[#1a1a1a] border-2 border-dashed border-orange-500/20 rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
           <Search className="w-48 h-48 text-orange-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight italic">Nearby Smart Discoveries</h3>
              <p className="text-xs text-orange-500 font-black uppercase tracking-widest leading-none">Auto-Setup Engine</p>
            </div>
          </div>
          
          <p className="text-zinc-400 text-sm mb-8 max-w-xl">
            Our discovery engine has identified <strong>3 relevant locations</strong> near your child's frequent route. Do you want to automatically configure Smart Modes for these areas?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { name: 'Central High School', type: 'SCHOOL', mode: 'School Mode' },
              { name: 'Grand Mosque', type: 'WORSHIP', mode: 'Worship Mode' },
              { name: 'St. Mary\'s Church', type: 'WORSHIP', mode: 'Worship Mode' }
            ].map(discovery => (
              <div key={discovery.name} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4 group/item hover:border-orange-500/30 transition-all">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover/item:bg-orange-500/20 transition-colors">
                  {discovery.type === 'SCHOOL' ? <Smartphone className="w-5 h-5 text-blue-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{discovery.name}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Suggests: {discovery.mode}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            Setup All Modes In One Tap <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modes.map((mode) => (
          <div key={mode.name} className={`relative p-6 rounded-3xl border border-zinc-800 bg-[#121212] overflow-hidden group transition-all`}>
            {mode.activeStatus === 'ACTIVE' && (
              <div className="absolute top-0 right-0 p-3">
                <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-[10px] font-black border border-green-500/30">
                  <Activity className="w-3 h-3 animate-pulse" /> LIVE
                </div>
              </div>
            )}
            
            <div className={`w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6`}>
              {mode.icon}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{mode.name}</h3>
            <p className="text-zinc-400 text-sm mb-4 font-medium leading-tight">{mode.desc}</p>
            
            <div className="pt-4 border-t border-zinc-800 mt-auto">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">Trigger condition</div>
              <div className="text-xs text-zinc-500 font-mono ">{mode.condition}</div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className={`text-[10px] font-black tracking-widest uppercase ${mode.activeStatus === 'ACTIVE' ? 'text-green-500' : 'text-zinc-700'}`}>
                {mode.activeStatus}
              </span>
              <button className="p-2 rounded-full border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-500 font-bold transition-all text-[10px] uppercase tracking-widest">
                Edit Rule
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-3xl p-8">
           <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
             <Layers className="w-5 h-5 text-orange-500" /> Multi-Condition Engine
           </h3>
           <div className="space-y-4">
             <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <div className="text-orange-500 font-mono text-xs mb-2">IF (CONTEXT.IS_SCHOOL_HOURS AND CONTEXT.IN_SCHOOL_ZONE)</div>
                <div className="text-zinc-400 text-xs">The system requires both temporal and spatial alignment to prevent false triggers during commutes.</div>
             </div>
             <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <div className="text-green-500 font-mono text-xs mb-2">AND (CONTEXT.BATTERY_STATE &gt; 15%)</div>
                <div className="text-zinc-400 text-xs">Emergency bypasses are automatically enabled during low battery events to prioritize essential communication.</div>
             </div>
           </div>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-3xl p-8">
           <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
             <Smartphone className="w-5 h-5 text-blue-500" /> Native Implementation
           </h3>
           <div className="bg-zinc-950 p-6 rounded-xl font-mono text-xs text-zinc-500 leading-relaxed">
              <div className="text-blue-400">// Automatic Mode Transition</div>
              <div>onContextChanged(Context c) &#123;</div>
              <div className="pl-4">if (c.mode == Mode.WORSHIP) &#123;</div>
              <div className="pl-8 text-orange-400">audioManager.setRingerMode(SILENT);</div>
              <div className="pl-8 text-orange-400">blocker.applyProfile(MEDIA_APPS);</div>
              <div className="pl-4">&#125;</div>
              <div>&#125;</div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function ContentFilteringView() {
  const settings = [
    { name: 'Adult Content', status: 'Blocked', icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
    { name: 'Safe Search', status: 'Enforced', icon: <Search className="w-5 h-5 text-blue-500" /> },
    { name: 'Malware Protection', status: 'Active', icon: <ShieldAlert className="w-5 h-5 text-green-500" /> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-red-500 w-8 h-8" /> Safe Content Filtering
        </h2>
        <p className="text-zinc-500 mt-2 max-w-2xl leading-relaxed">
          KiteControl uses a <strong>Local Android VPNService</strong> to intercept and filter DNS requests at the device level, ensuring zero-latency blocking with no external battery drain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settings.map(s => (
          <div key={s.name} className="p-6 bg-[#1a1a1a] border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-red-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-900 rounded-xl">{s.icon}</div>
              <div>
                <div className="text-sm font-bold text-white leading-none mb-1">{s.name}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{s.status}</div>
              </div>
            </div>
            <div className="w-8 h-4 bg-red-500/20 rounded-full flex items-center px-1 border border-red-500/30">
               <div className="w-2.5 h-2.5 bg-red-500 rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a1a] border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Layers className="w-48 h-48 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Server className="w-5 h-5 text-red-500" /> VPN & DNS Interception Logic
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 font-bold text-sm">1</div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">Local VPN Bind</h4>
                <p className="text-zinc-500 text-xs">The Child Agent establishes a local VPN tunnel (`VpnService`) that captures all outbound IP traffic.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 font-bold text-sm">2</div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">DNS Packet Parsing</h4>
                <p className="text-zinc-500 text-xs">Native logic parses UDP packets on port 53 to extract the requested domain name.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 font-bold text-sm">3</div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">Domain Validation</h4>
                <p className="text-zinc-500 text-xs">Domains are checked against local cached blacklists and the <strong>Cisco OpenDNS</strong> or <strong>Google Safe Browsing</strong> APIs.</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 font-mono text-[10px] leading-relaxed">
             <div className="text-zinc-600 mb-4">// Android Native Implementation (VpnService.Builder)</div>
             <div className="text-blue-400">VpnService.Builder builder = new VpnService.Builder();</div>
             <div className="text-zinc-400">builder.addAddress("10.0.0.2", 32);</div>
             <div className="text-zinc-400">builder.addRoute("0.0.0.0", 0);</div>
             <div className="text-zinc-400">builder.addDnsServer("1.1.1.1"); <span className="text-zinc-600">// Redirected to filter</span></div>
             <div className="text-zinc-400">ParcelFileDescriptor vpnInterface = builder.establish();</div>
             <div className="mt-4 text-orange-400">while (true) &#123;</div>
             <div className="pl-4 text-zinc-400">ByteBuffer packet = ByteBuffer.allocate(32767);</div>
             <div className="pl-4 text-zinc-400">int length = in.read(packet.array());</div>
             <div className="pl-4 text-green-500">if (isDnsPacket(packet)) &#123; filterDomain(packet); &#125;</div>
             <div className="text-orange-400">&#125;</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PublishingView() {
  const steps = [
    { title: 'Google Play Console', desc: 'Create a developer account ($25 fee)', icon: <Server className="w-5 h-5 text-blue-400" /> },
    { title: 'Privacy Policy', desc: 'Mandatory for child & location data', icon: <Lock className="w-5 h-5 text-purple-400" /> },
    { title: 'Permission Declaration', desc: 'Justify Accessibility & VPN usage', icon: <ShieldAlert className="w-5 h-5 text-red-400" /> },
    { title: 'Store Assets', desc: 'Icons, Graphics, and Compliance Video', icon: <Smartphone className="w-5 h-5 text-green-400" /> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ExternalLink className="text-blue-500 w-8 h-8" /> Play Store Hub
        </h2>
        <p className="text-zinc-500 mt-2 max-w-2xl leading-relaxed">
          The path to the **Google Play Store** for a Parental Control app is unique. You must pass rigorous "Sensitive Permission" audits due to the deep OS access required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <div key={step.title} className="p-6 bg-[#1a1a1a] border border-zinc-800 rounded-3xl relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity font-black text-6xl italic">
               0{i + 1}
             </div>
             <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6">
               {step.icon}
             </div>
             <h3 className="text-white font-bold mb-2">{step.title}</h3>
             <p className="text-zinc-500 text-xs leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-600/10 border-2 border-dashed border-blue-500/20 rounded-3xl p-8">
        <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
           <AlertTriangle className="w-5 h-5" /> Important: Permission Declaration
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Google Play requires a <strong>Video Demonstration</strong> for apps using Accessibility Services. 
          The video must show the full user journey: from the parent requesting the lock to the child seeing the block screen.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 p-4 bg-black/40 rounded-xl border border-white/5">
             <div className="text-[10px] uppercase font-black text-zinc-600 tracking-widest mb-1">Permission Declaration</div>
             <div className="text-blue-300 text-xs font-mono">"I certify that KiteControl uses AccessibilityServices only for child protection as defined in the Parental Control policy..."</div>
           </div>
           <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-xs font-black uppercase tracking-widest self-center transition-all">
             View Compliance Spec
           </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="p-4 bg-[#1a1a1a] border border-zinc-800 rounded-2xl flex items-center gap-4">
           <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
             <CheckCircle2 className="w-5 h-5 text-green-500" />
           </div>
           <div>
             <div className="text-xs font-bold text-white">Project Export Ready</div>
             <div className="text-[10px] text-zinc-500">Run 'flutter build appbundle' to begin.</div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function Testing() {
  const categories = [
    {
      title: "Permission Criticals",
      icon: Lock,
      items: [
        { label: "Accessibility Service", desc: "Ensure it re-enables automatically after app force-stop (Oreo+ behavior)." },
        { label: "Usage Access", desc: "Verify stats retrieval for both pre-installed and newly installed apps." },
        { label: "Overlay Support", desc: "Test if block screen appears over 'Recents' and 'Split Screen' modes." },
        { label: "Device Admin", desc: "Confirm 'Uninstall' button is disabled in System Settings." }
      ]
    },
    {
      title: "Power & Lifecycle",
      icon: Battery,
      items: [
        { label: "Doze Mode", desc: "Trigger 'adb shell dumpsys deviceidle force-idle' and test FCM delivery." },
        { label: "App Standby", desc: "Check if Foreground Service survives 24+ hours of device inactivity." },
        { label: "Low Memory (LMK)", desc: "Simulate high memory pressure; system must restart Guardian service." },
        { label: "Battery Saver", desc: "Verify location updates continue (at reduced frequency) when mode active." }
      ]
    },
    {
      title: "Platform Specifics",
      icon: Smartphone,
      items: [
        { label: "OEM Restrictions", desc: "Test on Samsung (Auto-Optimization) and Xiaomi (Battery Saver restrictions)." },
        { label: "Android 13/14+", desc: "Verify 'Restricted Settings' block for side-loaded Accessibility Services." },
        { label: "Multi-User Profile", desc: "Confirm agent behavior when device switches to 'Guest' or 'Work' profile." }
      ]
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="QA & Testing Checklist" 
        subtitle="Ensuring persistence and reliability across the fragmented Android ecosystem is critical for parental safety applications."
        icon={CheckSquare}
      />

      <div className="space-y-12">
        {/* Direct APK Installation Hub */}
        <div className="bg-[#1a1a1a] border border-orange-500/20 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ZapIcon className="w-48 h-48 text-orange-500" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Smartphone className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Direct APK Installation (Sideloading)</h3>
            </div>
            
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-2xl">
              To check the app immediately without waiting for the Play Store review, you can install the <strong>Release APK</strong> directly on your Android device. 
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">Generate Release APK</h4>
                    <p className="text-zinc-500 text-xs mb-3">Run the following command in your project root to build a universal APK:</p>
                    <div className="bg-black/60 p-3 rounded-lg border border-white/5 font-mono text-[10px] text-orange-400">
                      flutter build apk --release
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">Enable Unknown Sources</h4>
                    <p className="text-zinc-500 text-xs">On the child device: <strong>Settings &gt; Apps &gt; Special app access &gt; Install unknown apps</strong>. Select your file manager or browser and toggle <strong>Allow</strong>.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-orange-950/10 border border-orange-900/30 rounded-2xl">
                  <h4 className="text-orange-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Android 13+ Warning
                  </h4>
                  <p className="text-zinc-500 text-[11px] leading-relaxed italic">
                    When sideloading, Android may block "Restricted Settings" (Accessibility). 
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-2 leading-relaxed">
                    <strong>Fix:</strong> Go to App Info &gt; Triple Dot (top right) &gt; Select <strong>"Allow restricted settings"</strong>, then re-enable Accessibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <cat.icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-bold text-white uppercase tracking-tight text-sm">{cat.title}</h3>
              </div>
              <div className="space-y-4">
                {cat.items.map((item, iIdx) => (
                  <div key={iIdx} className="group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500/40 group-hover:bg-orange-500 transition-colors" />
                      <div>
                        <div className="text-sm font-medium text-zinc-200 mb-1">{item.label}</div>
                        <div className="text-xs text-zinc-500 leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-zinc-950 border border-[#2a2a2a] rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Bug className="text-orange-500 w-6 h-6" />
            <h3 className="text-xl font-bold text-white">Debugging & ADB Tips</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                <div className="text-xs font-bold text-zinc-600 mb-2 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> Monitor Logs
                </div>
                <code className="text-[10px] text-zinc-400 break-all">
                  adb logcat -s Guardian:D Usage:D Blocking:D
                </code>
              </div>
              <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                <div className="text-xs font-bold text-zinc-600 mb-2 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> Test Doze (FCM Priority)
                </div>
                <code className="text-[10px] text-zinc-400">
                  adb shell dumpsys deviceidle step [repeat until IDLE]
                </code>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-orange-950/10 border border-orange-900/20 rounded-lg">
                <h4 className="text-orange-400 text-sm font-bold mb-2">Common Pitfall: Restricted Settings</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  On Android 13+, side-loaded apps may have "Restricted Settings" enabled for Accessibility. 
                  Users MUST go to <strong>App Info &gt; Triple Dot (top right) &gt; Allow restricted settings</strong> before re-attempting permission grant.
                </p>
              </div>

              <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-lg">
                <h4 className="text-red-400 text-sm font-bold mb-2 flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> VPN Bypass Prevention
                </h4>
                <div className="space-y-2 text-xs text-zinc-500 leading-relaxed">
                   <p>• <strong>Always-on VPN:</strong> We utilize Android's `setAlwaysOnVpn` intent to prompt parents to enable the platform-level lock.</p>
                   <p>• <strong>DNS-over-HTTPS (DoH) Block:</strong> Our filtering logic marks common DoH providers (Cloudflare, Google) as "Blocked" to prevent browsers from using encrypted DNS to bypass our local resolver.</p>
                   <p>• <strong>Kill Switch:</strong> If the `VpnService` is manually disconnected, the app triggers a `DeviceAdmin` lockdown until reconnected.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Previews() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <SectionHeading 
        title="Application Previews" 
        subtitle="Visualizing the cross-device experience between the Parent Dashboard and the Child Guardian agent."
        icon={Layers}
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Parent Dashboard Mockup */}
        <div className="space-y-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" /> Parent Dashboard
          </h3>
          <div className="aspect-[9/16] max-w-[320px] mx-auto bg-[#0a0a0a] rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="h-6 w-32 bg-zinc-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20" />
            <div className="flex-1 p-6 pt-10 overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <div className="space-y-1">
                   <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Good Morning</div>
                   <div className="text-lg font-bold text-white">Parent Hub</div>
                 </div>
                 <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/30">
                    <CheckCircle2 className="w-5 h-5 text-orange-500" />
                 </div>
               </div>

               <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl mb-6">
                 <div className="flex justify-between items-end">
                   <div>
                     <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Today's Screen Time</div>
                     <div className="text-3xl font-bold text-white">4h 12m</div>
                   </div>
                   <div className="text-xs text-red-400 font-bold">+12% vs yest.</div>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="text-sm font-bold text-zinc-400 px-1">Top Apps</div>
                 {[
                   { name: 'TikTok', time: '1h 45m', color: 'bg-pink-500' },
                   { name: 'YouTube', time: '1h 12m', color: 'bg-red-500' },
                   { name: 'Roblox', time: '45m', color: 'bg-blue-500' },
                 ].map(app => (
                   <div key={app.name} className="flex items-center gap-3 p-3 bg-zinc-900/40 rounded-xl border border-white/5">
                      <div className={`w-10 h-10 rounded-lg ${app.color} opacity-20 flex items-center justify-center text-white font-bold`}>{app.name[0]}</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">{app.name}</div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className={`h-full ${app.color}`} />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-zinc-500">{app.time}</div>
                   </div>
                 ))}
               </div>
            </div>
            {/* Bottom Nav */}
            <div className="h-16 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-around px-4">
              <div className="text-orange-500"><Activity className="w-5 h-5" /></div>
              <div className="text-zinc-600"><MapPin className="w-5 h-5" /></div>
              <div className="text-zinc-600"><Lock className="w-5 h-5" /></div>
            </div>
          </div>
        </div>

        {/* Child App Mockup */}
        <div className="space-y-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" /> Child Guardian (Device Locked)
          </h3>
          <div className="aspect-[9/16] max-w-[320px] mx-auto bg-black rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center p-8">
             <motion.div 
               animate={{ scale: [1, 1.1, 1] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/20"
             >
                <Lock className="w-10 h-10 text-orange-500" />
             </motion.div>
             <h2 className="text-2xl font-bold text-white mb-2 italic tracking-tight">Time to Fly a Kite.</h2>
             <p className="text-zinc-500 text-sm mb-12">Your daily screen limit has been reached. Go play outside!</p>
             
             <div className="w-full space-y-3">
               <div className="p-4 bg-zinc-900 rounded-2xl text-xs font-bold text-zinc-400 border border-white/5">
                  Next Unlocking at 8:00 AM
               </div>
               <button className="w-full p-4 border border-zinc-800 rounded-2xl text-xs font-bold text-zinc-600 uppercase tracking-widest">
                  Request Extra Time
               </button>
             </div>

             <div className="absolute bottom-8 text-[10px] text-zinc-700 font-mono">
               GUARDED_BY_KITE_TECH_V1
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Geofencing() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="Integrated Family Map" 
        subtitle="Real-time geographic zone monitoring and sub-second child device tracking on a single high-fidelity interface."
        icon={MapPin}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <div className="space-y-6">
          <div className="p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" /> Real-Time Telemetry
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Child locations are streamed from the native Android background agent directly to our geofencing engine for instant analysis.
            </p>
            <div className="space-y-3">
              {[
                { label: "Live Markers", desc: "Child positions are rendered as distinct map markers with pulse animations for movement." },
                { label: "Safe vs Restricted", desc: "Orange 'Safe' zones for known locations (School/Home) and Red 'Restricted' zones for danger areas." },
                { label: "Notification Prefs", desc: "Parents can customize exactly which transitions (Enter/Leave) trigger push notifications per zone type." },
                { label: "Smart Automations", desc: "Context-aware rules that trigger based on battery, activity (Walking/Still), or location status." },
                { label: "Offline Resilience", desc: "Rules are cached on-device with zero-TTL local persistence. Enforcement continues seamlessly without internet." },
                { label: "Emergency Response", desc: "Detection of a restricted zone entrance triggers an immediate 15-minute device lockdown." },
                { label: "Atomic Logging", desc: "Event transitions (Enter/Exit) are logged with server-side timestamps." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                   <div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                   <div>
                     <div className="text-xs font-bold text-zinc-200">{item.label}</div>
                     <div className="text-[11px] text-zinc-500">{item.desc}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 p-6 rounded-xl border border-white/5 font-mono text-[11px]">
             <div className="text-zinc-600 mb-2">// Geofence Transition Detector</div>
             <div className="text-zinc-400">const entered = currentFences.filter(id =&gt; !prevFences.includes(id));</div>
             <div className="text-zinc-400">const left = prevFences.filter(id =&gt; !currentFences.includes(id));</div>
             <div className="text-orange-500 mt-3">entered.forEach(zone =&gt; notifyParents(familyId, "Entered Zone", zone.name));</div>
          </div>
        </div>

        <div className="relative aspect-square md:aspect-video lg:aspect-auto bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 overflow-hidden flex items-center justify-center">
           <div className="relative">
              {/* Mock Map UI */}
              <div className="w-64 h-64 border-2 border-orange-500/30 rounded-full bg-orange-500/5 flex items-center justify-center animate-pulse">
                 <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap">
                   SAFE_ZONE: AT_SCHOOL
                 </div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 border-2 border-zinc-800 rounded-full bg-zinc-800/10" />
           </div>
           <div className="absolute bottom-4 left-4 text-[10px] font-mono text-zinc-700">KITE_GEOMAP_ENGINE_V2</div>
        </div>
      </div>
    </motion.div>
  );
}

function Guardian() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeading 
        title="Android Guardian Implementation" 
        subtitle="The system integration required to enforce policies on the child's device using native Android APIs."
        icon={ShieldAlert}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" /> Critical Permissions
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h4 className="text-zinc-200 text-sm font-bold">Usage Stats (App Usage)</h4>
              <p className="text-zinc-500 text-xs mt-1">Allows the app to read the foreground package and total time in foreground via <code>UsageStatsManager</code>.</p>
              <div className="mt-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">PACKAGE_USAGE_STATS</div>
              <div className="mt-3 bg-black/40 p-2 rounded text-[10px] text-zinc-500 font-mono">
                // Kotlin Bridge<br/>
                usageStatsManager.queryUsageStats(<br/>
                &nbsp;&nbsp;INTERVAL_DAILY, start, end<br/>
                )
              </div>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h4 className="text-zinc-200 text-sm font-bold">System Overlay (Draw Over)</h4>
              <p className="text-zinc-500 text-xs mt-1">Allows the app to display a full-screen block message over unauthorized applications.</p>
              <div className="mt-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">SYSTEM_ALERT_WINDOW</div>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h4 className="text-zinc-200 text-sm font-bold">Accessibility Service</h4>
              <p className="text-zinc-400 text-xs mt-1 font-bold">The Core Engine.</p>
              <p className="text-zinc-500 text-xs text-balance">
                Used to intercept window state changes. Provides <strong>Anti-Uninstall</strong> by blocking access to <code>DeviceAdminSettings</code> and <code>AppManagement</code> fragments within the System Settings app.
              </p>
              <div className="mt-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">BIND_ACCESSIBILITY_SERVICE</div>
            </div>
            <div className="p-4 bg-orange-950/20 border border-orange-900/30 rounded-lg">
              <h4 className="text-orange-200 text-sm font-bold flex items-center gap-2">
                <Moon className="w-4 h-4" /> Bedtime Lockdown
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                When active, the system enters a <strong>Global Lockdown</strong> state. The Accessibility Service intercepts ALL non-critical window events and forces the device to a "Time for Sleep" overlay screen.
              </p>
            </div>
            <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg">
              <h4 className="text-blue-300 text-sm font-bold flex items-center gap-2">
                <Camera className="w-4 h-4" /> Environment Monitoring
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Triggered by parent "Snapshot Requests". The child agent initializes a headless camera session to capture <code>Surroundings Verification</code> images, transmitted via end-to-end encrypted streams.
              </p>
            </div>
            <div className="p-4 bg-purple-950/20 border border-purple-900/30 rounded-lg">
              <h4 className="text-purple-300 text-sm font-bold flex items-center gap-2">
                <Search className="w-4 h-4" /> Contextual Enforcement
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                High-frequency telemetry (Battery, Charging, Motion) is analyzed by the <code>Vesting Engine</code>. Policies like "Block Games at School" or "Lock Screen on Low Battery" are dynamically applied via reactive streams.
              </p>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg">
              <h4 className="text-zinc-200 text-sm font-bold flex items-center gap-2">
                 <DatabaseIcon className="w-4 h-4 text-zinc-500" /> Offline Rule Cache
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Utilizes Firestore's <strong>IndexedDB-backed persistence</strong>. Rules are cached locally upon sync; the <code>BlockingService</code> reads from the local store first if the device is offline, ensuring 100% enforcement uptime.
              </p>
            </div>
            <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-lg">
              <h4 className="text-red-400 text-sm font-bold flex items-center gap-2">
                 <Lock className="w-4 h-4 text-red-500" /> Bypass Prevention
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Self-healing system monitoring. The <code>GuardianService</code> detects tampering with system permissions or settings. Detection triggers an <strong>Instant Lockdown</strong> (Global Block) and parent notification via high-priority FCM.
              </p>
            </div>
            <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-lg">
              <h4 className="text-red-400 text-sm font-bold">Device Administrator</h4>
              <p className="text-zinc-500 text-xs mt-1">Prevents standard app uninstallation by requiring the admin privilege to be deactivated first (which is guarded by Accessibility Service).</p>
              <div className="mt-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">USES_POLICY_FORCE_LOCK</div>
            </div>
            <div className="p-4 bg-orange-950/20 border border-orange-900/30 rounded-lg">
              <h4 className="text-orange-300 text-sm font-bold">Reactive Enforcement</h4>
              <p className="text-zinc-500 text-xs mt-1">Aggregates Firestore streams (Limits + Logs). If <code>Usage &gt;= Limit</code>, the app is added to the native block list in sub-second time.</p>
              <div className="mt-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">THRESHOLD_LOGIC_V1</div>
            </div>
            <div className="p-4 bg-green-950/20 border border-green-900/30 rounded-lg">
              <h4 className="text-green-400 text-sm font-bold flex items-center gap-2">
                 <Zap className="w-4 h-4 text-green-500" /> Child-Centric UX
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Reframes parental control as "Digital Adventure". Replaces harsh blocking with <strong>Motivational Guidance</strong>, achievement streaks, and a "Kite Flight" visual metaphor to reduce friction and encourage healthy habits.
              </p>
            </div>
            <div className="p-4 bg-yellow-950/20 border border-yellow-900/30 rounded-lg">
              <h4 className="text-yellow-400 text-sm font-bold flex items-center gap-2">
                 <Activity className="w-4 h-4 text-yellow-500" /> Smart Summary Engine
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Aggregates daily usage data into a single, high-signal <strong>Plain Text Summary</strong>. Implements intelligent anti-spam filtering that throttles redundant alerts while ensuring critical safety events are delivered instantly.
              </p>
            </div>
            <div className="p-4 bg-purple-950/20 border border-purple-900/30 rounded-lg">
              <h4 className="text-purple-300 text-sm font-bold flex items-center gap-2">
                 <Bug className="w-4 h-4 text-purple-400" /> AI Auto-Pilot
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Behavioral analysis engine that adjusts rules with zero effort. Detects <strong>Usage Trends</strong>, distinguishes between Weekends and School Hours, and automatically suggests (or applies) policy optimizations to reduce parental workload.
              </p>
            </div>
            <div className="p-4 bg-blue-950/10 border border-blue-900/30 rounded-lg">
              <h4 className="text-blue-400 text-sm font-bold flex items-center gap-2">
                 <ZapIcon className="w-4 h-4 text-blue-500" /> One-Tap Control
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                High-speed parental command center inspired by mobile OS control panels. Provides <strong>instant access</strong> to critical overrides like total pauses, bonus time, and sleep mode with zero-latency visual feedback.
              </p>
            </div>
            <div className="p-4 bg-red-950/30 border border-red-900/30 rounded-lg">
              <h4 className="text-red-500 text-sm font-bold flex items-center gap-2">
                 <ShieldAlert className="w-4 h-4 text-red-500" /> Panic Alert System
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Mission-critical emergency protocol. Triggering the <strong>Panic Button</strong> initiates an immediate sub-second device lockdown, broadcasts the child's live location to all linked parents, and escalates to top-tier FCM alerting.
              </p>
            </div>
            <div className="p-4 bg-orange-950/20 border border-orange-900/30 rounded-lg">
              <h4 className="text-orange-400 text-sm font-bold flex items-center gap-2">
                 <Search className="w-4 h-4 text-orange-500" /> Auto-Setup Discovery
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Zero-friction onboarding engine. Automatically scans child’s routes to detect <strong>Nearby Schools, Mosques, and Churches</strong>, proactively suggesting the appropriate Smart Modes before the parent even manually configures them.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 overflow-hidden">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" /> Background Persistence
          </h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            To prevent Android from killing the child agent, we implement a 
            <strong> Foreground Service</strong> with a persistent notification.
          </p>
          <div className="bg-zinc-950 p-4 rounded-lg font-mono text-xs text-zinc-500 space-y-2">
            <div>// AndroidManifest.xml excerpt</div>
            <div className="text-blue-500">&lt;service android:name=".GuardianService"</div>
            <div className="text-blue-500 pl-4">android:foregroundServiceType="specialUse" /&gt;</div>
            <div className="pt-4 text-zinc-600">// Real-time Blocking Engine</div>
            <div className="text-zinc-400">onAccessibilityEvent(event) &#123;</div>
            <div className="text-zinc-400 pl-4">if (blockedApps.contains(event.packageName)) &#123;</div>
            <div className="text-orange-500 pl-8">performGlobalAction(GLOBAL_ACTION_HOME);</div>
            <div className="text-blue-400 pl-8">startActivity(BlockedOverlay(packageName));</div>
            <div className="text-zinc-400 pl-4">&#125;</div>
            <div className="text-zinc-400">&#125;</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isControlOpen, setIsControlOpen] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    testFirebaseConnection().then(connected => {
      setFirebaseStatus(connected ? 'connected' : 'error');
    });
  }, []);

  const consoleLink = "https://console.firebase.google.com/project/gen-lang-client-0236511878/firestore/databases/ai-studio-a9fc1d2e-6774-4ecb-9b5f-99a4e6513f3a/data";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30">
      <Header 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <ControlCenter isOpen={isControlOpen} onClose={() => setIsControlOpen(false)} />

      <button 
        onClick={() => setIsControlOpen(true)}
        className="fixed bottom-36 right-6 z-40 w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] text-white hover:scale-110 transition-transform active:scale-95 group"
        title="Quick Controls"
      >
        <ZapIcon className="w-7 h-7" />
        <div className="absolute right-full mr-4 px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Quick Control
        </div>
      </button>

      <div className="fixed bottom-16 right-6 z-40">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] p-3 rounded-lg shadow-2xl flex items-center gap-3"
        >
          {firebaseStatus === 'checking' && <Activity className="w-4 h-4 text-zinc-500 animate-spin" />}
          {firebaseStatus === 'connected' && <Wifi className="w-4 h-4 text-green-500" />}
          {firebaseStatus === 'error' && <WifiOff className="w-4 h-4 text-red-500" />}
          
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-zinc-500 leading-none">Firebase Status</span>
            <span className="text-xs text-zinc-300 font-medium">
              {firebaseStatus === 'checking' ? 'Initializing...' : firebaseStatus === 'connected' ? 'Connected' : 'Sync Error'}
            </span>
          </div>
          
          <div className="w-[1px] h-8 bg-[#2a2a2a] mx-1" />
          
          <a 
            href={consoleLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded text-xs font-bold text-white transition-colors pointer-events-auto"
          >
            Console <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </div>

      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeSection === 'overview' && <Overview key="overview" />}
          {activeSection === 'previews' && <Previews key="previews" />}
          {activeSection === 'components' && <Components key="components" />}
          {activeSection === 'data-flow' && <DataFlow key="data-flow" />}
          {activeSection === 'database' && <Database key="database" />}
          {activeSection === 'security' && <Security key="security" />}
          {activeSection === 'implementation' && <Implementation key="implementation" />}
          {activeSection === 'guardian' && <Guardian key="guardian" />}
          {activeSection === 'geofencing' && <Geofencing key="geofencing" />}
          {activeSection === 'smart-modes' && <SmartModesView key="smart-modes" />}
          {activeSection === 'content-filtering' && <ContentFilteringView key="content-filtering" />}
          {activeSection === 'publishing' && <PublishingView key="publishing" />}
          {activeSection === 'testing' && <Testing key="testing" />}
        </AnimatePresence>
    </main>

      <footer className="fixed bottom-0 left-0 right-0 py-3 bg-[#141414] border-t border-[#2a2a2a] px-8 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
          <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             SPEC V1.0.4 - DRAFT
          </div>
          <div>SYSTEM_READY</div>
        </div>
        <div className="text-[10px] text-zinc-700 font-mono">
          © 2026 KITE_TECH_CORE_ARCH
        </div>
      </footer>
    </div>
  );
}

