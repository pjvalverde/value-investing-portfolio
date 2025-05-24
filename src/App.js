import './App.css';
import PortfolioBuilder from './components/builder/PortfolioBuilder';

function App() {
  return (
    <div className="App" style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <h1>Value Investing Portfolio App</h1>
      <PortfolioBuilder />
    </div>
  );
}

export default App;
