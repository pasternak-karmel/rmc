"use client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import SignInPage from "./(auth)/auth/sign-in/page";

export default function Home() {
  const { data: session } = useSession();
  const isConnected = session?.user?.email;
  return (
    <div>
      {isConnected ? (
        <div>
          <Link href="/dashboard">
            <Button>go the dashboard</Button>
          </Link>
        </div>
      ) : (
        <SignInPage />
      )}
    </div>
  );
}
