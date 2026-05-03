import { useState } from 'react';
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
import { Sparkles, Mic, Image as ImageIcon, Send, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { parse, store } from '@/routes/transactions';

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
    const [inputText, setInputText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);

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

    const handleParse = async () => {
        if (!inputText.trim()) return;

        setParsing(true);
        try {
            const response = await fetch(parse.url(currentTeam), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ text: inputText }),
            });

            const result = await response.json();

            if (result.success) {
                setParsedData(result.data);
                setData({
                    item_name: result.data.item_name,
                    amount: result.data.amount,
                    type: result.data.type,
                    category: result.data.category,
                    is_business: result.data.is_business,
                    raw_input: inputText,
                    inventory: result.data.inventory || null,
                });
                toast.success('Berhasil menganalisis transaksi!');
            } else {
                toast.error(result.message || 'Gagal menganalisis transaksi.');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghubungi server.');
        } finally {
            setParsing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url(currentTeam), {
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
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none group"
                >
                    <Sparkles className="h-6 w-6 text-white group-hover:animate-pulse" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        <Sparkles className="h-6 w-6 text-indigo-600" />
                        Catat Pintar
                    </DialogTitle>
                    <DialogDescription>
                        Ketik, ucapkan, atau foto struk belanja Anda. AI akan mencatatnya secara otomatis.
                    </DialogDescription>
                </DialogHeader>

                {!parsedData ? (
                    <div className="space-y-4 py-4">
                        <div className="relative">
                            <Input
                                placeholder="Contoh: 'Beli bensin 50rb' atau 'Jual kopi 15rb'..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="pr-10 h-12 text-lg border-gray-200 dark:text-gray-700 focus:ring-indigo-500 rounded-xl"
                                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-indigo-600">
                                    <Mic className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-dashed border-2 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                            >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Foto Struk
                            </Button>
                        </div>

                        <Button
                            onClick={handleParse}
                            disabled={parsing || !inputText.trim()}
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200"
                        >
                            {parsing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menganalisis...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Proses dengan AI
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4 animate-in fade-in zoom-in duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="item_name" className="text-sm font-medium text-gray-700">Nama Barang/Kegiatan</Label>
                                <Input
                                    id="item_name"
                                    value={data.item_name}
                                    onChange={(e) => setData('item_name', e.target.value)}
                                    className="h-11 rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Jumlah (Rp)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', parseInt(e.target.value) || 0)}
                                    className="h-11 rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Kategori</Label>
                                <Input
                                    id="category"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="h-11 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 capitalize">
                                    {data.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                                </span>
                                <span className="text-xs text-gray-500">Tipe Transaksi</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={data.is_business ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setData('is_business', true)}
                                    className="rounded-full"
                                >
                                    Bisnis
                                </Button>
                                <Button
                                    type="button"
                                    variant={!data.is_business ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setData('is_business', false)}
                                    className="rounded-full"
                                >
                                    Pribadi
                                </Button>
                            </div>
                        </div>

                        {data.type === 'expense' && (
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Detail Inventaris (Otomatis)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-indigo-500">Kuantitas</Label>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                type="number" 
                                                value={data.inventory?.quantity || 0} 
                                                onChange={(e) => setData('inventory', { ...data.inventory, quantity: parseInt(e.target.value) || 0 })}
                                                className="h-8 text-xs"
                                            />
                                            <span className="text-xs text-indigo-700 font-medium">{data.inventory?.unit || 'pcs'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-indigo-500">Estimasi Kadaluarsa (Hari)</Label>
                                        <Input 
                                            type="number" 
                                            value={data.inventory?.expiry_days || 0} 
                                            onChange={(e) => setData('inventory', { ...data.inventory, expiry_days: parseInt(e.target.value) || 0 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setParsedData(null)}
                                className="rounded-xl"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 shadow-lg shadow-green-100"
                            >
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Simpan Transaksi
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
