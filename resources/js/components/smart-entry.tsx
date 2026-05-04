import { useState, useRef, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Mic, Image as ImageIcon, Send, Loader2, Check, X, Square } from 'lucide-react';
import { toast } from 'sonner';

import * as ai from '@/routes/ai';
import * as transactions from '@/routes/transactions';

interface ParsedData {
    item_name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    is_business: boolean;
}

export function SmartEntry() {
    const { currentTeam } = usePage().props as any;
    const [open, setOpen] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputText, setInputText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
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
                handleParse(audioFile, 'audio');
                
                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.info('Mendengarkan...');
        } catch (err) {
            toast.error('Tidak bisa mengakses mikrofon.');
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'audio' | 'image') => {
        const file = e.target.files?.[0];
        if (file) {
            handleParse(file, mode);
        }
    };

    const { data, setData, post, processing, reset } = useForm({
        item_name: '',
        amount: 0,
        type: 'expense' as 'income' | 'expense',
        category: '',
        is_business: true,
        raw_input: '',
        inventory: {
            quantity: 0,
            unit: '',
            expiry_days: 0,
            cogs: 0,
        } as any,
    });

    const handleParse = async (file?: File, mode: 'audio' | 'image' | 'text' = 'text') => {
        if (mode === 'text' && !inputText.trim()) return;

        setParsing(true);
        const formData = new FormData();
        if (mode === 'text') formData.append('text', inputText);
        if (mode === 'audio' && file) formData.append('audio', file);
        if (mode === 'image' && file) formData.append('image', file);
        formData.append('intent_context', 'smart_entry');

        try {
            const response = await fetch(ai.process.url(currentTeam.slug), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success && result.data) {
                setParsedData(result.data);
                setData({
                    item_name: result.data.item_name || '',
                    amount: result.data.amount || 0,
                    type: result.data.type || 'expense',
                    category: result.data.category || '',
                    is_business: result.data.is_business ?? true,
                    raw_input: result.data.transcription || (mode === 'text' ? inputText : `Multimodal (${mode})`),
                    inventory: result.data.inventory || null,
                });
                toast.success('Berhasil menganalisis ' + mode + '!');
            } else {
                toast.error(result.message || 'Gagal menganalisis.');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghubungi server.');
        } finally {
            setParsing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(transactions.store.url(currentTeam.slug), {
            onSuccess: () => {
                setOpen(false);
                reset();
                setInputText('');
                setParsedData(null);
                toast.success('Transaksi berhasil disimpan!');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl glow-primary hover:scale-110 transition-all duration-300 bg-primary hover:bg-primary/90 border-none group"
                >
                    <Sparkles className="h-6 w-6 text-white group-hover:animate-pulse" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-card glass">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Log Cepat (Write-Only)
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground italic">
                        Input operasional instan. Untuk analisis data, silakan gunakan menu Dashboard.
                    </DialogDescription>
                </DialogHeader>

                {!parsedData ? (
                    <div className="space-y-4 py-4">
                        {isRecording && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-xl animate-in fade-in duration-300">
                                <div className="text-center space-y-8 p-8 w-full max-w-md">
                                    <div className="relative mx-auto w-32 h-32">
                                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
                                        <div className="relative bg-red-500 rounded-full w-32 h-32 flex items-center justify-center shadow-2xl shadow-red-500/50">
                                            <Mic className="h-12 w-12 text-white animate-pulse" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-bold text-white tracking-tight">Mendengarkan...</h2>
                                        <p className="text-red-400 font-mono text-2xl">{formatTime(recordingTime)}</p>
                                        <p className="text-muted-foreground italic">"Jual bakso 5 porsi..."</p>
                                    </div>

                                    <Button
                                        size="lg"
                                        onClick={stopRecording}
                                        className="w-full h-24 rounded-2xl bg-card hover:bg-accent text-foreground text-2xl font-black shadow-2xl transition-transform active:scale-95 group"
                                    >
                                        <Square className="mr-4 h-8 w-8 fill-foreground group-hover:scale-110 transition-transform" />
                                        SELESAI / STOP
                                    </Button>
                                    
                                    <p className="text-muted-foreground text-sm">Ketuk tombol besar untuk memproses suara Anda</p>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <Input
                                placeholder="Contoh: 'Beli bensin 50rb' atau 'Jual kopi 15rb'..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="pr-10 h-12 text-lg rounded-xl"
                                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className={`h-8 w-8 transition-colors ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={parsing}
                                    type="button"
                                >
                                    <Mic className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`flex-1 h-12 rounded-xl border-2 transition-all ${
                                    isRecording 
                                        ? 'bg-destructive/10 border-destructive/30 text-destructive animate-pulse' 
                                        : 'hover:border-primary/50 hover:bg-accent text-foreground'
                                }`}
                            >
                                <Mic className={`mr-2 h-4 w-4 ${isRecording ? 'fill-red-600' : ''}`} />
                                {isRecording ? 'Berhenti Rekam' : 'Input Suara'}
                            </Button>

                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, 'image')}
                                />
                                <div className="flex items-center justify-center w-full h-12 rounded-xl border-dashed border-2 border-border text-foreground hover:border-primary/50 hover:bg-accent transition-colors">
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Foto Struk
                                </div>
                            </label>
                        </div>

                        <Button
                            onClick={() => handleParse()}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all glow-primary"
                            disabled={parsing || !inputText.trim()}
                        >
                            {parsing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menganalisis...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Analisis Teks
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="p-3 bg-accent rounded-xl border border-border">
                            <Label className="text-[10px] uppercase font-bold text-primary">Hasil Transkripsi AI</Label>
                            <p className="text-sm italic text-foreground/80 ml-1">
                                "{data.raw_input}"
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">Nama Barang</Label>
                                <Input
                                    value={data.item_name}
                                    onChange={(e) => setData('item_name', e.target.value)}
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">Total Harga (Rp)</Label>
                                <Input
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => {
                                        const total = parseInt(e.target.value) || 0;
                                        setData(prev => ({
                                            ...prev,
                                            amount: total,
                                            inventory: prev.inventory ? {
                                                ...prev.inventory,
                                                cogs: prev.inventory.quantity > 0 ? Math.round(total / prev.inventory.quantity) : 0
                                            } : null
                                        }));
                                    }}
                                    className="bg-background"
                                />
                            </div>
                        </div>

                        {data.inventory && (
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 space-y-4">
                                <Label className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="h-3 w-3" />
                                    Detil Inventori
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-amber-800 dark:text-amber-500 font-bold">QTY / JUMLAH BARANG</Label>
                                        <Input
                                            type="number"
                                            value={data.inventory.quantity}
                                            onChange={(e) => {
                                                const qty = parseInt(e.target.value) || 0;
                                                setData('inventory', { 
                                                    ...data.inventory, 
                                                    quantity: qty,
                                                    cogs: qty > 0 ? Math.round(data.amount / qty) : 0
                                                });
                                            }}
                                            className="h-8 text-sm bg-background/50 border-amber-200 dark:border-amber-800"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-amber-800 dark:text-amber-500 font-bold">SATUAN</Label>
                                        <select
                                            value={data.inventory.unit}
                                            onChange={(e) => setData('inventory', { ...data.inventory, unit: e.target.value })}
                                            className="flex h-8 w-full rounded-md border border-amber-200 dark:border-amber-800 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="pcs">pcs (biji)</option>
                                            <option value="kg">kg (kilogram)</option>
                                            <option value="gr">gr (gram)</option>
                                            <option value="liter">liter</option>
                                            <option value="box">box (kotak)</option>
                                            <option value="porsi">porsi</option>
                                            <option value="bungkus">bungkus</option>
                                            <option value="ekor">ekor</option>
                                            <option value="ikat">ikat</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 opacity-70">
                                        <Label className="text-[10px] text-amber-800 dark:text-amber-500 font-bold">HARGA PER UNIT (AUTO)</Label>
                                        <div className="h-8 flex items-center px-3 text-sm font-mono bg-muted rounded-md border border-amber-200 dark:border-amber-800">
                                            Rp {data.inventory.cogs.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-amber-800 dark:text-amber-500 font-bold">EXPIRED (HARI)</Label>
                                        <Input
                                            type="number"
                                            value={data.inventory.expiry_days}
                                            onChange={(e) => setData('inventory', { ...data.inventory, expiry_days: parseInt(e.target.value) })}
                                            className="h-8 text-sm bg-background/50 border-amber-200 dark:border-amber-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 p-4 rounded-xl bg-muted border border-border">
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Tipe</Label>
                                <div className="mt-1 font-semibold text-foreground">{data.type === 'income' ? 'Pemasukan 💰' : 'Pengeluaran 💸'}</div>
                            </div>
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Kategori</Label>
                                <div className="mt-1 font-semibold text-foreground capitalize">{data.category.replace('_', ' ')}</div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setParsedData(null)}
                                className="flex-1 rounded-xl"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Ulangi
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold glow-primary transition-all"
                            >
                                {processing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Simpan Transaksi
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}