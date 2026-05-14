import { Head, usePage, useForm, router } from '@inertiajs/react';
import { Sparkles, Mic, Image as ImageIcon, Send, Loader2, Bot, User, Check, X, Square, AlertCircle, TrendingUp, Package } from 'lucide-react';
import { History, AlertTriangle, ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { AudioWaveform } from '@/components/audio-waveform';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import * as ai from '@/routes/ai';
import chatRoutes from '@/routes/ai/chat';
import * as catat from '@/routes/catat';
import * as transactions from '@/routes/transactions';
import type { BreadcrumbItem } from '@/types';

interface Message {
    id: string;
    type: 'user' | 'bot';
    content: string;
    intent?: 'RECORD' | 'QUERY';
    data?: any;
    timestamp: Date;
}

interface Props {
    recentTransactions: any[];
    lowStockItems: any[];
    initialChatHistory?: any[];
}

export default function Catat({ recentTransactions = [], lowStockItems = [], initialChatHistory = [] }: Props) {
    const { currentTeam } = usePage().props as any;
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    
    const defaultGreeting: Message = {
        id: '1',
        type: 'bot',
        content: 'Halo! Saya asisten AI Bisnis Anda. Ada yang bisa saya bantu catat atau analisis hari ini?',
        timestamp: new Date(),
    };

    const parsedHistory = initialChatHistory.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
    }));

    const [messages, setMessages] = useState<Message[]>(
        parsedHistory.length > 0 ? parsedHistory : [defaultGreeting]
    );
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [processing, setProcessing] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Save to backend whenever messages change
    useEffect(() => {
        if (!mounted || messages.length <= 1) {
return;
} // Don't save just the greeting

        const timer = setTimeout(() => {
            fetch(chatRoutes.save.url(currentTeam.slug), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ messages })
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [messages, mounted, currentTeam.slug]);

    const clearChat = () => {
        if (!confirm('Apakah Anda yakin ingin mereset seluruh riwayat percakapan?')) {
return;
}
        
        router.post(chatRoutes.clear.url(currentTeam.slug), {}, {
            onSuccess: () => {
                setMessages([defaultGreeting]);
                toast.success('Percakapan berhasil direset.');
            }
        });
    };

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
clearInterval(timerRef.current);
}

            setRecordingTime(0);
        }

        return () => {
            if (timerRef.current) {
clearInterval(timerRef.current);
}
        };
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
                handleProcess(audioFile, 'audio');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            toast.error('Tidak bisa mengakses mikrofon.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleProcess = async (file?: File, mode: 'audio' | 'image' | 'text' = 'text') => {
        const text = mode === 'text' ? inputText : '';

        if (mode === 'text' && !text.trim()) {
return;
}

        // Add user message to stream
        const userMsg: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: text || `Mengirim ${mode}...`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);

        if (mode === 'text') {
setInputText('');
}

        setProcessing(true);
        const formData = new FormData();

        if (mode === 'text') {
formData.append('text', text);
}

        if (mode === 'audio' && file) {
formData.append('audio', file);
}

        if (mode === 'image' && file) {
formData.append('image', file);
}

        formData.append('intent_context', 'catat');

        try {
            const response = await fetch(ai.process.url(currentTeam.slug), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: result.narration || result.message || 'Data berhasil diproses.',
                    intent: result.intent,
                    data: {
                        ...result.data,
                        liquidity_warning: result.liquidity_warning,
                        inventory_info: result.inventory_info,
                        show_summary: result.show_summary,
                    },
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                toast.error(result.message || 'Gagal memproses.');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan koneksi.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="AI Insights" />

            <div className="flex flex-col lg:flex-row gap-8 p-4 h-full">
                {/* Main Content: Chat Interface */}
                <div className="flex-1 flex flex-col min-h-[calc(100vh-12rem)] min-w-0">
                    {/* Header */}
                    <div className="flex flex-col gap-1 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Insights</h1>
                                <p className="text-muted-foreground italic text-sm">Input operasional instan dan analisis strategis via dual-intent engine.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive shrink-0">
                                <History className="mr-2 h-4 w-4" /> Reset Chat
                            </Button>
                        </div>
                    </div>

                    <Card className="flex-1 flex flex-col shadow-sm rounded-2xl border-border bg-card/50 overflow-hidden relative">
                        {/* Chat Stream */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-muted"
                        >
                            {messages.map((msg) => (
                                <div 
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                        msg.type === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                        msg.type === 'bot' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {msg.type === 'bot' ? <Bot size={18} /> : <User size={18} />}
                                    </div>

                                    <div className={cn(
                                        "max-w-[85%] space-y-2",
                                        msg.type === 'user' ? "items-end text-right" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                                            msg.type === 'bot' 
                                                ? "bg-card border border-border text-foreground glass" 
                                                : "bg-primary text-primary-foreground glow-primary"
                                        )}>
                                            {msg.content}
                                        </div>

                                        {msg.type === 'bot' && msg.intent === 'RECORD' && (
                                            <ConfirmationCard teamSlug={currentTeam.slug} data={msg.data} />
                                        )}

                                        {msg.type === 'bot' && msg.intent === 'QUERY' && msg.data && msg.data.show_summary && (
                                            <InsightSummaryCard data={msg.data} />
                                        )}

                                        <span className="text-[10px] text-muted-foreground px-1">
                                            {mounted && msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            
                            {processing && (
                                <div className="flex gap-3 animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Loader2 size={18} className="animate-spin text-primary" />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-sm italic text-muted-foreground">
                                        Berpikir...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border">
                            <div className="flex items-center gap-2 max-w-3xl mx-auto w-full">
                                <div className="flex gap-1">
                                    <label className="cursor-pointer">
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];

                                                if (file) {
handleProcess(file, 'image');
}
                                            }}
                                        />
                                        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                                            <ImageIcon size={20} />
                                        </Button>
                                    </label>
                                    
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={cn(
                                            "rounded-full transition-all duration-300",
                                            isRecording ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground hover:text-primary"
                                        )}
                                    >
                                        <Mic size={20} />
                                    </Button>
                                </div>

                                <div className="flex-1 relative">
                                    <Input 
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                                        placeholder={isRecording ? "Mendengarkan..." : "Tulis laporan atau tanya sesuatu..."}
                                        className="h-12 rounded-full px-6 bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0"
                                        disabled={isRecording || processing}
                                    />
                                    <Button 
                                        onClick={() => handleProcess()}
                                        disabled={!inputText.trim() || processing}
                                        size="icon" 
                                        className="absolute right-1 top-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                                    >
                                        {processing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </Button>
                                </div>
                            </div>
                            
                            {isRecording && (
                                <div className="mt-2 flex items-center justify-center gap-4 animate-in fade-in zoom-in duration-300">
                                    <AudioWaveform isRecording={isRecording} className="h-6 w-32" />
                                    <span className="text-destructive font-mono text-sm font-bold">{formatTime(recordingTime)}</span>
                                    <Button size="sm" variant="destructive" onClick={stopRecording} className="rounded-full h-8 px-4 font-bold text-[10px] uppercase tracking-tighter">
                                        <Square className="mr-1.5 h-3 w-3 fill-current" /> Selesai
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sticky Sidebar: Recent Activity & Stock */}
                <aside className="hidden xl:block w-80 shrink-0">
                    <div className="sticky top-24 space-y-6">
                        {/* Recent Transactions Card */}
                        <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
                            <CardHeader className="p-4 border-b border-border bg-muted/30">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <History size={16} className="text-primary" />
                                    Transaksi Terakhir
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentTransactions.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {recentTransactions.map((tx: any) => (
                                            <div key={tx.id} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate">{tx.item_name}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {mounted && new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <p className={cn(
                                                    "text-xs font-black shrink-0",
                                                    tx.type === 'income' ? "text-emerald-500" : "text-destructive"
                                                )}>
                                                    {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-muted-foreground italic">
                                        Belum ada transaksi hari ini.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stock Alerts Card */}
                        <Card className="rounded-2xl shadow-sm border-border bg-card overflow-hidden">
                            <CardHeader className="p-4 border-b border-border bg-muted/30">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-amber-500" />
                                    Peringatan Stok
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {lowStockItems.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {lowStockItems.map((item: any) => (
                                            <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                                                    <span className="text-[10px] font-black text-destructive uppercase tracking-tighter bg-destructive/10 px-1.5 py-0.5 rounded">KRITIS</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span>Sisa: <strong className="text-foreground">{item.batches_sum_qty} {item.unit}</strong></span>
                                                    <span>Batas: {item.low_stock_threshold}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-muted-foreground italic">
                                        Stok aman terkendali.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Tips */}
                        <div className="p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Sparkles size={10} /> Tips AI
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Anda bisa bertanya "Berapa profit saya bulan ini?" atau "Barang apa yang paling laku?"
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}

Catat.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard.url(props.currentTeam.slug) : '/',
        },
        {
            title: 'Catat',
            href: props.currentTeam ? catat.index.url(props.currentTeam.slug) : '#',
        },
    ] satisfies BreadcrumbItem[],
});

function ConfirmationCard({ teamSlug, data }: { teamSlug: string, data: any }) {
    const { data: formData, setData, post, processing, reset } = useForm({
        item_name: data.item_name || '',
        amount: data.amount || 0,
        type: data.type || 'expense',
        category: data.category || '',
        is_business: data.is_business ?? true,
        raw_input: data.transcription || 'Input AI',
        inventory: data.inventory ? {
            quantity: data.inventory.quantity || 0,
            unit: data.inventory.unit || 'pcs',
            expiry_days: data.inventory.expiry_days || 0,
            cogs: data.inventory.cogs || 0,
        } : null,
    });

    const [saved, setSaved] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(transactions.store.url(teamSlug), {
            onSuccess: () => {
                setSaved(true);
                toast.success('Berhasil dicatat!');
            },
        });
    };

    if (saved) {
        return (
            <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-500 text-xs font-bold animate-in zoom-in duration-300">
                <Check size={16} /> Data Tersimpan ke Jurnal
            </div>
        );
    }

    return (
        <Card className="mt-2 border-border/50 shadow-sm rounded-2xl overflow-hidden bg-background/50">
            <form onSubmit={submit}>
                <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Barang</Label>
                            <Input 
                                className="h-8 text-xs rounded-lg" 
                                value={formData.item_name} 
                                onChange={e => setData('item_name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Jumlah (Rp)</Label>
                            <Input 
                                type="number"
                                className="h-8 text-xs rounded-lg" 
                                value={formData.amount} 
                                onChange={e => setData('amount', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                    
                    {formData.inventory && (
                        <div className="p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg space-y-2">
                            <div className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                                <Package size={10} /> Inventori
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5">
                                    <Input 
                                        type="number"
                                        className="h-7 text-[10px] bg-background" 
                                        value={formData.inventory.quantity}
                                        onChange={e => setData('inventory', { ...formData.inventory, quantity: parseInt(e.target.value) })}
                                    />
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formData.inventory.unit}</span>
                                </div>
                                <div className="flex items-center justify-end text-[10px] font-mono text-amber-600/80">
                                    Modal: Rp {formData.inventory.cogs.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {data.liquidity_warning && (
                        <div className="flex gap-2 p-2 bg-destructive/5 border border-destructive/10 rounded-lg text-[10px] text-destructive leading-tight">
                            <AlertCircle size={14} className="shrink-0" />
                            {data.liquidity_warning}
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button type="submit" disabled={processing} className="flex-1 h-8 text-[10px] font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                            {processing ? <Loader2 className="animate-spin h-3 w-3" /> : 'KONFIRMASI CATATAN'}
                        </Button>
                        <Button type="button" variant="outline" className="h-8 w-8 p-0 rounded-lg text-muted-foreground">
                            <X size={14} />
                        </Button>
                    </div>
                </CardContent>
            </form>
        </Card>
    );
}

function InsightSummaryCard({ data }: { data: any }) {
    return (
        <Card className="mt-2 border-primary/20 shadow-sm rounded-2xl overflow-hidden bg-primary/5 glow-primary/5 border-dashed">
            <CardHeader className="p-4 border-b border-primary/10">
                <CardTitle className="text-xs font-bold text-primary flex items-center gap-2">
                    <TrendingUp size={14} /> Ringkasan Keuangan (SQL-First)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase">Total Pemasukan</p>
                        <p className="text-sm font-black text-emerald-500">Rp {(data.totals?.income || 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase">Total Pengeluaran</p>
                        <p className="text-sm font-black text-destructive">Rp {(data.totals?.expense || 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Net Profit / Margin</p>
                        <p className={cn(
                            "text-lg font-black tracking-tighter",
                            ((data.totals?.income || 0) - (data.totals?.expense || 0)) >= 0 ? "text-emerald-500" : "text-destructive"
                        )}>
                            Rp {((data.totals?.income || 0) - (data.totals?.expense || 0)).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t border-primary/10 text-[10px] italic text-muted-foreground">
                    * Data dihitung secara real-time dari database SQL untuk akurasi 100%.
                </div>
            </CardContent>
        </Card>
    );
}
