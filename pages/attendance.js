import { useEffect, useState } from "react";
import AttendanceVerification from "../components/AttendanceVerification";
import { initializeSystem } from "../utils/mint-token.js";

export default function Attendance({ error }) {
  const [mintResults, setMintResults] = useState(null);
  const [systemStatus, setSystemStatus] = useState('initializing');

  useEffect(() => {
    // Initialize any client-side blockchain connections here
    const initBlockchain = async () => {
      try {
        setSystemStatus('connecting');
        const result = await initializeSystem();
        setMintResults(result);
        setSystemStatus('connected');
      } catch (err) {
        console.error("Failed to initialize blockchain connection:", err);
        setSystemStatus('error');
        setMintResults({ error: err.message });
      }
    };

    initBlockchain();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        

        {/* Error Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
            <h2 className="text-red-600 text-xl font-bold mb-4">Error</h2>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
        <div className="space-y-8">
          {/* Attendance Verification Component */}
          <AttendanceVerification mintResults={mintResults} />
        </div>
  );
}

export async function getServerSideProps() {
  try {
    // You can add any server-side initialization here if needed
    return {
      props: {
        error: null,
      },
    };
  } catch (error) {
    return {
      props: {
        error: error.message || "Failed to initialize attendance system",
      },
    };
  }
}
