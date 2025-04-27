import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-gray-800 text-white px-2 py-2 sm:px-4 sm:py-4 fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <Link href="/" className="text-xl font-bold">
          MemeSwipe
        </Link>
        <div className="flex items-center gap-4 flex-shrink-0 self-end sm:self-center">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <span className="text-red-500">SIGNED OUT TEST</span>
            <SignInButton mode="modal">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
} 