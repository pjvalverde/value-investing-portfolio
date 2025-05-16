import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const SEARCH_STEPS = {
  INITIAL: 'initial',
  SEARCHING_VALUE: 'searching_value',
  SEARCHING_GROWTH: 'searching_growth',
  SEARCHING_ETF: 'searching_etf',
  COMPLETED: 'completed',
  ERROR: 'error'
};

const SearchFlow = ({ amount, horizon, onSearchComplete }) => {
  const [currentStep, setCurrentStep] = useState(SEARCH_STEPS.INITIAL);
  const [searchResults, setSearchResults] = useState({
    value: null,
    growth: null,
    etf: null
  });
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const BASE_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/$/, '');

  const handleSearch = async (type) => {
    try {
      let endpoint = '';
      switch (type) {
        case 'value':
          setCurrentStep(SEARCH_STEPS.SEARCHING_VALUE);
          endpoint = '/search/value';
          break;
        case 'growth':
          setCurrentStep(SEARCH_STEPS.SEARCHING_GROWTH);
          endpoint = '/search/growth';
          break;
        case 'etf':
          setCurrentStep(SEARCH_STEPS.SEARCHING_ETF);
          endpoint = '/search/etf';
          break;
        default:
          return;
      }

      setError(null);
      setProgress(30);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, horizon })
      });

      if (!response.ok) {
        throw new Error(`Error en la búsqueda de ${type}`);
      }

      const data = await response.json();
      setProgress(70);
      
      // Actualizar resultados parciales
      setSearchResults(prev => ({
        ...prev,
        [type]: data
      }));

      setProgress(100);
      
      // Si es la última búsqueda, marcar como completado
      if (type === 'etf') {
        setCurrentStep(SEARCH_STEPS.COMPLETED);
        // Obtener análisis final
        await fetchFinalAnalysis();
      }
      
    } catch (err) {
      console.error(`Error en búsqueda de ${type}:`, err);
      setError(`Error al buscar ${type}: ${err.message}`);
      setCurrentStep(SEARCH_STEPS.ERROR);
    }
  };

  const fetchFinalAnalysis = async () => {
    try {
      const response = await fetch(`${BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          horizon,
          valueStocks: searchResults.value?.stocks || [],
          growthStocks: searchResults.growth?.stocks || [],
          etfs: searchResults.etf?.etfs || []
        })
      });

      if (!response.ok) {
        throw new Error('Error al obtener el análisis final');
      }

      const analysisData = await response.json();
      
      // Llamar al callback con todos los datos
      onSearchComplete({
        value: searchResults.value,
        growth: searchResults.growth,
        etf: searchResults.etf,
        analysis: analysisData
      });
      
    } catch (err) {
      console.error('Error al obtener análisis final:', err);
      setError('Error al generar el análisis final. Por favor, intente nuevamente.');
      setCurrentStep(SEARCH_STEPS.ERROR);
    }
  };

  const renderButton = (type, label) => {
    const isCurrentStep = 
      (type === 'value' && currentStep === SEARCH_STEPS.INITIAL) ||
      (type === 'growth' && currentStep === SEARCH_STEPS.SEARCHING_VALUE && searchResults.value) ||
      (type === 'etf' && currentStep === SEARCH_STEPS.SEARCHING_GROWTH && searchResults.growth);

    const isCompleted = searchResults[type] !== null;
    const isLoading = 
      (type === 'value' && currentStep === SEARCH_STEPS.SEARCHING_VALUE) ||
      (type === 'growth' && currentStep === SEARCH_STEPS.SEARCHING_GROWTH) ||
      (type === 'etf' && currentStep === SEARCH_STEPS.SEARCHING_ETF);

    return (
      <Box key={type} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSearch(type)}
          disabled={!isCurrentStep || isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : isCompleted ? (
              <CheckCircleIcon />
            ) : null
          }
          sx={{ minWidth: 200 }}
        >
          {isLoading ? 'Buscando...' : `Buscar ${label}`}
        </Button>
        {isCompleted && (
          <Typography variant="body2" color="success.main">
            {searchResults[type]?.stocks?.length || searchResults[type]?.etfs?.length} elementos encontrados
          </Typography>
        )}
      </Box>
    );
  };

  if (currentStep === SEARCH_STEPS.ERROR) {
    return (
      <Box sx={{ p: 3, bgcolor: '#ffebee', borderRadius: 1, mb: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={() => setCurrentStep(SEARCH_STEPS.INITIAL)}
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  if (currentStep === SEARCH_STEPS.COMPLETED) {
    return (
      <Box sx={{ p: 3, bgcolor: '#e8f5e9', borderRadius: 1, mb: 3 }}>
        <Typography variant="h6" color="success.main" gutterBottom>
          ¡Búsqueda completada con éxito!
        </Typography>
        <Typography>Se han encontrado los siguientes resultados:</Typography>
        <ul>
          {searchResults.value && <li>Acciones de valor: {searchResults.value.stocks?.length || 0}</li>}
          {searchResults.growth && <li>Acciones de crecimiento: {searchResults.growth.stocks?.length || 0}</li>}
          {searchResults.etf && <li>ETFs/Bonos: {searchResults.etf.etfs?.length || 0}</li>}
        </ul>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 1, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Progreso de la búsqueda
      </Typography>
      
      {progress > 0 && progress < 100 && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Progreso</Typography>
            <Typography variant="body2">{progress}%</Typography>
          </Box>
          <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 5 }}>
            <Box
              sx={{
                height: 10,
                width: `${progress}%`,
                bgcolor: 'primary.main',
                borderRadius: 5,
                transition: 'width 0.5s ease-in-out',
              }}
            />
          </Box>
        </Box>
      )}

      <Typography variant="body1" paragraph>
        Por favor, sigue los pasos para buscar las mejores opciones de inversión:
      </Typography>
      
      {renderButton('value', 'Acciones de Valor')}
      {searchResults.value && renderButton('growth', 'Acciones de Crecimiento')}
      {searchResults.growth && renderButton('etf', 'ETFs/Bonos')}
    </Box>
  );
};

export default SearchFlow;
