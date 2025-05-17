import React, { useState } from 'react';
import { CONFIG } from './config';
import PortfolioForm from './components/PortfolioForm';
import PortfolioTable from './components/PortfolioTable';
import { 
  Container, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper, 
  Alert,
  Box
} from '@mui/material';

function App() {
  // URL base del backend
  const BACKEND_URL = CONFIG.BACKEND_URL;

  // Estados del flujo secuencial
  const [formData, setFormData] = useState(null);
  const [valueData, setValueData] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [bondsData, setBondsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0=form, 1=value, 2=growth, 3=bonds, 4=show
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState('');

  // Resetear todo al volver al formulario
  const handleFormSubmit = (data) => {
    setFormData(data);
    setValueData(null);
    setGrowthData(null);
    setBondsData(null);
    setAnalysis('');
    setError('');
    setStep(1);
  };

  // Función para conectar con el backend real (sin simulación)
  const fetchPortfolio = async (type) => {
    if (!formData) return null;
    
    setLoading(true);
    setError('');
    
    try {
      let endpoint = '';
      
      switch(type) {
        case 'value':
          endpoint = '/api/portfolio/value';
          break;
        case 'growth':
          endpoint = '/api/portfolio/growth';
          break;
        case 'bonds':
          endpoint = '/api/portfolio/disruptive';
          break;
        default:
          throw new Error('Tipo de portafolio no válido');
      }
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formData.amount,
          horizon: formData.horizon,
          risk_profile: formData.riskProfile
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (err) {
      console.error('Error al obtener el portafolio:', err);
      setError(`Error al cargar el portafolio: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Manejadores para los botones secuenciales
  const handleFetchValue = async () => {
    const data = await fetchPortfolio('value');
    if (data) {
      setValueData(data);
      setStep(2); // Ir al siguiente paso (Growth)
    }
  };
  
  const handleFetchGrowth = async () => {
    const data = await fetchPortfolio('growth');
    if (data) {
      setGrowthData(data);
      setStep(3); // Ir al siguiente paso (Bonds)
    }
  };
  
  const handleFetchBonds = async () => {
    try {
      setLoading(true);
      const data = await fetchPortfolio('bonds');
      if (data) {
        setBondsData(data);
        setStep(4); // Ir al paso final (Mostrar resultados)
        
        // Verificar que todos los datos necesarios estén disponibles
        if (valueData && growthData) {
          console.log('Todos los datos están disponibles, generando análisis...');
          fetchClaudeAnalysis();
        } else {
          console.error('Faltan datos para generar el análisis:', {
            valueData: !!valueData,
            growthData: !!growthData,
            bondsData: !!data
          });
          setError('No se pudieron cargar todos los datos necesarios. Por favor, inténtalo de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error al obtener bonos:', error);
      setError(`Error al obtener los bonos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Pedir análisis SOLO cuando los tres están listos
  const fetchClaudeAnalysis = async () => {
    console.log('Iniciando fetchClaudeAnalysis...');
    
    if (!valueData || !growthData || !bondsData) {
      const errorMsg = 'Faltan datos para generar el análisis: ' + 
        JSON.stringify({
          valueData: !!valueData,
          growthData: !!growthData,
          bondsData: !!bondsData
        });
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const portfolio = {
        value: valueData.portfolio || [],
        growth: growthData.portfolio || [],
        bonds: bondsData.portfolio || []
      };
      
      console.log('Preparando solicitud de análisis...');
      const requestBody = {
        portfolio: portfolio,
        amount: formData.amount,
        horizon: formData.horizon,
        risk_profile: formData.riskProfile,
        language: 'es'
      };
      
      console.log('Enviando solicitud a:', `${BACKEND_URL}/api/portfolio/analysis`);
      console.log('Cuerpo de la solicitud:', JSON.stringify(requestBody, null, 2));
      
      const startTime = Date.now();
      const response = await fetch(`${BACKEND_URL}/api/portfolio/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });
      
      const endTime = Date.now();
      console.log(`Respuesta recibida en ${endTime - startTime}ms. Estado:`, response.status);
      
      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          console.error('Error en la respuesta del servidor:', errorText);
          // Intentar parsear como JSON si es posible
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.detail || errorJson.message || `Error ${response.status}`);
          } catch (e) {
            throw new Error(`Error ${response.status}: ${errorText}`);
          }
        } catch (textError) {
          console.error('Error al leer el cuerpo de la respuesta de error:', textError);
          throw new Error(`Error ${response.status}: No se pudo leer el mensaje de error`);
        }
      }
      
      const data = await response.json();
      console.log('Análisis recibido:', data.analysis ? '✅ Datos recibidos' : '❌ Sin datos de análisis');
      
      if (!data.analysis) {
        console.warn('El servidor no devolvió un análisis válido:', data);
        throw new Error('El servidor no devolvió un análisis válido');
      }
      
      setAnalysis(data.analysis);
      console.log('Análisis establecido en el estado');
      
    } catch (err) {
      console.error('❌ Error en fetchClaudeAnalysis:', err);
      setError(`Error al generar el análisis: ${err.message}`);
      // Forzar un nuevo renderizado del error
      setAnalysis(null);
    } finally {
      console.log('Finalizando fetchClaudeAnalysis');
      setLoading(false);
    }
  };

        
  return (
    <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '1rem 0',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" style={{ fontWeight: 'bold' }}>
            Value Investing Portfolio
          </Typography>
          <Typography variant="subtitle1">
            Herramienta para construir portafolios de inversión basados en valor
          </Typography>
        </Container>
      </header>

      <main>
        <Container maxWidth="lg">
          {step === 0 && (
            <PortfolioForm onSubmit={handleFormSubmit} loading={loading} />
          )}

          {step === 1 && !loading && (
            <Button variant="contained" color="primary" onClick={handleFetchValue}>
              Buscar Value
            </Button>
          )}

          {step === 2 && !loading && (
            <Button variant="contained" color="primary" onClick={handleFetchGrowth}>
              Buscar Growth
            </Button>
          )}

          {step === 3 && !loading && (
            <Button variant="contained" color="primary" onClick={handleFetchBonds}>
              Buscar Bonos/ETF
            </Button>
          )}

          {loading && (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <CircularProgress />
              <p style={{ marginTop: '1rem' }}>Procesando, por favor espere...</p>
            </div>
          )}

          {error && (
            <Alert severity="error" style={{ margin: '1rem 0' }}>
              {error}
            </Alert>
          )}

          {step === 4 && !loading && (
            <div>
              <Typography variant="h5" gutterBottom>
                Análisis de tu portafolio
              </Typography>

              <Paper style={{ padding: '2rem', margin: '1rem 0' }}>
                <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                  {analysis || 'Generando análisis...'}
                </Typography>
              </Paper>

              <div style={{ marginTop: '2rem' }}>
                <Typography variant="h6" gutterBottom>
                  Resumen del portafolio
                </Typography>
                <PortfolioTable 
                  portfolio={[
                    ...(valueData?.portfolio || []),
                    ...(growthData?.portfolio || []),
                    ...(bondsData?.portfolio || [])
                  ]}
                />
              </div>
            </div>
          )}
        </Container>
      </main>
      
      <footer style={{
        marginTop: '4rem',
        padding: '2rem 0',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="textSecondary">
            © {new Date().getFullYear()} Value Investing Portfolio - Herramienta educativa
          </Typography>
          <Typography variant="caption" display="block" color="textSecondary" style={{ marginTop: '0.5rem' }}>
            Los datos mostrados son con fines informativos y no constituyen asesoramiento financiero.
          </Typography>
        </Container>
      </footer>
    </div>
  );
}

export default App;