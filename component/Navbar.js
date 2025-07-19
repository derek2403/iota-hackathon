import { ConnectButton } from "@iota/dapp-kit";
import '@iota/dapp-kit/dist/index.css';

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <div className="flex justify-end p-4">
        <ConnectButton />
      </div>
    </header>
  );
}
