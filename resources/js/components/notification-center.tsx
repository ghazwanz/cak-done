import { usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, BellDot, Check, Inbox } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PushNotificationToggle } from '@/components/push-notification-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export function NotificationCenter() {
    const { currentTeam } = usePage().props as any;
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!currentTeam) {
return;
}

        setLoading(true);

        try {
            const response = await fetch(`/${currentTeam.slug}/notifications`);
            const data = await response.json();
            setNotifications(data.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 300000);

        return () => clearInterval(interval);
    }, [currentTeam?.slug]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/${currentTeam.slug}/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                }
            });
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`/${currentTeam.slug}/notifications/read-all`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                }
            });
            setNotifications([]);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent/50">
                    {notifications.length > 0 ? (
                        <>
                            <BellDot className="h-5 w-5 text-primary animate-pulse" />
                            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-[10px] font-black border-2 border-background">
                                {notifications.length}
                            </Badge>
                        </>
                    ) : (
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl border-border shadow-2xl p-2">
                <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground p-0">Notifikasi</DropdownMenuLabel>
                    {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold gap-1" onClick={markAllAsRead}>
                            <Check className="h-3 w-3" /> Tandai Semua Terbaca
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className="mx--2" />
                
                <div className="max-h-[400px] overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <Inbox className="h-8 w-8 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Belum ada notifikasi baru</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors group relative mb-1">
                                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-xs font-medium leading-tight text-foreground">
                                        {n.data.message || 'Peringatan Stok'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <Check className="h-3 w-3" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="p-2 border-t border-border mt-1">
                    <PushNotificationToggle />
                </div>

                {notifications.length > 0 && (
                    <div className="p-2 border-t border-border mt-1">
                        <Button variant="outline" className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-8" onClick={() => markAllAsRead()}>
                            Hapus Semua
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
