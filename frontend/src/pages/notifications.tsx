import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Check,
  CheckCheck,
  DollarSign,
  FileText,
  MessageSquare,
  Shield,
  AlertCircle,
  Settings,
  Trash2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NotificationWithDetails, NotificationType } from "@shared/schema";

const notificationIcons: Record<NotificationType, typeof Bell> = {
  offer_received: DollarSign,
  offer_accepted: Check,
  offer_declined: AlertCircle,
  counter_offer: DollarSign,
  message: MessageSquare,
  document_access: FileText,
  settlement_update: FileText,
  verification: Shield,
  system: Bell,
};

const mockNotifications: NotificationWithDetails[] = [
  {
    id: 1,
    type: "offer_received",
    title: "New Offer Received",
    message: "Marcus Thompson submitted an offer of $2.8M for Permian Basin Block A",
    read: false,
    actionUrl: "/offers",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    icon: "DollarSign",
  },
  {
    id: 2,
    type: "message",
    title: "New Message",
    message: "Sarah Chen sent you a message about Eagle Ford WI #42",
    read: false,
    actionUrl: "/messages",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    icon: "MessageSquare",
  },
  {
    id: 3,
    type: "document_access",
    title: "Data Room Access Requested",
    message: "James Rodriguez requested access to Delaware Basin Minerals data room",
    read: false,
    actionUrl: "/data-room",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    icon: "FileText",
  },
  {
    id: 4,
    type: "settlement_update",
    title: "Settlement Progress",
    message: "Override Package - Midland has moved to document signing phase",
    read: true,
    actionUrl: "/settlements",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    icon: "FileText",
  },
  {
    id: 5,
    type: "verification",
    title: "Identity Verified",
    message: "Your identity verification has been approved. You can now access all platform features.",
    read: true,
    actionUrl: "/profile",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    icon: "Shield",
  },
  {
    id: 6,
    type: "offer_accepted",
    title: "Offer Accepted",
    message: "Your offer for Bakken Formation Assets has been accepted. Proceed to settlement.",
    read: true,
    actionUrl: "/settlements",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    icon: "Check",
  },
  {
    id: 7,
    type: "system",
    title: "Platform Update",
    message: "Welcome to the O&G Platform MVP. Start by creating your first listing!",
    read: true,
    actionUrl: "/create-listing",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    icon: "Bell",
  },
];

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "unread"
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === activeTab);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({
      title: "All notifications marked as read",
    });
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: "Notification deleted",
    });
  };

  const getIcon = (type: NotificationType) => {
    const IconComponent = notificationIcons[type];
    return IconComponent;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b bg-background shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} data-testid="button-mark-all-read">
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
            <Link href="/settings">
              <Button variant="ghost" size="icon" data-testid="button-notification-settings">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 w-full justify-start flex-wrap h-auto gap-1" data-testid="tabs-notification-filter">
              <TabsTrigger value="all" className="relative">
                All
                {notifications.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5">{notifications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="relative">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-2 h-5 min-w-5">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="offer_received">Offers</TabsTrigger>
              <TabsTrigger value="message">Messages</TabsTrigger>
              <TabsTrigger value="settlement_update">Settlements</TabsTrigger>
            </TabsList>

            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">No notifications</h3>
                    <p className="text-muted-foreground">
                      {activeTab === "unread" ? "You're all caught up!" : "No notifications in this category"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => {
                  const IconComponent = getIcon(notification.type);
                  return (
                    <Card
                      key={notification.id}
                      className={`hover-elevate cursor-pointer transition-all ${!notification.read ? 'border-primary/30 bg-primary/5' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            !notification.read ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {notification.message}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!notification.read && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  data-testid={`button-delete-notification-${notification.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </span>
                              {notification.actionUrl && (
                                <Link href={notification.actionUrl}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`button-view-notification-${notification.id}`}
                                  >
                                    View
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
