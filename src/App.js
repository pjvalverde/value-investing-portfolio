import './App.css';
import PortfolioBuilder from './components/builder/PortfolioBuilder';

function App() {
  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-logo">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="#C9A84C" />
                <polygon points="18,6 30,28 6,28" fill="#0D1B2A" opacity="0.85"/>
                <polygon points="18,12 26,26 10,26" fill="#C9A84C" opacity="0.5"/>
              </svg>
            </div>
            <div className="brand-text">
              <h1 className="brand-name">ValuePort AI</h1>
              <p className="brand-tagline">Plataforma de Inversión Inteligente</p>
            </div>
          </div>
          <div className="header-meta">
            <div className="meta-philosophers">
              <span className="philosopher-tag">Buffett</span>
              <span className="philosopher-sep">·</span>
              <span className="philosopher-tag">Munger</span>
              <span className="philosopher-sep">·</span>
              <span className="philosopher-tag">Damodaran</span>
            </div>
            <div className="meta-badge">AI-Powered Portfolio Builder</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="app-main">
        <PortfolioBuilder />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <p className="footer-disclaimer">
            ⚠ Solo con fines educativos e informativos. No constituye asesoría financiera.
            Siempre consulta con un profesional financiero certificado antes de invertir.
          </p>
          <p className="footer-credits">
            ValuePort AI · Filosofía: Buffett/Munger + Damodaran · Datos: Perplexity AI + Yahoo Finance
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
