import { router } from '@inertiajs/react';
import { AlertTriangle, Zap, ThermometerSnowflake, Loader2, MessageSquareQuote } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from '@/components/ui/dialog';

interface EmergencyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamSlug: string;
}

export function EmergencyModal({ open, onOpenChange, teamSlug }: EmergencyModalProps) {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [narration, setNarration] = useState<string | null>(null);

    const triggerEmergency = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/${teamSlug}/ai/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    intent_context: 'emergency_mode',
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setReport(result.data);
                setNarration(result.narration);
            } else {
                throw new Error(result.message || result.error || 'Gagal memproses data darurat');
            }
        } catch (error: any) {
            console.error('Emergency trigger failed:', error);
            alert(error.message || 'Terjadi kesalahan saat mengaktifkan mode darurat.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setReport(null);
        setNarration(null);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) {
reset();
}

            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-2xl bg-card border-destructive/20 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-destructive flex items-center gap-2 uppercase tracking-tight">
                        <ThermometerSnowflake className="h-7 w-7 animate-pulse" />
                        Mode Darurat: Kegagalan Pendingin
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium">
                        AI akan menganalisis stok di freezer/chiller dan memberikan prioritas penyelamatan.
                    </DialogDescription>
                </DialogHeader>

                {!report && !loading && (
                    <div className="py-8 flex flex-col items-center text-center space-y-6">
                        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                            <AlertTriangle className="h-10 w-10" />
                        </div>
                        <div className="space-y-2 max-w-md">
                            <h3 className="font-bold text-lg">Freezer atau Chiller Mati?</h3>
                            <p className="text-sm text-muted-foreground italic">
                                Klik tombol di bawah. Sistem akan memindai semua bahan sensitif suhu dan menyusun "Rescue Plan" instan.
                            </p>
                        </div>
                        <Button 
                            variant="destructive" 
                            size="lg" 
                            className="rounded-full px-8 py-6 text-lg font-black uppercase tracking-widest glow-destructive"
                            onClick={triggerEmergency}
                        >
                            <Zap className="mr-2 h-5 w-5 fill-current" /> Aktifkan Analisis Darurat
                        </Button>
                    </div>
                )}

                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <p className="font-black animate-pulse uppercase tracking-widest text-xs">AI Sedang Menyusun Rescue Plan...</p>
                    </div>
                )}

                {report && (
                    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {narration && (
                            <Card className="bg-primary/5 border-primary/20 rounded-2xl overflow-hidden border-dashed">
                                <CardContent className="p-5 flex gap-4">
                                    <MessageSquareQuote className="h-6 w-6 text-primary shrink-0" />
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Saran AI (Rescue Plan)</p>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap italic">
                                            {narration}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {/* Critical */}
                            {report.critical?.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive" className="font-black">CRITICAL</Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gunakan dalam 2 jam</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {report.critical.map((item: any, i: number) => (
                                            <div key={i} className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 flex justify-between items-center">
                                                <span className="font-bold text-sm">{item.name}</span>
                                                <span className="text-xs font-black">{item.qty} {item.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Urgent */}
                            {report.urgent?.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="warning" className="font-black bg-amber-500 text-white">URGENT</Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gunakan dalam 4 jam</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {report.urgent.map((item: any, i: number) => (
                                            <div key={i} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex justify-between items-center">
                                                <span className="font-bold text-sm">{item.name}</span>
                                                <span className="text-xs font-black">{item.qty} {item.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sturdy */}
                            {report.sturdy?.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-black">STURDY</Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bisa tahan 6-8 jam</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {report.sturdy.map((item: any, i: number) => (
                                            <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border flex justify-between items-center opacity-60">
                                                <span className="font-bold text-sm">{item.name}</span>
                                                <span className="text-xs font-black">{item.qty} {item.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" className="rounded-full w-full" onClick={() => onOpenChange(false)}>
                        {report ? 'Tutup Laporan' : 'Batalkan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
