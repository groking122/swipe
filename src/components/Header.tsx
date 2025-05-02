import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { BsTwitterX } from 'react-icons/bs';

export function Header() {
  return (
    <header className="bg-gray-800 text-white px-2 py-2 sm:px-4 sm:py-4 fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image
            src="/icons8-x-50.png"
            alt="MemeSwipe Logo"
            width={28}
            height={28}
          />
          MemeSwipe
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
          <ThemeToggle />
          <a 
            href="https://x.com/thememeswipe"
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Follow us on X/Twitter"
            title="Follow us on X/Twitter"
          >
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700 p-2">
              <BsTwitterX size={20} />
              <span className="sr-only">X/Twitter</span>
            </Button>
          </a>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="bg-transparent hover:bg-gray-700 text-white border-white hover:text-white">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
} 