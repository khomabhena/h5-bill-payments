import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import ReusableButton from '../components/buttons/ReusableButton';
import Button from '../components/Button';
import PageWrapper from '../components/PageWrapper';
import { getServiceProviders } from '../../h5-automation-api/appletree';
import { colors } from '../data/colors';

// Service icons mapping (same as CountryServiceSelection)
const getServiceIcon = (serviceName) => {
  const icons = {
    'Internet Broadband': '🌐',
    'Electricity': '⚡',
    'Gas': '🔥',
    'DSTV': '📺',
    'Education': '🎓',
    'Water': '💧',
    'Insurance': '🛡️',
    'TV': '📡',
    'Other': '📋',
  };

  const serviceNameUpper = serviceName?.toUpperCase() || '';
  for (const [key, icon] of Object.entries(icons)) {
    if (serviceNameUpper.includes(key.toUpperCase())) {
      return icon;
    }
  }

  return icons['Other'];
};

const ProviderSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { country, service } = location.state || {};

  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if no country/service selected
  useEffect(() => {
    if (!country || !service) {
      navigate('/', { replace: true });
    }
  }, [country, service, navigate]);

  // Load providers when component mounts
  useEffect(() => {
    if (country && service) {
      loadProviders();
    }
  }, [country, service]);

  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getServiceProviders({
        countryCode: country.countryCode,
        serviceId: service.Id
      });

      // API returns Status: "FOUND" and ServiceProviders array
      if ((response.Status === 'FOUND' || response.Status === 'SUCCESSFUL') && response.ServiceProviders) {
        // Filter providers by selected country (client-side filtering as backup)
        // API should filter, but we filter here too to ensure accuracy
        const filteredProviders = response.ServiceProviders.filter(provider => {
          // Match by country code
          const matchesCountry = provider.Country?.Code === country.countryCode;
          
          // Log for debugging
          if (!matchesCountry) {
            console.log(`Provider ${provider.Name} filtered out - Country: ${provider.Country?.Code}, Expected: ${country.countryCode}`);
          }
          
          return matchesCountry;
        });
        
        console.log(`Loaded ${filteredProviders.length} providers for ${country.countryName} - ${service.Name} (from ${response.ServiceProviders.length} total)`);
        setProviders(filteredProviders);
      } else {
        setError(response.ResultMessage || 'Failed to load providers');
        setProviders([]);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      
      // Check if it's a network error
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('NetworkError') ||
                            error.name === 'TypeError';
      
      if (isNetworkError) {
        const errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        setError(errorMessage);
        alert(errorMessage);
      } else {
        const errorMessage = error.message || 'Failed to load providers. Please try again.';
        setError(errorMessage);
      }
      
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider) => {
    console.log('Selected Service Provider ID:', provider.Id);
    console.log('Selected Service Provider:', provider);
    setSelectedProvider(provider);
  };

  const handleContinue = () => {
    if (selectedProvider && country && service) {
      navigate('/products', {
        state: {
          country,
          service,
          provider: selectedProvider,
        },
      });
    }
  };

  if (!country || !service) {
    return null; // Will redirect
  }

  return (
    <PageWrapper>
      {/* Header */}
      <Header title="Select Provider" showBackButton={true} />

      {/* Main Content Section - White Background */}
      <div className="bg-white w-full flex-1 flex flex-col mt-4 rounded-3xl">
        <div className="px-6 pb-6 flex-1">
          {/* Country & Service Info Display */}
          <div className="mb-6 pt-4">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <span className="text-3xl">{country.flag}</span>
              <span className="text-2xl">{getServiceIcon(service.Name)}</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">{country.countryName}</p>
              <p className="text-xs text-gray-500">{service.Name}</p>
            </div>
          </div>

          {/* Providers Grid */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-700 mb-3">Select Provider</p>

            {loading ? (
              <div className="text-center py-8">
                <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 text-sm">Loading providers...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No providers available for this service
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {providers.map((provider) => (
                  <ReusableButton
                    key={provider.Id}
                    variant="selection"
                    size="md"
                    selected={selectedProvider?.Id === provider.Id}
                    onClick={() => handleProviderSelect(provider)}
                    customColors={colors}
                    icon={
                      provider.LogoURL ? (
                        <img 
                          src={provider.LogoURL} 
                          alt={provider.Name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            // Fallback to text if image fails to load
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <span className="text-2xl">🏢</span>
                      )
                    }
                  >
                    {provider.Name}
                  </ReusableButton>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Button at Bottom - Inside White Card */}
        <div className="p-6 pb-24 space-y-3">
          <Button
            onClick={handleContinue}
            disabled={!selectedProvider || loading}
            loading={loading}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProviderSelection;

