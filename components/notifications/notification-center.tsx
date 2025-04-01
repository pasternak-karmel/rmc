"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Check, Eye } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationCenter() {
  const {
    data: notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <Badge variant="destructive" className="h-2 w-2 rounded-full" />;
      case "warning":
        return (
          <Badge
            variant="outline"
            className="h-2 w-2 rounded-full bg-amber-500"
          />
        );
      default:
        return <Badge variant="secondary" className="h-2 w-2 rounded-full" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    }

    return format(date, "dd/MM/yyyy à HH:mm", { locale: fr });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <Check className="mr-1 h-3 w-3" />
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement des notifications...
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            notifications?.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-default flex flex-col items-start p-3"
              >
                <div className="flex w-full justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span
                      className={`font-medium ${
                        !notification.read ? "text-primary" : ""
                      }`}
                    >
                      {notification.title}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {notification.patientId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        asChild
                      >
                        <Link href={`/patients/${notification.patientId}`}>
                          <Eye className="h-3 w-3" />
                          <span className="sr-only">Voir le patient</span>
                        </Link>
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                        <span className="sr-only">Marquer comme lu</span>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(notification.createdAt)}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/notifications"
            className="cursor-pointer justify-center text-center text-sm font-medium"
          >
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
