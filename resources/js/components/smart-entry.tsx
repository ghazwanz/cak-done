import { useForm, usePage } from '@inertiajs/react';
import { Sparkles, Mic, Image as ImageIcon, Send, Loader2, Check, X, Square, AlertTriangle, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import * as ai from '@/routes/ai';
import * as transactions from '@/routes/transactions';
import { AudioWaveform } from './audio-waveform';


interface ParsedData {
    item_name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    is_business: boolean;
    liquidity_warning?: string;
    inventory_info?: {
        current_qty: number;
        unit: string;
        threshold: number;
    } | null;
    contextual_advice?: string | null;
    price_alert?: string | null;
}

export function SmartEntry() {
    const { currentTeam } = usePage().props as any;
    const [open, setOpen] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [warningOpen, setWarningOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputText, setInputText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isRoutine, setIsRoutine] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            countdownIntervalRef.current = setTimeout(() => {
                setCountdown(prev => (prev !== null ? prev - 1 : null));
            }, 1000);
        } else if (countdown === 0) {
            handleSubmit();
            setCountdown(null);
        }

        return () => {
            if (countdownIntervalRef.current) {
clearTimeout(countdownIntervalRef.current);
}
        };
    }, [countdown]);


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

    const { data, setData, post, processing, reset, errors } = useForm({
        item_name: '',
        amount: 0,
        type: 'expense' as 'income' | 'expense',
        category: '',
        is_business: true,
        is_recurring: false,
        frequency: 'monthly',
        raw_input: '',
        inventory: {
            quantity: 0,
            unit: 'pcs',
            expiry_days: 7,
            expiry_date: '',
            cogs: 0,
        } as any,
    });

    const handleParse = async (file?: File, mode: 'audio' | 'image' | 'text' = 'text') => {
        if (mode === 'text' && !inputText.trim()) {
return;
}

        setParsing(true);
        const formData = new FormData();

        if (mode === 'text') {
formData.append('text', inputText);
}

        if (mode === 'audio' && file) {
formData.append('audio', file);
}

        if (mode === 'image' && file) {
formData.append('image', file);
}

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
                setParsedData({
                    ...result.data,
                    liquidity_warning: result.liquidity_warning,
                    inventory_info: result.inventory_info,
                    contextual_advice: result.contextual_advice,
                    price_alert: result.price_alert,
                });
                setIsRoutine(!!result.is_routine);

                if (result.is_routine) {
                    setCountdown(5);
                    toast.info('Transaksi rutin terdeteksi. Menyimpan otomatis dalam 5 detik...');
                }

                setData({
                    item_name: result.data.item_name || '',
                    amount: result.data.amount || 0,
                    type: result.data.type || 'expense',
                    category: result.data.category || '',
                    is_business: result.data.is_business ?? true,
                    is_recurring: result.data.is_recurring ?? false,
                    frequency: result.data.frequency || 'monthly',
                    raw_input: result.data.transcription || (mode === 'text' ? inputText : `Multimodal (${mode})`),
                    inventory: result.data.inventory ? {
                        quantity: result.data.inventory.quantity || 0,
                        unit: result.data.inventory.unit || 'pcs',
                        expiry_days: result.data.inventory.expiry_days || 7,
                        expiry_date: result.data.inventory.expiry_date || '',
                        cogs: result.data.inventory.cogs || (result.data.inventory.quantity > 0 ? Math.round(result.data.amount / result.data.inventory.quantity) : 0),
                    } : null,
                });

                if (result.inventory_info) {
                    toast.success(`Berhasil! Stok "${result.data.item_name}" saiki sisa ${result.inventory_info.current_qty} ${result.inventory_info.unit}.`, {
                        description: `Data ${mode} berhasil dianalisis.`,
                    });
                } else {
                    toast.success('Berhasil menganalisis ' + mode + '!');
                }
            } else {
                toast.error(result.message || 'Gagal menganalisis.');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghubungi server.');
        } finally {
            setParsing(false);
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) {
e.preventDefault();
}
        
        // Stop any active auto-confirm countdown
        if (countdownIntervalRef.current) {
clearTimeout(countdownIntervalRef.current);
}

        setCountdown(null);

        // Show warning if it exists and we haven't accepted it yet
        if (parsedData?.liquidity_warning && !warningOpen) {
            setWarningOpen(true);

            return; // Stop here, the user needs to confirm on the warning dialog
        }

        executeSubmit();
    };

    const executeSubmit = () => {
        post(transactions.store.url(currentTeam.slug), {
            onSuccess: () => {
                setOpen(false);
                setWarningOpen(false);
                reset();
                setInputText('');
                setParsedData(null);
                setIsRoutine(false);
                toast.success('Transaksi berhasil disimpan!');
            },
            onError: (errors) => {
                if (errors.item_name) {
                    toast.error(errors.item_name, {
                        duration: 5000,
                        className: 'bg-destructive text-destructive-foreground font-bold',
                    });
                } else {
                    toast.error('Gagal menyimpan transaksi. Cek kembali data yang diinput.');
                }
            },
        });
    };

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl glow-primary hover:scale-110 transition-all duration-300 bg-primary hover:bg-primary/90 border-none group"
                >
                    <Sparkles className="h-6 w-6 text-white group-hover:animate-pulse" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-card glass">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
                        <Sparkles className="h-6 w-6 text-primary" />
                        CATAT
                    </DialogTitle>
                </DialogHeader>

                {!parsedData ? (
                    <div className="space-y-4 py-2">
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
                                        <AudioWaveform isRecording={isRecording} />
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
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="p-3 bg-accent rounded-xl border border-border">
                            <Label className="text-[10px] uppercase font-bold text-primary">Hasil Transkripsi AI</Label>
                            <p className="text-sm italic text-foreground/80 ml-1">
                                "{data.raw_input}"
                            </p>
                        </div>

                        {(parsedData.contextual_advice || parsedData.price_alert) && (
                            <div className="space-y-3">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className={`w-full h-9 rounded-xl border-2 transition-all flex items-center justify-between px-4 ${
                                                parsedData.price_alert 
                                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 animate-pulse' 
                                                    : 'bg-indigo-500/5 border-indigo-500/10 text-indigo-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Sparkles className={`h-4 w-4 ${parsedData.price_alert ? 'animate-bounce' : ''}`} />
                                                <span className="text-xs font-bold uppercase tracking-tight">💡 Lihat Analisa Bisnis</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] rounded-3xl border-2 border-primary/20 shadow-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-primary">
                                                <Sparkles className="h-5 w-5" />
                                                Analisa Bisnis Pintar
                                            </DialogTitle>
                                            <DialogDescription>
                                                Wawasan otomatis dari Cak Done berdasarkan data historis Anda.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            {parsedData.contextual_advice && (
                                                <div className="p-4 bg-indigo-500/10 border-2 border-indigo-500/30 rounded-2xl">
                                                    <div className="flex items-start gap-4">
                                                        <div className="bg-indigo-500 p-2 rounded-lg shadow-md shrink-0">
                                                            <Sparkles className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="text-sm text-foreground leading-relaxed">
                                                            <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">Rekomendasi</div>
                                                            {parsedData.contextual_advice.split('\n').map((line, i) => (
                                                                <p key={i} className={line.startsWith('**') ? 'font-bold' : ''}>
                                                                    {line.replace(/\*\*/g, '')}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {parsedData.price_alert && (
                                                <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl shadow-lg">
                                                    <div className="flex items-start gap-4">
                                                        <div className="bg-amber-500 p-2 rounded-lg shadow-md shrink-0">
                                                            <AlertTriangle className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="text-sm text-foreground leading-relaxed">
                                                            <div className="font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">Peringatan Margin</div>
                                                            <p>{parsedData.price_alert.replace(/\*\*/g, '')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" onClick={(e) => {
                                                // Dialog will close by default since it's inside DialogContent
                                            }} className="w-full rounded-xl bg-primary">Saya Paham, Lanjutkan</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">Nama Barang</Label>
                                <Input
                                    value={data.item_name}
                                    onChange={(e) => setData('item_name', e.target.value)}
                                    className={`bg-background ${errors.item_name ? 'border-destructive' : ''}`}
                                />
                                {errors.item_name && (
                                    <p className="text-[10px] text-destructive font-bold uppercase animate-bounce">{errors.item_name}</p>
                                )}
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
                                            <option value="pcs">pcs</option>
                                            <option value="kg">kg</option>
                                            <option value="gram">gram</option>
                                            <option value="liter">liter</option>
                                            <option value="ml">ml</option>
                                            <option value="pack">pack</option>
                                            <option value="box">box</option>
                                            <option value="ikat">ikat</option>
                                            <option value="lusin">lusin</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 opacity-70">
                                        <Label className="text-[10px] text-amber-800 dark:text-amber-500 font-bold">HARGA PER UNIT (AUTO)</Label>
                                        <div className="h-8 flex items-center px-3 text-sm font-mono bg-muted rounded-md border border-amber-200 dark:border-amber-800">
                                            Rp {data.inventory.cogs.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-amber-800 dark:text-amber-500 font-bold uppercase tracking-tight">KEDALUWARSA (EXP)</Label>
                                        <Input
                                            type="date"
                                            value={data.inventory.expiry_date || ''}
                                            onChange={(e) => setData('inventory', { ...data.inventory, expiry_date: e.target.value })}
                                            className="h-8 text-[11px] bg-background/50 border-amber-200 dark:border-amber-800 font-medium"
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
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="mt-1 w-full bg-transparent border-none p-0 font-semibold text-foreground focus:ring-0 cursor-pointer"
                                >
                                    {data.type === 'income' ? (
                                        <option value="penjualan">Penjualan</option>
                                    ) : (
                                        <>
                                            <option value="Bahan Baku">Bahan Baku</option>
                                            <option value="Operasional">Operasional</option>
                                            <option value="Kemasan">Kemasan</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 flex flex-col sm:flex-row items-center w-full">
                            {countdown !== null && (
                                <div className="flex-1 flex items-center gap-2 mb-2 sm:mb-0 w-full sm:w-auto">
                                    <div className="relative h-10 w-10 flex items-center justify-center">
                                        <svg className="h-full w-full rotate-[-90deg]">
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="16"
                                                fill="transparent"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                className="text-primary/20"
                                            />
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="16"
                                                fill="transparent"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                strokeDasharray="100"
                                                strokeDashoffset={100 - (countdown / 5) * 100}
                                                className="text-primary transition-all duration-1000"
                                            />
                                        </svg>
                                        <span className="absolute text-xs font-bold">{countdown}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-primary leading-tight">Auto-Confirm Aktif</span>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-2 text-[9px] font-black uppercase text-destructive hover:bg-destructive/10"
                                            onClick={() => setCountdown(null)}
                                        >
                                            Batalkan
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setParsedData(null);
                                        setCountdown(null);
                                    }}
                                    disabled={processing}
                                    className="rounded-xl"
                                >
                                    Ulangi Scan
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Simpan Transaksi
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>

        <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
            <AlertDialogContent className="border-none shadow-2xl glass bg-card max-w-[400px]">
                <AlertDialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <X className="h-6 w-6 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-xl font-bold text-center">Peringatan Likuiditas</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-center">
                        {parsedData?.liquidity_warning}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                    <AlertDialogCancel asChild>
                        <Button variant="outline" className="flex-1 rounded-xl">Batal</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button 
                            className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground glow-destructive"
                            onClick={executeSubmit}
                        >
                            Tetap Simpan
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    );
}