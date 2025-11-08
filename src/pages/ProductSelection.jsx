import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import ReusableButton from '../components/buttons/ReusableButton';
import Button from '../components/Button';
import PageWrapper from '../components/PageWrapper';
import { getProducts } from '../../h5-automation-api/appletree';
import { colors } from '../data/colors';

const ProductSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { country, service, provider } = location.state || {};

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if no country/service/provider selected
  useEffect(() => {
    if (!country || !service || !provider) {
      navigate('/providers', { replace: true });
    }
  }, [country, service, provider, navigate]);

  // Load products when component mounts
  useEffect(() => {
    if (country && service && provider) {
      loadProducts();
    }
  }, [country, service, provider]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // API doesn't filter by serviceProviderId, so we fetch all products and filter locally
      const response = await getProducts({
        countryCode: country.countryCode,
        serviceId: service.Id
        // Note: Not passing serviceProviderId since API doesn't filter by it
      });

      // API returns Status: "FOUND" and Products array
      if ((response.Status === 'FOUND' || response.Status === 'SUCCESSFUL') && response.Products) {
        console.log('Filtering products for Provider ID:', provider.Id);
        console.log('All products from API (before filtering):', response.Products);
        
        // Filter products by selected provider (required - API doesn't filter by serviceProviderId)
        const filteredProducts = response.Products.filter(product => {
          const matchesProvider = product.ServiceProvider?.Id === provider.Id;
          
          // Log for debugging
          if (!matchesProvider) {
            console.log(`Product ${product.Name} filtered out - Provider: ${product.ServiceProvider?.Id}, Expected: ${provider.Id}`);
          }
          
          return matchesProvider;
        });
        
        console.log(`Loaded ${filteredProducts.length} products for ${provider.Name} (from ${response.Products.length} total)`);
        console.log('Filtered products matching Provider ID:', filteredProducts);
        
        // Set all filtered products
        setProducts(filteredProducts);
        
        // If only one product, auto-select it (but still show it in the list)
        if (filteredProducts.length === 1) {
          setSelectedProduct(filteredProducts[0]);
        }
      } else {
        setError(response.ResultMessage || 'Failed to load products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      
      // Check if it's a network error
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('NetworkError') ||
                            error.name === 'TypeError';
      
      if (isNetworkError) {
        const errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        setError(errorMessage);
        alert(errorMessage);
      } else {
        const errorMessage = error.message || 'Failed to load products. Please try again.';
        setError(errorMessage);
      }
      
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const handleContinue = () => {
    if (selectedProduct && country && service && provider) {
      navigate('/account', {
        state: {
          country,
          service,
          provider,
          product: selectedProduct,
        },
      });
    }
  };

  // Note: Auto-navigation removed - always show all products in the list
  // Users can manually continue even if there's only one product

  if (!country || !service || !provider) {
    return null; // Will redirect
  }

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    const currencyCode = (currency || 'USD').toUpperCase();
    const amountValue = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    if (amountValue === 0) {
      return 'Variable Amount';
    }
    return `${currencyCode} ${amountValue.toFixed(2)}`;
  };

  return (
    <PageWrapper>
      {/* Header */}
      <Header title="Select Product" showBackButton={true} />

      {/* Main Content Section - White Background */}
      <div className="bg-white w-full flex-1 flex flex-col mt-4 rounded-3xl">
        <div className="px-6 pb-6 flex-1">
          {/* Provider Info Display */}
          <div className="mb-6 pt-4">
            <div className="flex items-center justify-center mb-2">
              {provider.LogoURL ? (
                <img 
                  src={provider.LogoURL} 
                  alt={provider.Name}
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <span className={`text-4xl ${provider.LogoURL ? 'hidden' : 'block'}`}>🏢</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">{provider.Name}</p>
              <p className="text-xs text-gray-500">{service.Name}</p>
            </div>
          </div>

          {/* Products Grid */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-700 mb-3">Select Product</p>

            {loading ? (
              <div className="text-center py-8">
                <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 text-sm">Loading products...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No products available for this provider
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((product) => {
                  // Format amount range information
                  const minAmount = product.MinimumAmount || 0;
                  const maxAmount = product.MaximumAmount || 0;
                  const currency = product.Currency || 'USD';
                  const hasAmountLimits = minAmount > 0 || maxAmount > 0;
                  
                  // Get account identifier needed (what user needs to provide)
                  const accountIdentifier = product.CreditPartyIdentifiers?.[0]?.Title || 'Account Number';
                  
                  return (
                    <div
                      key={product.Id}
                      onClick={() => handleProductSelect(product)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${selectedProduct?.Id === product.Id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        }
                      `}
                    >
                      {/* Product Name */}
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {product.Name}
                      </h3>
                      
                      {/* Description */}
                      {product.Description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {product.Description}
                        </p>
                      )}
                      
                      {/* Currency */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Currency:</span>
                        <span className="text-sm font-medium text-gray-700">
                          {currency.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Amount Range */}
                      {hasAmountLimits ? (
                        <div className="flex items-center justify-between mb-2">
                          {/* Check if min and max are equal (within 0.01 tolerance for floating point) */}
                          {minAmount > 0 && maxAmount > 0 && Math.abs(minAmount - maxAmount) < 0.01 ? (
                            <>
                              <span className="text-xs text-gray-500">Amount:</span>
                              <span className="text-sm font-medium text-gray-700">
                                {currency} {minAmount.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-gray-500">Amount Range:</span>
                              <span className="text-sm font-medium text-gray-700">
                                {minAmount > 0 && maxAmount > 0
                                  ? `${currency} ${minAmount.toFixed(2)} - ${currency} ${maxAmount.toFixed(2)}`
                                  : minAmount > 0
                                  ? `Min: ${currency} ${minAmount.toFixed(2)}`
                                  : `Max: ${currency} ${maxAmount.toFixed(2)}`
                                }
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">Payment Type:</span>
                          <span className="text-sm font-medium text-gray-700">
                            Variable Amount
                          </span>
                        </div>
                      )}
                      
                      {/* Account Identifier Needed */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">You'll need:</span>
                        <span className="text-xs font-medium text-emerald-600">
                          {accountIdentifier}
                        </span>
                      </div>
                      
                      {/* Additional Info Badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.BalanceAvailable && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            Balance Check
                          </span>
                        )}
                        {product.Reversible && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            Reversible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Button at Bottom - Inside White Card */}
        <div className="px-6 pb-10 space-y-3">
          <Button
            onClick={handleContinue}
            disabled={!selectedProduct || loading}
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

export default ProductSelection;

