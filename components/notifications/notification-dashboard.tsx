"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/use-notifications";
import { AlertTriangle, Bell, Check, Clock, Eye, Info } from "lucide-react";
import Link from "next/link";
import { formatDateCustom } from "../patients/date-formater";

export function NotificationDashboard() {
  const { data, isLoading, error, markAsRead, markAllAsRead } =
    useNotifications();

  const notifications = Array.isArray(data) ? data : [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "appointment":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 border-amber-200"
          >
            Haute
          </Badge>
        );
      case "normal":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            Normale
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            Basse
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <Skeleton className="h-9 w-32" />
        </div>
        <Tabs defaultValue="all">
          <TabsList>
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md ml-1" />
            <Skeleton className="h-9 w-20 rounded-md ml-1" />
          </TabsList>
          <div className="mt-4 grid gap-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </Tabs>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">
              Erreur lors du chargement des notifications
            </h2>
            <p className="text-muted-foreground">
              {error.message ||
                "Une erreur est survenue lors du chargement des notifications"}
            </p>
            <Button onClick={() => window.location.reload()}>Réessayer</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read);
  const actionRequiredNotifications = notifications.filter(
    (n) => n.actionRequired
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadNotifications.length > 0 && (
          <Button onClick={() => markAllAsRead()}>
            <Check className="mr-2 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Toutes{" "}
            <Badge variant="secondary" className="ml-2">
              {notifications?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Non lues{" "}
            <Badge variant="secondary" className="ml-2">
              {unreadNotifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="action">
            Action requise{" "}
            <Badge variant="secondary" className="ml-2">
              {actionRequiredNotifications.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 grid gap-4">
          {notifications?.length === 0 ? (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aucune notification</h3>
                <p className="text-muted-foreground">
                  Vous n&apos;avez pas encore reçu de notifications.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications?.map((notification) => (
              <Card
                key={notification.id}
                className={notification.read ? "opacity-80" : "border-primary"}
              >
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(
                        notification.type,
                        notification.priority
                      )}
                      <CardTitle
                        className={`text-base ${!notification.read ? "text-primary font-medium" : ""}`}
                      >
                        {notification.title}
                      </CardTitle>
                    </div>
                    {getPriorityBadge(notification.priority)}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDateCustom(notification.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    {notification.patientId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/patients/${notification.patientId}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          Patient
                        </Link>
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Marquer comme lu
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-4 grid gap-4">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Check className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  Aucune notification non lue
                </h3>
                <p className="text-muted-foreground">
                  Vous avez lu toutes vos notifications.
                </p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification) => (
              <Card key={notification.id} className="border-primary">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(
                        notification.type,
                        notification.priority
                      )}
                      <CardTitle className="text-base text-primary font-medium">
                        {notification.title}
                      </CardTitle>
                    </div>
                    {getPriorityBadge(notification.priority)}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDateCustom(notification.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    {notification.patientId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/patients/${notification.patientId}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          Patient
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Marquer comme lu
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="action" className="mt-4 grid gap-4">
          {actionRequiredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Check className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aucune action requise</h3>
                <p className="text-muted-foreground">
                  Vous n&apos;avez pas de notifications nécessitant une action.
                </p>
              </CardContent>
            </Card>
          ) : (
            actionRequiredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={notification.read ? "opacity-80" : "border-primary"}
              >
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(
                        notification.type,
                        notification.priority
                      )}
                      <CardTitle
                        className={`text-base ${!notification.read ? "text-primary font-medium" : ""}`}
                      >
                        {notification.title}
                      </CardTitle>
                    </div>
                    {getPriorityBadge(notification.priority)}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDateCustom(notification.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    {notification.patientId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/patients/${notification.patientId}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          Patient
                        </Link>
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Marquer comme lu
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
