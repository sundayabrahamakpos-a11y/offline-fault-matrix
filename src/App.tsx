import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, Faders, Image, Compass, Clipboard, User, MagnifyingGlass, X, CaretRight, SquaresFour, Sparkle, Terminal, BookOpen, MapPin, Wrench, Code, GearSix, List } from "@phosphor-icons/react";
import type { ViewRoute } from "./types";
import { HomeView, FaultsView, FaultDetailView, ParametersView, ParameterDetailView, DiagramsView, DiagramDetailView, GuidesView, GuideDetailView, ServiceLogView, InfoView } from "./components/MainViews";

const NAV_ITEMS: { route: ViewRoute; label: string; icon: React.ElementType }[] = [
  { route: "home", label: "Home", icon: SquaresFour },
  { route: "faults", label: "Faults", icon: Bug },
  { route: "parameters", label: "Params", icon: Faders },
  { route: "diagrams", label: "Diagrams", icon: Image },
  { route: "guides", label: "Guides", icon: Compass },
  { route: "log", label: "Log", icon: Clipboard },
  { route: "info", label: "Info", icon: User },
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewRoute>("home");
  const [selectedFaultCode, setSelectedFaultCode] = useState<string | null>(null);
  const [selectedParameterCode, setSelectedParameterCode] = useState<string | null>(null);
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && inputRef.current) inputRef.current.focus();
  }, [showSearch]);

  const navigate = useCallback((route: ViewRoute, arg?: string) => {
    setCurrentView(route);
    setDrawerOpen(false);
    setShowSearch(false);
    if (route === "fault-detail" && arg) setSelectedFaultCode(arg);
    else if (route === "param-detail" && arg) setSelectedParameterCode(arg);
    else if (route === "diagram-detail" && arg) setSelectedDiagramId(arg);
    else if (route === "guide-detail" && arg) setSelectedGuideId(arg);
  }, []);

  const goBack = useCallback(() => {
    if (currentView === "fault-detail" || currentView === "param-detail" || currentView === "diagram-detail" || currentView === "guide-detail") {
      const parent: Record<string, ViewRoute> = {
        "fault-detail": "faults", "param-detail": "parameters",
        "diagram-detail": "diagrams", "guide-detail": "guides",
      };
      setCurrentView(parent[currentView] || "home");
    }
  }, [currentView]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
  };

  const renderView = () => {
    switch (currentView) {
      case "home":
        return <HomeView onNavigate={navigate} />;
      case "faults":
        return <FaultsView onNavigate={navigate} searchQuery={searchQuery} />;
      case "fault-detail":
        return selectedFaultCode ? (
          <FaultDetailView code={selectedFaultCode} onNavigate={navigate} onBack={goBack} />
        ) : (
          <FaultsView onNavigate={navigate} searchQuery={searchQuery} />
        );
      case "parameters":
        return <ParametersView onNavigate={navigate} searchQuery={searchQuery} />;
      case "param-detail":
        return selectedParameterCode ? (
          <ParameterDetailView code={selectedParameterCode} onBack={goBack} onNavigate={navigate} />
        ) : (
          <ParametersView onNavigate={navigate} searchQuery={searchQuery} />
        );
      case "diagrams":
        return <DiagramsView onNavigate={navigate} searchQuery={searchQuery} />;
      case "diagram-detail":
        return selectedDiagramId ? (
          <DiagramDetailView id={selectedDiagramId} onBack={goBack} onNavigate={navigate} />
        ) : (
          <DiagramsView onNavigate={navigate} searchQuery={searchQuery} />
        );
      case "guides":
        return <GuidesView onNavigate={navigate} searchQuery={searchQuery} />;
      case "guide-detail":
        return selectedGuideId ? (
          <GuideDetailView id={selectedGuideId} onBack={goBack} onNavigate={navigate} />
        ) : (
          <GuidesView onNavigate={navigate} searchQuery={searchQuery} />
        );
      case "log":
        return <ServiceLogView onNavigate={navigate} />;
      case "info":
        return <InfoView />;
      default:
        return <HomeView onNavigate={navigate} />;
    }
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-background">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 mx-auto max-w-md">
        <div className="flex items-center justify-between bg-white/90 px-4 py-3 backdrop-blur-lg">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#154734] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#154734]/90"
          >
            <List size={16} weight="bold" />
            Menu
          </button>
          <div className="text-center">
            <div className="text-sm font-extrabold text-[#154734]">NICE3000new</div>
            <div className="text-[10px] text-muted-foreground">Fault Finder</div>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`rounded-xl p-2 transition-colors ${
              showSearch ? "bg-[#e0b800] text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>
        </div>
        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border bg-white px-4"
            >
              <div className="relative pb-3 pt-2">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search faults, params, diagrams..."
                  className="w-full rounded-xl border border-border bg-muted py-2.5 pl-9 pr-9 text-sm outline-none ring-[#154734]/30 transition-all focus:border-[#154734] focus:ring-2"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {(currentView === "faults" || currentView === "parameters" || currentView === "diagrams" || currentView === "guides") && (
                <div className="pb-3 text-[10px] text-muted-foreground">
                  Searching within current view
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (selectedFaultCode || selectedParameterCode || selectedDiagramId || selectedGuideId || "")}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15, ease: "easeInOut" as const }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-white/90 backdrop-blur-lg">
        <div className="flex items-center justify-around px-2 py-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.route ||
              (item.route === "faults" && (currentView === "fault-detail")) ||
              (item.route === "parameters" && (currentView === "param-detail")) ||
              (item.route === "diagrams" && (currentView === "diagram-detail")) ||
              (item.route === "guides" && (currentView === "guide-detail"));
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                  isActive ? "text-[#154734]" : "text-muted-foreground"
                }`}
              >
                <item.icon size={20} weight={isActive ? "fill" : "regular"} />
                <span className={`text-[10px] font-semibold ${isActive ? "text-[#154734]" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-white p-6 shadow-2xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-[#154734]">NICE3000new</div>
                  <div className="text-[10px] text-muted-foreground">Fault Finder v1.0</div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl bg-muted p-2 text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = currentView === item.route ||
                    (item.route === "faults" && currentView === "fault-detail") ||
                    (item.route === "parameters" && currentView === "param-detail") ||
                    (item.route === "diagrams" && currentView === "diagram-detail") ||
                    (item.route === "guides" && currentView === "guide-detail");
                  return (
                    <button
                      key={item.route}
                      onClick={() => navigate(item.route)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        isActive ? "bg-[#154734] text-white" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon size={18} weight={isActive ? "fill" : "regular"} />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 rounded-xl border border-[#e0b800]/30 bg-[#e0b800]/5 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#154734]">
                  <Sparkle size={14} className="text-[#e0b800]" />
                  Offline Ready
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  All data is stored locally. No internet connection required.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}