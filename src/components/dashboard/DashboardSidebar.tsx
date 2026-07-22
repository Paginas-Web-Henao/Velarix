import { Home, PlusCircle, FolderOpen, FileText, User, LogOut, ClipboardCheck } from "lucide-react";

export type DashboardView = "inicio" | "nuevo" | "analisis" | "reportes" | "perfil" | "qa";

interface Props {
  active: DashboardView;
  onChange: (view: DashboardView) => void;
  onLogout: () => void;
  userName: string;
}

const items: { key: DashboardView; label: string; icon: typeof Home }[] = [
  { key: "inicio", label: "Inicio", icon: Home },
  { key: "nuevo", label: "Nuevo análisis", icon: PlusCircle },
  { key: "analisis", label: "Mis análisis", icon: FolderOpen },
  { key: "reportes", label: "Mis reportes", icon: FileText },
  { key: "perfil", label: "Perfil", icon: User },
  { key: "qa", label: "QA Checklist", icon: ClipboardCheck },
];

const DashboardSidebar = ({ active, onChange, onLogout, userName }: Props) => (
  <aside className="w-56 shrink-0 bg-card border-r border-border min-h-[calc(100vh-3.5rem)] flex flex-col">
    <div className="px-4 py-5 border-b border-border">
      <p className="font-body text-xs text-muted-foreground truncate">{userName}</p>
    </div>
    <nav className="flex-1 py-3">
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 font-body text-sm transition-colors ${
            active === key
              ? "text-primary bg-primary/10 border-l-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent"
          }`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </nav>
    <div className="p-4 border-t border-border">
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-2 py-2 font-body text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
      >
        <LogOut size={14} />
        Cerrar sesión
      </button>
    </div>
  </aside>
);

export default DashboardSidebar;
