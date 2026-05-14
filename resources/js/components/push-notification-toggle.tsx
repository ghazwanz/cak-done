import { usePage } from '@inertiajs/react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PushManager } from '@/lib/push-manager';

export function PushNotificationToggle() {
    const { vapidPublicKey, currentTeam } = usePage().props as any;
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const subscription = await PushManager.getSubscription();
            setIsEnabled(!!subscription);
        } catch (error) {
            console.error('Push check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePush = async (checked: boolean) => {
        if (!vapidPublicKey || !currentTeam) {
            toast.error('Konfigurasi Push belum lengkap.');

            return;
        }

        setLoading(true);

        try {
            if (checked) {
                // Subscribe
                const permission = await Notification.requestPermission();

                if (permission !== 'granted') {
                    toast.error('Izin notifikasi ditolak.');
                    setIsEnabled(false);

                    return;
                }

                const subscription = await PushManager.subscribe(vapidPublicKey);
                
                // Save to server
                await fetch(`/${currentTeam.slug}/push-subscriptions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                    body: JSON.stringify(subscription)
                });

                setIsEnabled(true);
                toast.success('Notifikasi Push Aktif!');
            } else {
                // Unsubscribe
                const subscription = await PushManager.unsubscribe();
                
                if (subscription) {
                    await fetch(`/${currentTeam.slug}/push-subscriptions`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        },
                        body: JSON.stringify({ endpoint: subscription.endpoint })
                    });
                }

                setIsEnabled(false);
                toast.success('Notifikasi Push Dimatikan.');
            }
        } catch (error) {
            console.error('Push toggle failed:', error);
            toast.error('Gagal mengatur notifikasi.');
            setIsEnabled(!checked);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {isEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                </div>
                <div className="space-y-0.5">
                    <Label className="text-sm font-black uppercase tracking-tight">Notifikasi Desktop</Label>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Peringatan otomatis di browser</p>
                </div>
            </div>
            {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
                <Switch 
                    checked={isEnabled} 
                    onCheckedChange={togglePush}
                    className="data-[state=checked]:bg-primary"
                />
            )}
        </div>
    );
}
