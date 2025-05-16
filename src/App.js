import './App.css';
import { useState } from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  Paper, 
  CircularProgress,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import SearchFlow, { SEARCH_STEPS } from './components/SearchFlow';

function App() {
  const [formData, setFormData] = useState({
    amount: '',
    horizon: 'largo', // corto, mediano, largo
  });
  
  const [searchState, setSearchState] = useState({
    step: SEARCH_STEPS.INITIAL,
    results: null,
    loading: false,
    error: null
  });
  
  const [analysis, setAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [comparativeData, setComparativeData] = useState([]);

  const handleStartSearch = (data) => {
    setFormData(data);
    setSearchState(prevState => ({
      ...prevState,
      step: SEARCH_STEPS.SEARCHING,
      loading: true,
      error: null
    }));
  };

  const handleSearchComplete = (results) => {
    setSearchState(prevState => ({
      ...prevState,
      step: SEARCH_STEPS.COMPLETED,
      results,
      loading: false
    }));
  }; 
  
  const handleError = (error) => {
    setSearchState(prevState => ({
      ...prevState,
      step: SEARCH_STEPS.ERROR,
      error: error || 'Ocurrió un error en la búsqueda',
      loading: false
    }));
  };

  const resetSearch = () => {
    setSearchState({
      step: SEARCH_STEPS.INITIAL,
      results: null,
      loading: false,
      error: null
    });
  };
  
  // Componentes de la interfaz de usuario
  const renderInitialForm = () => (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Value Investing Portfolio Builder
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configura tu portafolio
        </Typography>
        
        <Box component="form" onSubmit={(e) => {
          e.preventDefault();
          if (formData.amount) {
            handleStartSearch(formData);
          }
        }}>
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Monto a invertir (USD)</Typography>
            <TextField
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              min="100"
              step="100"
              required
              fullWidth
              sx={{ mt: 1 }}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Horizonte de inversión</Typography>
            <FormControl fullWidth>
              <InputLabel id="horizon-select-label">Horizonte de inversión</InputLabel>
              <Select
                labelId="horizon-select-label"
                id="horizon-select"
                value={formData.horizon}
                label="Horizonte de inversión"
                onChange={(e) => setFormData({...formData, horizon: e.target.value})}
              >
                <MenuItem value="corto">Corto plazo (menos de 5 años)</MenuItem>
                <MenuItem value="mediano">Mediano plazo (5-10 años)</MenuItem>
                <MenuItem value="largo">Largo plazo (más de 10 años)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Button
            type="submit"
            disabled={!formData.amount}
            variant="contained"
            sx={{ mt: 2, width: '100%' }}
          >
            {searchState.loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Generar Portafolio'
            )}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
  
  const renderSearchFlow = () => (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <SearchFlow 
        amount={formData.amount}
        horizon={formData.horizon}
        onSearchComplete={handleSearchComplete}
        onError={handleError}
      />
      
      {searchState.step === SEARCH_STEPS.ERROR && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
          <Typography color="error">{searchState.error}</Typography>
          <Button 
            onClick={resetSearch}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Volver al inicio
          </Button>
        </Box>
      )}
    </Container>
  );
  
  const renderResults = () => {
    if (!searchState.results) return null;
    
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Resultados de tu portafolio
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Análisis del portafolio</Typography>
          <Paper sx={{ p: 3, mt: 2, bgcolor: '#f5f5f5' }}>
            {searchState.results.analysis?.analysis || 'No hay análisis disponible'}
          </Paper>
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={resetSearch}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Realizar otra búsqueda
          </Button>
        </Box>
      </Container>
    );
  }; 
  
  // Renderizado principal
  const renderContent = () => {
    switch(searchState.step) {
      case SEARCH_STEPS.INITIAL:
        return renderInitialForm();
      case SEARCH_STEPS.COMPLETED:
        return renderResults();
      default:
        return renderSearchFlow();
    }
  };

  return (
    <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '20px 0',
        marginBottom: '40px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" style={{ fontWeight: 'bold' }}>
            Value Investing Portfolio
          </Typography>
          <Typography variant="subtitle1">
            Construye tu portafolio de inversión basado en valor
          </Typography>
        </Container>
      </header>
      
      <main>
        {renderContent()}
      </main>
      
      <footer style={{
        marginTop: '60px',
        padding: '20px 0',
        backgroundColor: '#333',
        color: '#fff',
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Typography variant="body2">
            © {new Date().getFullYear()} Value Investing Portfolio. Todos los derechos reservados.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
            Esta herramienta es solo con fines educativos e informativos. No constituye asesoramiento de inversión.
          </Typography>
        </Container>
      </footer>
    </div>
  );
}

export default App;
