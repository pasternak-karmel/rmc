"use client";

import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Non connecté</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous devez être connecté pour accéder à cette page.</p>
            <Button asChild className="mt-4">
              <Link href="/auth/sign-in">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase();

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Profil</CardTitle>
          </div>
        </CardHeader>
        {/* Le reste du code reste inchangé */}
        <CardContent>
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image || ""} alt={user.name || "User"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Informations personnelles</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {user.name || "Non renseigné"}
              </p>
            </div>

            <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {user.email || "Non renseigné"}
              </p>
            </div>

            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href="/settings">Modifier le profil</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}