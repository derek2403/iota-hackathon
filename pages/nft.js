import { useState, useEffect } from "react";
import Head from "next/head";

export default function NFTPage() {
  const [mintingStates, setMintingStates] = useState({
    certificate: false,
    freeMeal: false,
    voucher1: false,
    voucher2: false,
  });

  // Token balance state
  const [tokenBalance, setTokenBalance] = useState(1250); // Initial balance

  const handleMint = async (nftType, cost) => {
    if (tokenBalance < cost) {
      alert(
        `Insufficient tokens! You need ${cost} tokens but only have ${tokenBalance}.`
      );
      return;
    }

    setMintingStates((prev) => ({ ...prev, [nftType]: true }));

    // Simulate minting process
    setTimeout(() => {
      setMintingStates((prev) => ({ ...prev, [nftType]: false }));
      setTokenBalance((prev) => prev - cost); // Deduct tokens
      alert(
        `${nftType} NFT minted successfully! 🎉\nTokens spent: ${cost}\nRemaining balance: ${
          tokenBalance - cost
        }`
      );
    }, 2000);
  };

  const nftRewards = [
    {
      id: "certificate",
      title: "Achievement Certificate",
      description: "Proof of course completion and academic excellence",
      color: "bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-500",
      borderColor: "border-sky-300",
      buttonColor: "from-sky-400 via-blue-500 to-indigo-600",
      glowColor: "shadow-sky-200/50",
      icon: (
        <svg
          className="w-20 h-20 text-white drop-shadow-lg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path d="M8,12H16V14H8V12M8,16H13V18H8V16M8,8H16V10H8V8Z" />
        </svg>
      ),
      rarity: "Legendary",
      benefit: "Official course completion certificate",
      cost: 500,
    },
    {
      id: "freeMeal",
      title: "Free Meal Voucher",
      description: "Enjoy a complimentary meal at the campus cafeteria",
      color: "bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500",
      borderColor: "border-cyan-300",
      buttonColor: "from-cyan-400 via-sky-500 to-blue-600",
      glowColor: "shadow-cyan-200/50",
      icon: (
        <svg
          className="w-20 h-20 text-white drop-shadow-lg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8.1,13.34L3.91,9.16C2.35,7.59 2.35,5.06 3.91,3.5L10.93,10.5L8.1,13.34M14.88,11.53C16.87,12.06 18.6,13.5 19.65,15.41C21.55,18.5 18.5,21.55 15.41,19.65C13.5,18.6 12.06,16.87 11.53,14.88L18.36,8.05C19.92,6.5 19.92,3.91 18.36,2.36C16.8,0.8 14.21,0.8 12.66,2.36L8.1,6.91L1.11,13.9C0.74,14.27 0.74,14.87 1.11,15.24L8.5,22.63C8.87,23 9.47,23 9.84,22.63L14.88,17.59V11.53Z" />
        </svg>
      ),
      rarity: "Common",
      benefit: "Free variety of meal at campus cafeteria",
      cost: 100,
    },
    {
      id: "voucher1",
      title: "Study Materials Voucher",
      description: "Access to premium learning resources and materials",
      color: "bg-gradient-to-br from-sky-200 via-cyan-400 to-teal-500",
      borderColor: "border-sky-300",
      buttonColor: "from-sky-400 via-cyan-500 to-teal-600",
      glowColor: "shadow-sky-200/50",
      icon: (
        <svg
          className="w-20 h-20 text-white drop-shadow-lg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19,3H5C3.9,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.9 20.1,3 19,3M5,19V5H9V12L11.5,10.5L14,12V5H19V19H5Z" />
        </svg>
      ),
      rarity: "Rare",
      benefit: "Premium variety of study materials access",
      cost: 250,
    },
    {
      id: "voucher2",
      title: "Library Extension Pass",
      description: "Extended library hours and premium section access",
      color: "bg-gradient-to-br from-blue-300 via-sky-400 to-cyan-500",
      borderColor: "border-blue-300",
      buttonColor: "from-blue-400 via-sky-500 to-cyan-600",
      glowColor: "shadow-blue-200/50",
      icon: (
        <svg
          className="w-20 h-20 text-white drop-shadow-lg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z" />
        </svg>
      ),
      rarity: "Epic",
      benefit: "24/7 library access + premium sections",
      cost: 350,
    },
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "Common":
        return "text-slate-700 bg-gradient-to-r from-slate-100 to-gray-200 border border-slate-300 shadow-sm";
      case "Rare":
        return "text-blue-700 bg-gradient-to-r from-blue-100 to-sky-200 border border-blue-300 shadow-sm";
      case "Epic":
        return "text-purple-700 bg-gradient-to-r from-purple-100 to-violet-200 border border-purple-300 shadow-sm";
      case "Legendary":
        return "text-amber-700 bg-gradient-to-r from-yellow-100 to-amber-200 border border-yellow-300 shadow-sm";
      default:
        return "text-slate-700 bg-gradient-to-r from-slate-100 to-gray-200 border border-slate-300 shadow-sm";
    }
  };

  return (
    <>
      <Head>
        <title>Class Attendance NFT Rewards</title>
        <meta
          name="description"
          content="Mint exclusive NFT rewards for attending classes"
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
                  {tokenBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-blue-900 mb-4">
              🎓 Class Attendance Rewards
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Mint exclusive NFT rewards for your dedication to learning. Each
              NFT represents your commitment to education and unlocks special
              benefits.
            </p>
            <div className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-full text-sm font-medium shadow-lg border border-emerald-200">
              ✨ Limited Time Offer - Mint Now!
            </div>
          </div>

          {/* NFT Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {nftRewards.map((nft) => (
              <div
                key={nft.id}
                className={`bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 border-2 ${nft.borderColor} ${nft.glowColor} relative group flex flex-col h-full`}
              >
                {/* Animated background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>

                {/* NFT Image/Icon Section */}
                <div className={`${nft.color} p-10 relative overflow-hidden`}>
                  {/* Animated background elements */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/15 rounded-full translate-y-16 -translate-x-16 animate-pulse delay-75"></div>
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12 animate-ping delay-150"></div>

                  <div className="relative z-10 flex justify-center">
                    {nft.icon}
                  </div>
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-4 py-2 rounded-full text-xs font-bold ${getRarityColor(
                        nft.rarity
                      )}`}
                    >
                      {nft.rarity}
                    </span>
                  </div>
                </div>

                {/* NFT Details */}
                <div className="p-6 relative flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {nft.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {nft.description}
                  </p>

                  <div className="mb-5">
                    <div className="text-xs text-gray-500 mb-2 font-medium">
                      Benefit:
                    </div>
                    <div className="text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg p-3 border min-h-[3rem] flex items-center">
                      {nft.benefit}
                    </div>
                  </div>

                  {/* Cost Display */}
                  <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Mint Cost:
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-md">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                          </svg>
                        </div>
                        <span className="font-bold text-lg text-gray-900">
                          {nft.cost}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6 text-center">
                    <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-3 border shadow-sm">
                      <div className="text-xs text-gray-500 font-medium">
                        Supply
                      </div>
                      <div className="font-bold text-gray-900">Limited</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-3 border shadow-sm">
                      <div className="text-xs text-gray-500 font-medium">
                        Chain
                      </div>
                      <div className="font-bold text-gray-900">IOTA</div>
                    </div>
                  </div>

                  {/* Spacer to push button to bottom */}
                  <div className="flex-grow"></div>

                  {/* Mint Button */}
                  <button
                    onClick={() => handleMint(nft.id, nft.cost)}
                    disabled={mintingStates[nft.id] || tokenBalance < nft.cost}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 text-sm mt-auto ${
                      mintingStates[nft.id]
                        ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed shadow-lg"
                        : tokenBalance < nft.cost
                        ? "bg-gradient-to-r from-red-400 to-red-500 cursor-not-allowed shadow-lg"
                        : `bg-gradient-to-r ${nft.buttonColor} hover:shadow-2xl hover:scale-105 active:scale-95 shadow-lg`
                    }`}
                  >
                    {mintingStates[nft.id] ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Minting...
                      </div>
                    ) : tokenBalance < nft.cost ? (
                      "❌ Insufficient Tokens"
                    ) : (
                      "🚀 Mint NFT"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
