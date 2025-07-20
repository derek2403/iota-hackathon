import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

// Consistent date formatting function to avoid hydration errors
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
};

export default function SummaryPage() {
  // Sample data - in real app this would come from API/database
  const [attendanceData] = useState({
    attended: 85,
    missed: 15,
    totalClasses: 120,
    attendedClasses: 102,
  });

  const [tokenData] = useState({
    totalEarned: 2450,
    totalSpent: 1200,
    currentBalance: 1250,
  });

  const [certificates] = useState([
    {
      name: "Data Structure and Algorithm",
      completed: true,
      date: "2024-01-15",
    },
    { name: "Linear Algebra", completed: true, date: "2024-02-20" },
    { name: "Artificial Intelligence", completed: false, progress: 75 },
    { name: "Database Systems", completed: false, progress: 30 },
  ]);

  const [ownedNFTs] = useState([
    {
      id: 1,
      name: "Achievement Certificate",
      type: "Legendary",
      mintDate: "2024-01-20",
      color: "bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-500",
    },
    {
      id: 2,
      name: "Free Meal Voucher",
      type: "Common",
      mintDate: "2024-02-05",
      color: "bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500",
    },
    {
      id: 3,
      name: "Study Materials Voucher",
      type: "Rare",
      mintDate: "2024-02-15",
      color: "bg-gradient-to-br from-sky-200 via-cyan-400 to-teal-500",
    },
  ]);

  const getRarityColor = (type) => {
    switch (type) {
      case "Common":
        return "text-slate-700 bg-gradient-to-r from-slate-100 to-gray-200 border border-slate-300";
      case "Rare":
        return "text-blue-700 bg-gradient-to-r from-blue-100 to-sky-200 border border-blue-300";
      case "Epic":
        return "text-purple-700 bg-gradient-to-r from-purple-100 to-violet-200 border border-purple-300";
      case "Legendary":
        return "text-amber-700 bg-gradient-to-r from-yellow-100 to-amber-200 border border-yellow-300";
      default:
        return "text-slate-700 bg-gradient-to-r from-slate-100 to-gray-200 border border-slate-300";
    }
  };

  // Calculate pie chart paths
  const circumference = 2 * Math.PI * 45;
  const attendedOffset =
    circumference - (attendanceData.attended / 100) * circumference;

  return (
    <>
      <Head>
        <title>Student Progress Summary</title>
        <meta
          name="description"
          content="Track your academic progress and achievements"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 relative">
        {/* Token Balance Display */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl px-6 py-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  Token Balance
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {tokenData.currentBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-blue-900 mb-4">
              📊 Academic Progress Summary
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Track your learning journey, attendance records, and achievement
              milestones in one comprehensive dashboard.
            </p>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Attendance Rate Pie Chart */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-sky-200 hover:shadow-3xl transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                📅 Attendance Rate
              </h2>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg
                    className="w-48 h-48 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={attendedOffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-900">
                        {attendanceData.attended}%
                      </div>
                      <div className="text-sm text-gray-600">Attended</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
                  <div className="text-lg font-bold text-green-700">
                    {attendanceData.attendedClasses}
                  </div>
                  <div className="text-sm text-green-600">Classes Attended</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border border-red-200">
                  <div className="text-lg font-bold text-red-700">
                    {attendanceData.totalClasses -
                      attendanceData.attendedClasses}
                  </div>
                  <div className="text-sm text-red-600">Classes Missed</div>
                </div>
              </div>
            </div>

            {/* Token Accumulation */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-sky-200 hover:shadow-3xl transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                💰 Token Statistics
              </h2>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Total Earned
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {tokenData.totalEarned.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Total Spent
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {tokenData.totalSpent.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Current Balance
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {tokenData.currentBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-sky-200 hover:shadow-3xl transition-all duration-300 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              🎓 Course Certificates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-6 border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cert.name}
                    </h3>
                    {cert.completed ? (
                      <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 text-xs font-bold rounded-full border border-green-300">
                        ✅ Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-sky-200 text-blue-700 text-xs font-bold rounded-full border border-blue-300">
                        📚 In Progress
                      </span>
                    )}
                  </div>

                  {cert.completed ? (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Completed:</span>{" "}
                      {formatDate(cert.date)}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{cert.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-sky-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${cert.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NFT Collection */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-sky-200 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                🖼️ NFT Collection
              </h2>
              <Link
                href="/nft"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                NFT Store
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ownedNFTs.map((nft) => (
                <div
                  key={nft.id}
                  className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl overflow-hidden border-2 border-sky-200 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className={`${nft.color} p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/15 rounded-full translate-y-8 -translate-x-8"></div>
                    <div className="relative z-10 flex justify-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getRarityColor(
                          nft.type
                        )}`}
                      >
                        {nft.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2">{nft.name}</h3>
                    <div className="text-xs text-gray-500">
                      Minted: {formatDate(nft.mintDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {ownedNFTs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🖼️</div>
                <p className="text-gray-500">
                  No NFTs collected yet. Start attending classes to earn
                  rewards!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
