import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Check,
  CheckCheck,
  ArrowLeft,
  ExternalLink,
  FileText,
  Zap,
  ChevronDown,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import type { ConversationWithDetails, MessageWithSender } from "@shared/schema";

interface ExtendedMessage extends MessageWithSender {
  readAt?: string;
}

interface ConversationState extends ConversationWithDetails {
  messages: ExtendedMessage[];
  assetType?: string;
  assetLocation?: string;
}

interface QuickReplyTemplate {
  id: string;
  label: string;
  message: string;
  category: "general" | "offer" | "dataroom" | "closing";
}

const quickReplyTemplates: QuickReplyTemplate[] = [
  {
    id: "interested",
    label: "Expressing Interest",
    message: "Thank you for reaching out. I'm very interested in discussing this opportunity further. When would be a good time for a call?",
    category: "general",
  },
  {
    id: "data-room-access",
    label: "Grant Data Room Access",
    message: "I've granted you access to the virtual data room. You'll find all the production reports, geology data, and legal documents there. Let me know if you have any questions.",
    category: "dataroom",
  },
  {
    id: "offer-received",
    label: "Offer Acknowledgment",
    message: "Thank you for your offer. I've received it and will review it with my team. I'll get back to you within 48 hours with our response.",
    category: "offer",
  },
  {
    id: "counter-offer",
    label: "Counter Offer",
    message: "After reviewing your offer, I'd like to propose some modifications to the terms. Can we schedule a call to discuss?",
    category: "offer",
  },
  {
    id: "documents-ready",
    label: "Documents Ready",
    message: "All the closing documents have been prepared and uploaded to the data room. Please review and let me know if you need any clarifications.",
    category: "closing",
  },
  {
    id: "schedule-call",
    label: "Schedule a Call",
    message: "I'd like to schedule a call to discuss the details further. What times work best for you this week?",
    category: "general",
  },
];

const initialConversations: ConversationState[] = [
  {
    id: 1,
    participantId: "user-1",
    participantName: "Marcus Thompson",
    listingId: 1,
    listingName: "Permian Basin Block A",
    assetType: "Working Interest",
    assetLocation: "Midland County, TX",
    lastMessage: "I'd like to schedule a call to discuss the terms further.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    unreadCount: 2,
    messages: [
      {
        id: 1,
        content: "Hi, I'm interested in your Permian Basin listing. Is it still available?",
        senderId: "user-1",
        senderName: "Marcus Thompson",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        isOwn: false,
      },
      {
        id: 2,
        content: "Yes, it's still available! Would you like to schedule a viewing of the data room?",
        senderId: "current-user",
        senderName: "You",
        read: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 22.5).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
        isOwn: true,
      },
      {
        id: 3,
        content: "That would be great. I've reviewed the listing details and I'm very interested. The production numbers look promising.",
        senderId: "user-1",
        senderName: "Marcus Thompson",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        isOwn: false,
      },
      {
        id: 4,
        content: "Excellent! I've granted you access to the data room. You'll find all the production reports, geology data, and legal documents there.",
        senderId: "current-user",
        senderName: "You",
        read: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        isOwn: true,
      },
      {
        id: 5,
        content: "I've reviewed the documents. Everything looks good. I'd like to make an offer.",
        senderId: "user-1",
        senderName: "Marcus Thompson",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        isOwn: false,
      },
      {
        id: 6,
        content: "I'd like to schedule a call to discuss the terms further.",
        senderId: "user-1",
        senderName: "Marcus Thompson",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        isOwn: false,
      },
    ],
  },
  {
    id: 2,
    participantId: "user-2",
    participantName: "Sarah Chen",
    listingId: 2,
    listingName: "Eagle Ford WI #42",
    assetType: "Working Interest",
    assetLocation: "Karnes County, TX",
    lastMessage: "Thank you for accepting my offer. What are the next steps?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
    messages: [
      {
        id: 1,
        content: "I'd like to submit an offer for your Eagle Ford working interest.",
        senderId: "user-2",
        senderName: "Sarah Chen",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        isOwn: false,
      },
      {
        id: 2,
        content: "I've reviewed your offer. It looks competitive. Let me discuss with my team.",
        senderId: "current-user",
        senderName: "You",
        read: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        isOwn: true,
      },
      {
        id: 3,
        content: "We've decided to accept your offer. Congratulations!",
        senderId: "current-user",
        senderName: "You",
        read: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        isOwn: true,
      },
      {
        id: 4,
        content: "Thank you for accepting my offer. What are the next steps?",
        senderId: "user-2",
        senderName: "Sarah Chen",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        isOwn: false,
      },
    ],
  },
  {
    id: 3,
    participantId: "user-3",
    participantName: "James Rodriguez",
    listingId: 3,
    listingName: "Delaware Basin Minerals",
    assetType: "Mineral Rights",
    assetLocation: "Reeves County, TX",
    lastMessage: "Can you provide more details about the production history?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 1,
    messages: [
      {
        id: 1,
        content: "I saw your Delaware Basin minerals listing. Very interesting property.",
        senderId: "user-3",
        senderName: "James Rodriguez",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        isOwn: false,
      },
      {
        id: 2,
        content: "Thank you for your interest! Let me know if you have any questions.",
        senderId: "current-user",
        senderName: "You",
        read: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        isOwn: true,
      },
      {
        id: 3,
        content: "Can you provide more details about the production history?",
        senderId: "user-3",
        senderName: "James Rodriguez",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        isOwn: false,
      },
    ],
  },
  {
    id: 4,
    participantId: "user-4",
    participantName: "Emily Watson",
    listingName: "Override Package - Midland",
    assetType: "Override Interest",
    assetLocation: "Midland County, TX",
    lastMessage: "The documents look good. Ready to proceed.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    unreadCount: 0,
    messages: [
      {
        id: 1,
        content: "I'm interested in your override package in the Midland Basin.",
        senderId: "user-4",
        senderName: "Emily Watson",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
        isOwn: false,
      },
      {
        id: 2,
        content: "Great! I've uploaded all the documents to the data room.",
        senderId: "current-user",
        senderName: "You",
        read: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        isOwn: true,
      },
      {
        id: 3,
        content: "The documents look good. Ready to proceed.",
        senderId: "user-4",
        senderName: "Emily Watson",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        isOwn: false,
      },
    ],
  },
];

const getCategoryLabel = (category: QuickReplyTemplate["category"]) => {
  switch (category) {
    case "general": return "General";
    case "offer": return "Offers";
    case "dataroom": return "Data Room";
    case "closing": return "Closing";
  }
};

export default function Messages() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationState[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isMobileViewingConversation, setIsMobileViewingConversation] = useState(false);

  const selectedConversation = useMemo(() => 
    conversations.find(c => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(() => 
    conversations.filter(conv =>
      conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.listingName?.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [conversations, searchQuery]
  );

  const totalUnread = useMemo(() => 
    conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    [conversations]
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    const message: MessageWithSender = {
      id: Date.now(),
      content: newMessage,
      senderId: "current-user",
      senderName: "You",
      read: false,
      createdAt: new Date().toISOString(),
      isOwn: true,
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, message],
          lastMessage: newMessage,
          lastMessageAt: new Date().toISOString(),
        };
      }
      return conv;
    }));

    setNewMessage("");

    toast({
      title: "Message sent",
      description: "Your message has been delivered.",
    });
  };

  const handleSelectConversation = (convId: number) => {
    setSelectedConversationId(convId);
    setIsMobileViewingConversation(true);

    setConversations(prev => prev.map(conv => {
      if (conv.id === convId && conv.unreadCount > 0) {
        return {
          ...conv,
          unreadCount: 0,
          messages: conv.messages.map(msg => ({ 
            ...msg, 
            read: true,
            readAt: msg.readAt || new Date().toISOString(),
          })),
        };
      }
      return conv;
    }));
  };

  const handleBackToList = () => {
    setIsMobileViewingConversation(false);
    setSelectedConversationId(null);
  };

  const handleQuickReply = (template: QuickReplyTemplate) => {
    setNewMessage(template.message);
    toast({
      title: "Template applied",
      description: `"${template.label}" template loaded.`,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b bg-background shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Messages</h1>
              <p className="text-sm text-muted-foreground">
                {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col ${isMobileViewingConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-conversations"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 hover-elevate cursor-pointer ${selectedConversationId === conv.id ? 'bg-accent' : ''}`}
                  onClick={() => handleSelectConversation(conv.id)}
                  data-testid={`conversation-item-${conv.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {conv.participantName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {conv.participantName}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                        </span>
                      </div>
                      {conv.listingName && (
                        <p className="text-xs text-primary truncate mt-0.5">{conv.listingName}</p>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="shrink-0 h-5 min-w-5 flex items-center justify-center">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className={`flex-1 flex flex-col ${!isMobileViewingConversation && !selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center justify-between gap-4 shrink-0 bg-card">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={handleBackToList}
                    data-testid="button-back-to-list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedConversation.participantName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.participantName}</h3>
                    {selectedConversation.listingName && (
                      <p className="text-sm text-muted-foreground">Re: {selectedConversation.listingName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" data-testid="button-phone">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" data-testid="button-video">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" data-testid="button-more">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedConversation.listingName && (
                <div className="px-4 py-3 border-b bg-muted/50">
                  <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" data-testid="text-asset-name">{selectedConversation.listingName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {selectedConversation.assetType && (
                            <span data-testid="text-asset-type">{selectedConversation.assetType}</span>
                          )}
                          {selectedConversation.assetType && selectedConversation.assetLocation && (
                            <span>-</span>
                          )}
                          {selectedConversation.assetLocation && (
                            <span data-testid="text-asset-location">{selectedConversation.assetLocation}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedConversation.listingId && (
                      <Link href={`/marketplace/${selectedConversation.listingId}`}>
                        <Button variant="outline" size="sm" className="gap-1" data-testid="button-view-listing">
                          <ExternalLink className="w-3 h-3" /> View Listing
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[80%] ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                        {!msg.isOwn && (
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {msg.senderName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            msg.isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${msg.isOwn ? 'justify-end' : ''}`}>
                            <span className={`text-xs ${msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                            </span>
                            {msg.isOwn && (
                              msg.read ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-0.5 cursor-help" data-testid={`status-read-${msg.id}`}>
                                      <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                                      {msg.readAt && (
                                        <Eye className="w-2.5 h-2.5 text-primary-foreground/70" />
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Read {msg.readAt ? formatDistanceToNow(new Date(msg.readAt), { addSuffix: true }) : ''}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help" data-testid={`status-sent-${msg.id}`}>
                                      <Check className="w-3 h-3 text-primary-foreground/70" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Delivered</p>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-card shrink-0">
                <div className="flex items-end gap-2 max-w-3xl mx-auto">
                  <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-attach">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-quick-reply">
                        <Zap className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuLabel>Quick Replies</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">General</DropdownMenuLabel>
                      {quickReplyTemplates.filter(t => t.category === "general").map(template => (
                        <DropdownMenuItem 
                          key={template.id} 
                          onClick={() => handleQuickReply(template)}
                          data-testid={`quick-reply-${template.id}`}
                        >
                          {template.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Offers</DropdownMenuLabel>
                      {quickReplyTemplates.filter(t => t.category === "offer").map(template => (
                        <DropdownMenuItem 
                          key={template.id} 
                          onClick={() => handleQuickReply(template)}
                          data-testid={`quick-reply-${template.id}`}
                        >
                          {template.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Data Room</DropdownMenuLabel>
                      {quickReplyTemplates.filter(t => t.category === "dataroom").map(template => (
                        <DropdownMenuItem 
                          key={template.id} 
                          onClick={() => handleQuickReply(template)}
                          data-testid={`quick-reply-${template.id}`}
                        >
                          {template.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Closing</DropdownMenuLabel>
                      {quickReplyTemplates.filter(t => t.category === "closing").map(template => (
                        <DropdownMenuItem 
                          key={template.id} 
                          onClick={() => handleQuickReply(template)}
                          data-testid={`quick-reply-${template.id}`}
                        >
                          {template.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex-1">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-10"
                      data-testid="input-message"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="shrink-0"
                    data-testid="button-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/30">
              <div className="text-center p-8">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
