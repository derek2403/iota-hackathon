import React from 'react';

const TechnicalDetails = () => {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold mb-3">🔬 Multi-Factor Verification System</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded">
          <h4 className="font-semibold mb-1">Neural Features (40%)</h4>
          <p>128D deep learning face descriptors trained on millions of faces</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <h4 className="font-semibold mb-1">Face Geometry (25%)</h4>
          <p>Unique facial proportions and ratios that remain stable across photos</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded">
          <h4 className="font-semibold mb-1">Biometric Features (20%)</h4>
          <p>Eye shapes, nose ratios, mouth characteristics, and facial asymmetry</p>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <h4 className="font-semibold mb-1">Landmark Analysis (15%)</h4>
          <p>68-point facial landmark alignment and positioning verification</p>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Decision Making:</strong> Requires 2+ critical matches AND overall confidence {'>'} 75% AND gender consistency</p>
      </div>
    </div>
  );
};

export default TechnicalDetails; 