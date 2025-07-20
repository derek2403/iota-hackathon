import Link from 'next/link';
import { ConnectButton } from "@iota/dapp-kit";
import '@iota/dapp-kit/dist/index.css';

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <div className="flex justify-between items-center p-4">
        <nav className="flex space-x-6">
        </nav>
        <ConnectButton />
      </div>
    </header>
  );
}
