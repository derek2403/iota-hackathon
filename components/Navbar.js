import Link from 'next/link';
import { ConnectButton } from "@iota/dapp-kit";
import '@iota/dapp-kit/dist/index.css';

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <div className="flex justify-between items-center p-4">
        <nav className="flex space-x-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            🏠 Home
          </Link>
          <Link href="/scan" className="text-blue-600 hover:text-blue-800 font-medium">
            📷 Face Scan
          </Link>
          <Link href="/attendance" className="text-blue-600 hover:text-blue-800 font-medium">
            🏢 Attendance
          </Link>
        </nav>
        <ConnectButton />
      </div>
    </header>
  );
}
