import Link from 'next/link';
import { ConnectButton } from "@iota/dapp-kit";
import '@iota/dapp-kit/dist/index.css';

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <div className="flex justify-between items-center p-4 px-8">
        {/* Logo on the left */}
        <img 
          src="/logo.png" 
          alt="Logo" 
          width={120} 
          height={40} 
          className="object-contain"
        />
        
        {/* Navigation links in the middle */}
        <nav className="flex space-x-6">
          <Link href="/attendance" className="text-gray-700 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <Link href="/attendance" className="text-gray-700 hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <Link href="/attendance" className="text-gray-700 hover:text-gray-900 transition-colors">
            Profile
          </Link>
        </nav>
        
        {/* Connect button on the right */}
        <ConnectButton />
      </div>
    </header>
  );
}
