"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { LogIn } from 'lucide-react'; // Optional: add an icon

interface LoginRequiredModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginRequiredModal({ isOpen, onOpenChange }: LoginRequiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-rose-500" /> {/* Optional Icon */}
            Login Required
          </DialogTitle>
          <DialogDescription>
            You need to sign in or sign up to perform this action.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>Please log in or create an account to continue enjoying MemeSwipe!</p>
        </div>
        <div className="flex justify-end gap-4">
          <SignInButton mode="modal">
            <Button variant="ghost">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button>Sign Up</Button>
          </SignUpButton>
        </div>
      </DialogContent>
    </Dialog>
  )
} 