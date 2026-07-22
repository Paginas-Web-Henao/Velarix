import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, User, LogOut, LayoutDashboard, FileText, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Plataforma", href: "#platform" },
  { label: "Metodología", href: "#methodology" },
  { label: "Benchmarks", href: "#benchmarks" },
  { label: "Reportes", href: "#reports" },
];

interface Props {
  onOpenDemo?: () => void;
}

const Navbar = ({ onOpenDemo }: Props) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSolicitarDemo = () => {
    navigate("/auth");
  };

  const handleExplorar = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-foreground">
          Velarix
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              {link.label}
            </a>
          ))}
          <button onClick={onOpenDemo} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Demo
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="max-w-[120px] truncate">{user.user_metadata?.full_name || user.email?.split("@")[0]}</span>
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-card metallic-border rounded-lg shadow-xl z-50 py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 font-body text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <LayoutDashboard size={15} /> Mi dashboard
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 font-body text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <FileText size={15} /> Mis análisis
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 font-body text-sm text-destructive hover:bg-destructive/10 w-full text-left transition-colors"
                    >
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/auth" className="font-body text-sm px-4 py-2 rounded metallic-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200">
                Iniciar sesión
              </Link>
              <button
                onClick={handleSolicitarDemo}
                className="font-body text-sm px-5 py-2 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 shadow-lg shadow-primary/20 active:scale-[0.97]"
              >
                Solicitar demo
              </button>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="md:hidden glass-dark border-t border-border px-6 pb-6 pt-4 space-y-4">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="block font-body text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
          <button onClick={() => { onOpenDemo?.(); setMobileOpen(false); }} className="block font-body text-sm text-muted-foreground hover:text-foreground w-full text-left">
            Demo
          </button>
          <div className="flex flex-col gap-3 pt-2">
            {user ? (
              <>
                <Link to="/dashboard" className="font-body text-sm px-4 py-2 rounded bg-primary text-primary-foreground text-center" onClick={() => setMobileOpen(false)}>Mi dashboard</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="font-body text-sm px-4 py-2 rounded metallic-border text-destructive text-center">Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link to="/auth" className="font-body text-sm px-4 py-2 rounded metallic-border text-muted-foreground text-center" onClick={() => setMobileOpen(false)}>Iniciar sesión</Link>
                <button onClick={() => { handleSolicitarDemo(); setMobileOpen(false); }} className="font-body text-sm px-5 py-2 rounded bg-primary text-primary-foreground text-center">Solicitar demo</button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
