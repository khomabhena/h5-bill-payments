import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ReusableButton from '../components/buttons/ReusableButton';
import Button from '../components/Button';
import CountryInputField from '../components/CountryInputField';
import PageWrapper from '../components/PageWrapper';
import { getAllCountries } from '../data/countries';
import { getServices } from '../../h5-automation-api/appletree';
import { colors } from '../data/colors';

// Service icons mapping
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
  
  // Try to match service name
  const serviceNameUpper = serviceName?.toUpperCase() || '';
  for (const [key, icon] of Object.entries(icons)) {
    if (serviceNameUpper.includes(key.toUpperCase())) {
      return icon;
    }
  }
  
  return icons['Other'];
};

// Popular countries (most commonly used) - can be moved to constants or loaded from user preferences
const POPULAR_COUNTRIES = ['ZW', 'KE', 'ZA', 'NG', 'GH'];

const CountryServiceSelection = () => {
  const navigate = useNavigate();
  // Load countries from local data file (not from AppleTree Gateway)
  const [countries] = useState(() => {
    const allCountries = getAllCountries();
    console.log('Loaded countries from local data:', allCountries.length, allCountries.map(c => c.countryName));
    return allCountries;
  });
  
  const [services, setServices] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load services when country is selected
  useEffect(() => {
    if (selectedCountry) {
      loadServices(selectedCountry.countryCode);
    } else {
      setServices([]);
    }
  }, [selectedCountry]);

  const loadServices = async (countryCode) => {
    setLoadingServices(true);
    try {
      const response = await getServices(countryCode);
      
      // API returns Status: "FOUND" and Services array
      if ((response.Status === 'FOUND' || response.Status === 'SUCCESSFUL') && response.Services) {
        // Filter out Mobile services (1, 2, 3) as per design doc
        const billPaymentServices = response.Services.filter(
          service => ![1, 2, 3].includes(service.Id)
        );
        setServices(billPaymentServices);
      } else {
        console.error('Failed to load services:', response.ResultMessage || response.message);
        setServices([]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      
      // Check if it's a network error
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('NetworkError') ||
                            error.name === 'TypeError';
      
      if (isNetworkError) {
        alert('Network connection issue. Please check your internet connection and try again.');
      } else {
        alert('Failed to load services. Please try again.');
      }
      
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedService(null); // Reset service when country changes
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
  };

  const handleBack = () => {
    if (window.payment && typeof window.payment.close === 'function') {
      window.payment.close();
    } else {
      navigate(-1);
    }
  };

  // Filter and sort countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      // When no search, show popular countries first, then others
      const popular = countries.filter(c => POPULAR_COUNTRIES.includes(c.countryCode));
      const others = countries.filter(c => !POPULAR_COUNTRIES.includes(c.countryCode));
      return [...popular, ...others];
    }
    
    // Filter by search query (case-insensitive)
    const query = searchQuery.toLowerCase().trim();
    const filtered = countries.filter(country => 
      country.countryName.toLowerCase().includes(query) ||
      country.countryCode.toLowerCase().includes(query) ||
      country.callingCode.includes(query)
    );
    console.log('Search query:', query, 'Filtered countries:', filtered.length, filtered.map(c => c.countryName));
    return filtered;
  }, [countries, searchQuery]);

  const handleContinue = () => {
    if (selectedCountry && selectedService) {
      // Store selections and navigate to providers
      navigate('/providers', {
        state: {
          country: selectedCountry,
          service: selectedService,
        },
      });
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <Header title="Bill Payments" showBackButton={true} onBack={handleBack} />
      
      {/* Main Content Section - White Background */}
      <div className="bg-white w-full flex-1 flex flex-col mt-4 rounded-3xl">
        <div className="px-4 pb-6 sm:px-6 flex-1">
          {/* Country Selection Section */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-700 mb-3">Select Country</p>
            
            {/* Search Input */}
            <div className="mb-4">
              <CountryInputField
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                customColors={colors}
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                rightIcon={
                  searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )
                }
              />
            </div>

            {/* Popular Countries Section (only when no search) */}
            {!searchQuery && filteredCountries.some(c => POPULAR_COUNTRIES.includes(c.countryCode)) && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Popular</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredCountries
                    .filter(c => POPULAR_COUNTRIES.includes(c.countryCode))
                    .map((country) => (
                      <ReusableButton
                        key={country.countryCode}
                        variant="selection"
                        size="sm"
                        selected={selectedCountry?.countryCode === country.countryCode}
                        onClick={() => handleCountrySelect(country)}
                        customColors={colors}
                        icon={<span className="text-xl">{country.flag}</span>}
                      >
                        {country.countryName}
                      </ReusableButton>
                    ))}
                </div>
              </div>
            )}

            {/* All Countries / Search Results */}
            <div className={!searchQuery ? 'hidden' : ''}>
              {!searchQuery && filteredCountries.some(c => !POPULAR_COUNTRIES.includes(c.countryCode)) && (
                <p className="text-xs text-gray-500 mb-2">All Countries</p>
              )}
              
              {searchQuery && (
                <p className="text-xs text-gray-500 mb-2">
                  {filteredCountries.length > 0 ? `Found ${filteredCountries.length} countries` : 'No results'}
                </p>
              )}
              
              {filteredCountries.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No countries found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredCountries
                    .filter(c => {
                      // When searching, show all filtered results
                      // When not searching, show only non-popular countries (popular ones shown separately)
                      return searchQuery ? true : !POPULAR_COUNTRIES.includes(c.countryCode);
                    })
                    .map((country) => (
                      <ReusableButton
                        key={country.countryCode}
                        variant="selection"
                        size={searchQuery ? "sm" : "xs"}
                        selected={selectedCountry?.countryCode === country.countryCode}
                        onClick={() => handleCountrySelect(country)}
                        customColors={colors}
                        icon={<span className={searchQuery ? "text-xl" : "text-lg"}>{country.flag}</span>}
                      >
                        {country.countryName}
                      </ReusableButton>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Service Selection Section */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-700 mb-3">
              Select Service
              {loadingServices && <span className="ml-2 text-xs text-gray-500">Loading...</span>}
            </p>
            
            {!selectedCountry ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Please select a country first
              </div>
            ) : loadingServices ? (
              <div className="text-center py-8">
                <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 text-sm">Loading services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No services available for this country
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {services.map((service) => (
                  <ReusableButton
                    key={service.Id}
                    variant="selection"
                    size="md"
                    selected={selectedService?.Id === service.Id}
                    onClick={() => handleServiceSelect(service)}
                    customColors={colors}
                    icon={<span className="text-2xl">{getServiceIcon(service.Name)}</span>}
                  >
                    {service.Name}
                  </ReusableButton>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Button at Bottom - Inside White Card */}
        <div className="p-4 sm:p-6 space-y-3">
          <Button
            onClick={handleContinue}
            disabled={!selectedCountry || !selectedService}
            loading={loadingServices}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CountryServiceSelection;

