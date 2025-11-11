export const getDisplayIdentifierLabel = (
  identifierTitle,
  { serviceName, providerName, productName } = {}
) => {
  const fallbackLabel = identifierTitle?.trim() || 'Account Number';
  const normalizedLabel = fallbackLabel.toLowerCase();

  const includes = (value, keyword) =>
    typeof value === 'string' && value.toLowerCase().includes(keyword);

  const isElectricityContext =
    includes(serviceName, 'electric') ||
    includes(providerName, 'zetdc') ||
    includes(productName, 'zetdc');

  const looksLikeMobileNumber =
    normalizedLabel === 'mobile number' ||
    normalizedLabel === 'mobile #' ||
    normalizedLabel === 'msisdn' ||
    normalizedLabel === 'mobile';

  if (isElectricityContext && looksLikeMobileNumber) {
    return 'Meter Number';
  }

  return fallbackLabel;
};


