import React, { useState } from "react";
import Link from "next/link";

const DIDDisplay = ({
  didInfo,
  credential,
  onCreateNewDID,
  onVerifyCredential,
}) => {
  const [copied, setCopied] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleVerifyCredential = async () => {
    if (!credential) return;

    setVerifying(true);
    try {
      const result = await onVerifyCredential(credential.credential);
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        valid: false,
        error: error.message,
        success: false,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-8 w-8 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-green-800">
              Identity Created Successfully!
            </h3>
            <p className="text-green-700 mt-1">
              Your decentralized identity has been created and is ready to use.
            </p>
          </div>
        </div>
      </div>

      {/* Blockchain Publishing Success */}
      {didInfo.published && didInfo.transactionDigest && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.5 2.5l-.5-.5M15 9l2 2L19 9m-7 7h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-800">
                🎉 DID Published to Blockchain!
              </h3>
              <p className="text-green-700 mt-1">
                Your DID has been successfully recorded on the IOTA testnet
                blockchain.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {didInfo.explorerTransactionUrl && (
                  <a
                    href={didInfo.explorerTransactionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    View Transaction on Explorer
                  </a>
                )}
                <span className="inline-flex items-center px-3 py-2 text-sm bg-green-100 text-green-800 rounded-md">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Permanently Recorded
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User-Based DID Information */}
      {didInfo.didGenerationMethod === "user-credentials" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                🧬 User-Based DID Generation
              </p>
              <p className="text-sm text-blue-600">
                This DID is generated from your identity credentials, ensuring
                the same user always gets the same DID.
              </p>
              <div className="mt-2 text-xs text-blue-700">
                <p>
                  ✅ <strong>Benefits of user-based DIDs:</strong>
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Same user credentials always generate the same DID</li>
                  <li>Prevents multiple DIDs for the same person</li>
                  <li>DID is tied to identity, not wallet address</li>
                  <li>Different wallets can be linked to the same identity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DID Information */}
      <div className="bg-white p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Your Decentralized Identifier (DID)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DID
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm font-mono break-all">
                {didInfo.did}
              </code>
              <button
                onClick={() => copyToClipboard(didInfo.did)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="Copy DID"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {didInfo.transactionDigest && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Digest
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-blue-50 rounded-md text-sm font-mono break-all text-blue-800">
                  {didInfo.transactionDigest}
                </code>
                <button
                  onClick={() => copyToClipboard(didInfo.transactionDigest)}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Copy Transaction Digest"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Information */}
      {credential && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Your Identity Information
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                try {
                  const credentialData = JSON.parse(credential.credential);
                  const subject = credentialData.credential?.credentialSubject;

                  if (subject) {
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Name
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {subject.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {subject.email || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Country
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {subject.country || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Date of Birth
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {subject.dateOfBirth &&
                            subject.dateOfBirth !== "0001-01-01"
                              ? subject.dateOfBirth
                              : "N/A"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {subject.address || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            ID Number
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {subject.idNumber
                              ? `****${subject.idNumber.slice(-4)}`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Verification Status
                          </label>
                          <p className="mt-1 text-sm text-green-600 font-medium">
                            {subject.verificationStatus || "Verified"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Issued At
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {subject.issuedAt
                              ? new Date(subject.issuedAt).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </>
                    );
                  }
                } catch (error) {
                  console.error("Error parsing credential:", error);
                }

                return (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">
                      Unable to display user information
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Verifiable Credential */}
      {credential && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Verifiable Credential
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credential JWT
              </label>
              <textarea
                value={credential.credential}
                readOnly
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-xs font-mono"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => copyToClipboard(credential.credential)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Copy Credential
              </button>

              <button
                onClick={handleVerifyCredential}
                disabled={verifying}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400"
              >
                {verifying ? "Verifying..." : "Verify Credential"}
              </button>
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <div
                className={`p-4 rounded-md ${
                  verificationResult.valid
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {verificationResult.valid ? (
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h4
                      className={`text-sm font-medium ${
                        verificationResult.valid
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {verificationResult.valid
                        ? "Credential Verified Successfully!"
                        : "Credential Verification Failed"}
                    </h4>
                    {verificationResult.error && (
                      <p className="text-red-700 text-sm mt-1">
                        {verificationResult.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">What's Next?</h3>
        <div className="space-y-2 text-blue-800">
          <p>
            • Your DID is now globally resolvable and can be used for
            authentication
          </p>
          <p>
            • Share your DID with services that support decentralized identity
          </p>
          <p>
            • Your verifiable credential can be presented to prove your identity
          </p>
          <p>• Keep your private keys secure - they control your identity</p>
        </div>
      </div>

      {/* Create New DID Button */}
      <div className="text-center space-x-4">
        <button
          onClick={onCreateNewDID}
          className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Create Another Identity
        </button>

        <Link
          href="/summary"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          📊 View Attendance Summary
        </Link>
      </div>
    </div>
  );
};

export default DIDDisplay;
