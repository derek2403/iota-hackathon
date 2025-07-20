import { useRouter } from 'next/router';
import Head from 'next/head';
import FaceVerificationSystem from '../components/FaceVerificationSystem';

export default function SignIn() {
  const router = useRouter();

  const handleVerificationSuccess = () => {
    // Redirect to summary page on successful verification
    router.push('/summary');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Face ID Sign In - Student Portal</title>
        <meta name="description" content="Sign in with Face ID verification" />
      </Head>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome Back! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Sign in with Face ID to access your student dashboard
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <FaceVerificationSystem onVerificationSuccess={handleVerificationSuccess} />
        </div>
      </div>
    </div>
  );
}
