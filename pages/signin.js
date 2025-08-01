import { useEffect } from "react";
import { useRouter } from "next/router";
import AttendanceVerification from "../components/signinverification";
import { initializeSystem } from "../utils/mint-token.js";

export default function SignIn({ error }) {
  const router = useRouter();

  useEffect(() => {
    // Initialize any client-side blockchain connections here
    const initBlockchain = async () => {
      try {
        await initializeSystem();
      } catch (err) {
        console.error("Failed to initialize blockchain connection:", err);
      }
    };

    initBlockchain();
  }, []);

  const handleVerificationSuccess = () => {
    // Redirect to summary page after successful verification
    router.push("/summary");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 py-8 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
          <h2 className="text-red-600 text-xl font-bold mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <AttendanceVerification
        onVerificationSuccess={handleVerificationSuccess}
      />
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
