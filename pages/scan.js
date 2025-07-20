import FaceVerificationSystem from '../components/FaceVerificationSystem';

export default function Scan() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">I</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">IOTA Identity Framework</h1>
                <p className="text-sm text-gray-500">Face Verification System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Powered by IOTA 2.0 + Stronghold</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Face Verification System
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Advanced biometric verification using facial geometry, landmarks, and neural features
          </p>
        </div>

        <FaceVerificationSystem />
      </div>
    </div>
  );
}