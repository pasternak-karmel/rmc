"use client";

import SignUpForm from "@/components/auth/SignUpForm";

import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <SignUpForm />
      <p className="mt-4 text-gray-700">
        <Link href="/sign-in" className="text-blue-500 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
