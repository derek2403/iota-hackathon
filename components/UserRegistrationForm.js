import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import RegistrationFaceScanner from './RegistrationFaceScanner';
import DIDDisplay from './DIDDisplay';
import WalletDIDCreation from './WalletDIDCreation';

const UserRegistrationForm = ({ onUserRegistration, loading }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userInfo, setUserInfo] = useState(null);
  const [biometricData, setBiometricData] = useState(null);
  const [didInfo, setDidInfo] = useState(null);
  const [credential, setCredential] = useState(null);
  const [creationMode, setCreationMode] = useState('stronghold');
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const countries = [
    { code: 'US', name: 'United States of America' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'AU', name: 'Australia' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'KR', name: 'South Korea' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'OTHER', name: 'Other' }
  ];

  const states = {
    'US': [
      { code: 'CA', name: 'California' },
      { code: 'NY', name: 'New York' },
      { code: 'TX', name: 'Texas' },
      { code: 'FL', name: 'Florida' },
      { code: 'IL', name: 'Illinois' },
      { code: 'PA', name: 'Pennsylvania' },
      { code: 'OH', name: 'Ohio' },
      { code: 'GA', name: 'Georgia' },
      { code: 'NC', name: 'North Carolina' },
      { code: 'MI', name: 'Michigan' }
    ]
  };

  const selectedCountry = watch('country');

  const handleFormSubmit = async (data) => {
    try {
      // Combine first and last name into a single name field for compatibility
      const formattedData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`
      };
      setUserInfo(formattedData);
      setCurrentStep(2);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleBiometricComplete = (biometricData) => {
    setBiometricData(biometricData);
    setCurrentStep(3);
  };

  const handleBiometricSkip = () => {
    setCurrentStep(3);
  };

  const handleFinalSubmit = async () => {
    try {
      const finalData = {
        ...userInfo,
        biometricData
      };
      await onUserRegistration(finalData);
      reset();
      setUserInfo(null);
      setBiometricData(null);
      setCurrentStep(1);
    } catch (error) {
      console.error('Final submission error:', error);
    }
  };

  const handleDIDCreated = (didData) => {
    // Include biometric data in DID creation if available
    const enhancedDidData = {
      ...didData,
      biometricData: biometricData,
      hasBiometricVerification: !!biometricData
    };
    
    setDidInfo(enhancedDidData);
    setCredential(enhancedDidData.credential);
  };

  const handleCreateNewDID = () => {
    setUserInfo(null);
    setBiometricData(null);
    setDidInfo(null);
    setCredential(null);
    setCurrentStep(1);
  };

  const handleVerifyCredential = async (credentialToVerify) => {
    try {
      const response = await fetch('/api/verify-credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialToVerify }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error verifying credential:', error);
      return {
        valid: false,
        error: error.message,
        success: false
      };
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="w-4/5 mx-auto bg-white rounded-lg shadow-lg overflow-hidden border-2 border-black">
      {/* Progress Steps */}
      <div className="px-8 py-6 bg-gray-50 border-b border-black">
        <div className="flex items-center justify-center space-x-8">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 1 ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
          </div>

          {/* Connector */}
          <div className={`h-0.5 w-16 ${currentStep > 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>

          {/* Step 2 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 2 ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-medium">2</span>
              )}
            </div>
          </div>

          {/* Connector */}
          <div className={`h-0.5 w-16 ${currentStep > 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>

          {/* Step 3 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              <span className="text-sm font-medium">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete with your information
          </h2>
          <p className="text-gray-600">
            Digital identity verification requires you to verify your identity to use this service.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Step 1: Complete Registration Form */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    {...register('firstName', { 
                      required: 'First name is required',
                      minLength: { value: 2, message: 'First name must be at least 2 characters' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    {...register('lastName', { 
                      required: 'Last name is required',
                      minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Smith"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-orange-700">
                      Enter your first and last name exactly as they are written in your ID
                    </p>
                  </div>
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  {...register('dateOfBirth', { 
                    required: 'Date of birth is required',
                    validate: {
                      notFuture: value => new Date(value) <= new Date() || 'Date cannot be in the future',
                      minimumAge: value => {
                        const today = new Date();
                        const birthDate = new Date(value);
                        const age = today.getFullYear() - birthDate.getFullYear();
                        return age >= 13 || 'Must be at least 13 years old';
                      }
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john.smith@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  {...register('country', { required: 'Country is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>

              {/* State/Province and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State / Province / Region
                  </label>
                  {selectedCountry && states[selectedCountry] ? (
                    <select
                      id="state"
                      {...register('state', { required: 'State is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select state</option>
                      {states[selectedCountry].map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="state"
                      {...register('state', { required: 'State/Province is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter state/province"
                    />
                  )}
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    {...register('city', { required: 'City is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Los Angeles"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  {...register('address', { 
                    required: 'Address is required',
                    minLength: { value: 10, message: 'Address must be at least 10 characters' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1230 S Western Ave"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              {/* ZIP Code */}
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                  <span>ZIP / Postal Code</span>
                </label>
                <input
                  type="text"
                  id="zipCode"
                  {...register('zipCode', { 
                    required: 'ZIP/Postal code is required',
                    pattern: {
                      value: /^[0-9A-Za-z\s\-]{3,10}$/,
                      message: 'Invalid ZIP/Postal code format'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.zipCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="90006"
                />
                {errors.zipCode && (
                  <div className="mt-1 flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600">Incorrect format</p>
                  </div>
                )}
              </div>

              {/* ID Number */}
              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number
                  <span className="text-sm text-gray-500 ml-1">
                    (Passport, Driver's License, or National ID)
                  </span>
                </label>
                <input
                  type="text"
                  id="idNumber"
                  {...register('idNumber', { 
                    required: 'ID number is required',
                    minLength: { value: 5, message: 'ID number must be at least 5 characters' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your ID number"
                />
                {errors.idNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.idNumber.message}</p>
                )}
              </div>

              {/* Consent */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Please make sure the data you provide is correct and accurate before submitting your information.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Identity...
                    </>
                  ) : (
                    'Submit information'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Face Scanner */}
          {currentStep === 2 && (
            <div>
              <RegistrationFaceScanner
                userInfo={userInfo}
                onFaceScanComplete={handleBiometricComplete}
                onSkip={handleBiometricSkip}
              />
            </div>
          )}

          {/* Step 3: DID Creation and Display */}
          {currentStep === 3 && (
            <div>
              {!didInfo ? (
                <div className="space-y-6">
                  {/* Show biometric status */}
                  {biometricData && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-800 font-medium">
                          ✅ Biometric verification enabled (Confidence: {Math.round(biometricData.detectionScore * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {!biometricData && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-yellow-800 font-medium">
                          ⚠️ Biometric verification skipped - Consider adding for enhanced security
                        </span>
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="ml-4 text-sm bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded"
                        >
                          Add Now
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Automatically trigger wallet DID creation */}
                  <WalletDIDCreation userInfo={userInfo} onDIDCreated={handleDIDCreated} />
                </div>
              ) : (
                <DIDDisplay 
                  didInfo={didInfo} 
                  credential={credential}
                  onCreateNewDID={handleCreateNewDID}
                  onVerifyCredential={handleVerifyCredential}
                />
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserRegistrationForm; 