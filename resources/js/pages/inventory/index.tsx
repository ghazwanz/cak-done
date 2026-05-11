import { Head, usePage, router, useForm } from '@inertiajs/react';
import { formatDistanceToNow, isBefore, addDays, parseISO } from 'date-fns';
import { MoreHorizontal, Package, Trash2, Edit, AlertTriangle, ArrowUpCircle, Plus, Settings2, Tag, Layers, Coins, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import inventory from '@/routes/inventory';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface InventoryItem {
    id: number;
    name: string;
    category: string;
    unit: string;
    selling_price: string | number | null;
    low_stock_threshold: number;
    batches: Batch[];
    created_at: string;
}

interface Batch {
    id: number;
    inventory_item_id: number;
    item_name: string;
    qty: number;
    unit: string;
    cogs: string;
    expiry_date: string;
    inventory_item?: InventoryItem;
}

interface LowStockItem extends InventoryItem {
    batches: Batch[];
}

interface Props {
    batches: Batch[];
    lowStockItems: LowStockItem[];
    inventoryItems: InventoryItem[];
}

const CATEGORIES = ['Bahan Baku', 'Operasional', 'Produk Jadi', 'Kemasan', 'Lainnya'];
const UNITS = ['pcs', 'kg', 'gram', 'liter', 'ml', 'pack', 'box', 'ikat', 'lusin'];

export default function InventoryIndex({ batches, lowStockItems, inventoryItems }: Props) {
    const { currentTeam } = usePage().props as any;
    const isAuthorized = currentTeam?.role === 'owner' || currentTeam?.role === 'admin';

    // Batch Management State
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [editQty, setEditQty] = useState<string>('');
    const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState<number | null>(null);

    // Item Management State
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isItemDeleteDialogOpen, setIsItemDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const itemForm = useForm({
        name: '',
        category: '',
        unit: '',
        selling_price: 0,
        low_stock_threshold: 10,
        initial_qty: 0,
        initial_cogs: 0,
        initial_expiry: new Date(addDays(new Date(), 180)).toISOString().split('T')[0],
    });

    const expiredCount = batches.filter((b) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return isBefore(parseISO(b.expiry_date), today);
    }).length;

    const warningCount = batches.filter((b) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = parseISO(b.expiry_date);
        return !isBefore(expiry, today) && isBefore(expiry, addDays(today, 7));
    }).length;

    // Batch Handlers
    const handleUpdateBatchQty = () => {
        if (!editingBatch) return;
        router.patch(inventory.update.url([currentTeam.slug, editingBatch.id]), {
            qty: parseInt(editQty),
        }, {
            onSuccess: () => {
                setEditingBatch(null);
                toast.success('Stok batch diperbarui.');
            },
            onError: (errors) => {
                console.error('Update batch error:', errors);
                toast.error('Gagal memperbarui stok.');
            }
        });
    };

    const handleDeleteBatch = () => {
        if (batchToDelete === null) return;
        router.delete(inventory.destroy.url([currentTeam.slug, batchToDelete]), {
            onSuccess: () => {
                setIsBatchDeleteDialogOpen(false);
                setBatchToDelete(null);
                toast.success('Batch dihapus.');
            },
            onError: (errors) => {
                console.error('Delete batch error:', errors);
                toast.error('Gagal menghapus batch.');
            }
        });
    };

    // Item Handlers
    const openAddItem = () => {
        setEditingItem(null);
        itemForm.reset();
        itemForm.clearErrors();
        setIsItemDialogOpen(true);
    };

    const openEditItem = (item: InventoryItem) => {
        setEditingItem(item);
        itemForm.clearErrors();
        itemForm.setData({
            name: item.name,
            category: item.category || '',
            unit: item.unit,
            selling_price: item.selling_price || 0,
            low_stock_threshold: item.low_stock_threshold,
            initial_qty: 0,
            initial_cogs: 0,
            initial_expiry: '',
        });
        setIsItemDialogOpen(true);
    };

    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();
        
        const options = {
            onSuccess: () => {
                setIsItemDialogOpen(false);
                itemForm.reset();
                toast.success(editingItem ? 'Data barang diperbarui.' : 'Barang baru ditambahkan.');
            },
            onError: (errors: any) => {
                console.error('Save error:', errors);
                toast.error('Gagal menyimpan data. Cek input Anda.');
            }
        };

        if (editingItem) {
            itemForm.patch(inventory.items.update.url([currentTeam.slug, editingItem.id]), options);
        } else {
            itemForm.post(inventory.items.store.url(currentTeam.slug), options);
        }
    };

    const handleDeleteItem = () => {
        if (itemToDelete === null) return;
        router.delete(inventory.items.destroy.url([currentTeam.slug, itemToDelete]), {
            onSuccess: () => {
                setIsItemDeleteDialogOpen(false);
                setItemToDelete(null);
                toast.success('Barang dan stok terkait dihapus.');
            },
            onError: (errors) => {
                console.error('Delete item error:', errors);
                toast.error('Gagal menghapus barang.');
            }
        });
    };

    const getStatusVariant = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = parseISO(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (isBefore(expiry, today)) return 'destructive';
        if (isBefore(expiry, addDays(today, 3))) return 'destructive';
        if (isBefore(expiry, addDays(today, 7))) return 'warning';
        return 'secondary';
    };

    const getStatusLabel = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = parseISO(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (isBefore(expiry, today)) return 'Expired';
        return `${formatDistanceToNow(expiry, { addSuffix: false })} left`;
    };

    return (
        <>
            <Head title="Inventory — Cak DONE" />

            <div className="flex flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
                        <p className="text-muted-foreground italic">Pantau stok barang dan tanggal kadaluarsa secara otomatis.</p>
                    </div>
                    {isAuthorized && (
                        <Button onClick={openAddItem} className="rounded-full shadow-lg glow-primary">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Barang Baru
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="bg-card/50 border-border glass shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Batch</p>
                                    <p className="text-2xl font-black text-foreground">{batches.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border glass shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Expired</p>
                                    <p className="text-2xl font-black text-destructive">{expiredCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border glass shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Nearing Expiry</p>
                                    <p className="text-2xl font-black text-amber-500">{warningCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border glass shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                    <ArrowUpCircle className="h-5 w-5 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Low Stock</p>
                                    <p className="text-2xl font-black text-rose-500">{lowStockItems.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="items" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <TabsList className="bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="stock" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                                <Layers className="mr-2 h-4 w-4" /> Stock Watchdog
                            </TabsTrigger>
                            <TabsTrigger value="items" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                                <Tag className="mr-2 h-4 w-4" /> Daftar Barang
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="stock" className="space-y-6">
                        {/* Replenishment Suggestions */}
                        {lowStockItems.length > 0 && (
                            <Card className="border-rose-500/20 bg-rose-500/5 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                <CardHeader className="px-6 py-4 border-b border-rose-500/10">
                                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                        <ArrowUpCircle className="h-5 w-5" />
                                        <CardTitle className="text-lg font-black tracking-tight">Kebutuhan Stok Ulang</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-6 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {lowStockItems.map(item => {
                                            const currentStock = item.batches.reduce((sum, b) => sum + b.qty, 0);
                                            return (
                                                <div key={item.id} className="flex flex-col p-4 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="font-black text-foreground text-sm uppercase">{item.name}</span>
                                                        <Badge variant="destructive" className="text-[10px] px-2 h-5 font-black uppercase tracking-tighter ring-1 ring-destructive/20">KRITIS</Badge>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                                                        <span>Sisa Stok:</span>
                                                        <span className="font-black text-rose-500">{currentStock} {item.unit}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-muted-foreground mb-4">
                                                        <span>Ambang Batas:</span>
                                                        <span className="font-bold text-foreground">{item.low_stock_threshold} {item.unit}</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-rose-500 rounded-full glow-rose"
                                                            style={{ width: `${Math.min(100, (currentStock / item.low_stock_threshold) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Batch Table */}
                        <Card className="border-border bg-card/50 glass rounded-2xl overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-border px-6 py-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Pemantauan Batch & Kadaluarsa
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border bg-muted/30">
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Barang</TableHead>
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Jumlah</TableHead>
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Tgl Kadaluarsa</TableHead>
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
                                                {isAuthorized && (
                                                    <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center w-[80px]">Aksi</TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {batches.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={isAuthorized ? 6 : 5} className="text-center py-24 text-muted-foreground italic">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center text-3xl">
                                                                📦
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-foreground">Belum ada stok barang.</p>
                                                                <p className="text-xs">Gunakan Smart Entry untuk mencatat pembelian stok!</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                batches.map((batch) => (
                                                    <TableRow
                                                        key={batch.id}
                                                        className="group border-border hover:bg-accent/30 transition-colors"
                                                    >
                                                        <TableCell className="py-4 px-6 font-bold text-foreground">
                                                            {batch.inventory_item?.name || batch.item_name}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-muted-foreground">
                                                            <span className="font-black text-foreground">{batch.qty}</span> {batch.unit}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-center text-muted-foreground font-mono text-[11px]">
                                                            {new Date(batch.expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-center">
                                                            <Badge
                                                                variant={getStatusVariant(batch.expiry_date) as any}
                                                                className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-tighter"
                                                            >
                                                                {getStatusLabel(batch.expiry_date)}
                                                            </Badge>
                                                        </TableCell>
                                                        {isAuthorized && (
                                                            <TableCell className="py-4 px-6 text-center">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border">
                                                                        <DropdownMenuItem
                                                                            className="gap-2 cursor-pointer font-bold text-xs"
                                                                            onClick={() => {
                                                                                setEditingBatch(batch);
                                                                                setEditQty(batch.qty.toString());
                                                                            }}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                            Edit Jumlah Stok
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            className="gap-2 cursor-pointer text-destructive focus:text-destructive font-bold text-xs"
                                                                            onClick={() => {
                                                                                setBatchToDelete(batch.id);
                                                                                setIsBatchDeleteDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                            Hapus Batch
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="items" className="space-y-6">
                        <Card className="border-border bg-card/50 glass rounded-2xl overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-border px-6 py-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    Daftar Master Barang
                                </CardTitle>
                                <CardDescription>Kelola definisi barang, unit, dan ambang batas stok minimum.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border bg-muted/30">
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Nama Barang</TableHead>
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Kategori</TableHead>
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Min. Stok</TableHead>
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Stok Saat Ini</TableHead>
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right">Modal (Avg)</TableHead>
                                                <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right">Harga Jual</TableHead>
                                                {isAuthorized && (
                                                    <TableHead className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center w-[100px]">Aksi</TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {inventoryItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={isAuthorized ? 7 : 6} className="text-center py-24 text-muted-foreground italic">
                                                        Belum ada definisi barang. Tambahkan barang baru untuk mulai mengelola stok.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                inventoryItems.map((item) => (
                                                    <TableRow key={item.id} className="group border-border hover:bg-accent/30 transition-colors">
                                                        <TableCell className="py-4 px-6 font-black text-foreground uppercase">{item.name}</TableCell>
                                                        <TableCell className="py-4 px-6">
                                                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest py-0.5 px-2 bg-muted/50">
                                                                {item.category || 'N/A'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-center font-bold text-muted-foreground">{item.low_stock_threshold}</TableCell>
                                                        <TableCell className="py-4 px-6 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className={`font-black ${item.batches?.reduce((sum, b) => sum + b.qty, 0) <= item.low_stock_threshold ? 'text-rose-500' : 'text-foreground'}`}>
                                                                    {item.batches?.reduce((sum, b) => sum + b.qty, 0) || 0} {item.unit}
                                                                </span>
                                                                {item.batches?.reduce((sum, b) => sum + b.qty, 0) <= item.low_stock_threshold && (
                                                                    <Badge variant="destructive" className="mt-1 text-[8px] h-4 px-1 font-black leading-none uppercase">Kritis</Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-right font-bold text-muted-foreground">
                                                            Rp {item.batches && item.batches.length > 0 
                                                                ? Math.round(item.batches.reduce((sum, b) => sum + parseFloat(b.cogs), 0) / item.batches.length).toLocaleString('id-ID')
                                                                : '0'}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-right font-black text-primary">
                                                            Rp {parseFloat(item.selling_price as string || '0').toLocaleString('id-ID')}
                                                        </TableCell>
                                                        {isAuthorized && (
                                                            <TableCell className="py-4 px-6">
                                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditItem(item)}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                                                                        setItemToDelete(item.id);
                                                                        setIsItemDeleteDialogOpen(true);
                                                                    }}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* --- DIALOGS --- */}

                {/* Edit Batch Dialog */}
                <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
                    <DialogContent className="rounded-2xl border-border shadow-2xl sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="font-black text-xl flex items-center gap-2">
                                <Edit className="h-5 w-5 text-primary" /> Update Jumlah Stok
                            </DialogTitle>
                            <DialogDescription className="text-xs italic">
                                Masukkan jumlah stok fisik terbaru untuk {editingBatch?.inventory_item?.name || editingBatch?.item_name}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="qty" className="text-[10px] font-black uppercase text-muted-foreground">Kuantitas Baru ({editingBatch?.unit})</Label>
                                <Input
                                    id="qty"
                                    type="number"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className="h-12 rounded-xl bg-muted/50 border-border focus:ring-primary font-black text-lg"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" className="rounded-full flex-1" onClick={() => setEditingBatch(null)}>Batal</Button>
                            <Button className="rounded-full flex-1 glow-primary" onClick={handleUpdateBatchQty}>Simpan Perubahan</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add/Edit Item Dialog */}
                <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                    <DialogContent 
                        key={editingItem ? `edit-${editingItem.id}` : 'add-new'} 
                        className="rounded-2xl border-border shadow-2xl sm:max-w-xl max-h-[90vh] overflow-y-auto"
                    >
                        <DialogHeader>
                            <DialogTitle className="font-black text-xl flex items-center gap-2">
                                {editingItem ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                                {editingItem ? 'Edit Data Barang' : 'Tambah Barang Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-xs italic">
                                Masukkan detail barang untuk database master inventori Anda.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveItem} className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Nama Barang</Label>
                                        <Input 
                                            className="h-11 rounded-xl bg-muted/50 border-border focus:ring-primary font-bold" 
                                            value={itemForm.data.name}
                                            onChange={e => itemForm.setData('name', e.target.value)}
                                            required
                                            placeholder="Contoh: Beras Ramos, Minyak Goreng..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Kategori</Label>
                                        <Select 
                                            value={itemForm.data.category} 
                                            onValueChange={val => itemForm.setData('category', val)}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border font-bold">
                                                <SelectValue placeholder="Pilih Kategori" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border">
                                                {CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Unit / Satuan</Label>
                                        <Select 
                                            value={itemForm.data.unit} 
                                            onValueChange={val => itemForm.setData('unit', val)}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border font-bold">
                                                <SelectValue placeholder="Pilih Unit" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border">
                                                {UNITS.map(u => (
                                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Harga Jual (Rp)</Label>
                                        <Input 
                                            type="number"
                                            className="h-11 rounded-xl bg-muted/50 border-border focus:ring-primary font-bold text-primary" 
                                            value={itemForm.data.selling_price}
                                            onChange={e => itemForm.setData('selling_price', e.target.value)}
                                            placeholder="Contoh: 15000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Batas Minimum Stok</Label>
                                        <Input 
                                            type="number"
                                            className="h-11 rounded-xl bg-muted/50 border-border focus:ring-primary font-black" 
                                            value={itemForm.data.low_stock_threshold}
                                            onChange={e => itemForm.setData('low_stock_threshold', parseInt(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Initial Stock (Only for New Item) */}
                                {!editingItem && (
                                    <div className="space-y-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 border-dashed">
                                        <div className="flex items-center gap-2 text-primary mb-2">
                                            <Layers className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Stok Awal (Opsional)</span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                                                <Plus className="h-3 w-3" /> Jumlah Stok Saat Ini
                                            </Label>
                                            <Input 
                                                type="number"
                                                className="h-11 rounded-xl bg-background border-border focus:ring-primary font-black" 
                                                value={itemForm.data.initial_qty}
                                                onChange={e => itemForm.setData('initial_qty', parseInt(e.target.value))}
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                                                <Coins className="h-3 w-3" /> Harga Modal per Unit (Rp)
                                            </Label>
                                            <Input 
                                                type="number"
                                                className="h-11 rounded-xl bg-background border-border focus:ring-primary font-black" 
                                                value={itemForm.data.initial_cogs}
                                                onChange={e => itemForm.setData('initial_cogs', parseInt(e.target.value))}
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3" /> Tanggal Kadaluarsa
                                            </Label>
                                            <Input 
                                                type="date"
                                                className="h-11 rounded-xl bg-background border-border focus:ring-primary font-bold" 
                                                value={itemForm.data.initial_expiry}
                                                onChange={e => itemForm.setData('initial_expiry', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-4 gap-2 sm:gap-0">
                                <Button type="button" variant="outline" className="rounded-full flex-1" onClick={() => setIsItemDialogOpen(false)}>Batal</Button>
                                <Button type="submit" className="rounded-full flex-1 glow-primary" disabled={itemForm.processing}>
                                    {itemForm.processing ? 'Menyimpan...' : 'Simpan Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Batch Confirmation */}
                <Dialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
                    <DialogContent className="rounded-2xl border-border shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-destructive font-black text-xl flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> Hapus Batch Stok?
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium">
                                Tindakan ini tidak dapat dibatalkan. Batch stok fisik ini akan dihapus permanen dari sistem.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" className="rounded-full flex-1" onClick={() => setIsBatchDeleteDialogOpen(false)}>Batal</Button>
                            <Button variant="destructive" className="rounded-full flex-1 shadow-lg shadow-destructive/20" onClick={handleDeleteBatch}>Ya, Hapus Permanen</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Item Confirmation */}
                <Dialog open={isItemDeleteDialogOpen} onOpenChange={setIsItemDeleteDialogOpen}>
                    <DialogContent className="rounded-2xl border-border shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-destructive font-black text-xl flex items-center gap-2">
                                <Trash2 className="h-5 w-5" /> Hapus Definisi Barang?
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium">
                                <span className="text-destructive font-black">PENTING:</span> Menghapus definisi barang akan menghapus <span className="font-bold underline">seluruh batch stok</span> yang terkait dengan barang ini. Apakah Anda yakin?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" className="rounded-full flex-1" onClick={() => setIsItemDeleteDialogOpen(false)}>Batal</Button>
                            <Button variant="destructive" className="rounded-full flex-1 shadow-lg shadow-destructive/20" onClick={handleDeleteItem}>Hapus Barang & Stok</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

InventoryIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard.url(props.currentTeam.slug) : '/',
        },
        {
            title: 'Inventory',
            href: props.currentTeam ? inventory.index.url(props.currentTeam.slug) : '#',
        },
    ] satisfies BreadcrumbItem[],
});
