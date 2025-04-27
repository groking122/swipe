import { SignedIn, UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
  return (
    // Wrap content in SignedIn to ensure user is authenticated
    <SignedIn>
      <div className="container mx-auto max-w-4xl py-8">
        <h1 className="mb-6 text-3xl font-bold">Account</h1>
        {/* Use Clerk's UserProfile component */}
        <UserProfile routing="hash" />
      </div>
    </SignedIn>
  );
} 