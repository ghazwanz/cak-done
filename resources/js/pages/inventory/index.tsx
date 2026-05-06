import { Head, usePage, router } from '@inertiajs/react';
import { formatDistanceToNow, isBefore, addDays, parseISO } from 'date-fns';
import { MoreHorizontal, Package, Trash2, Edit, AlertTriangle, ArrowUpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import * as inventory from '@/routes/inventory';
import { useState } from 'react';

interface Batch {
    id: number;
    inventory_item_id: number;
    item_name: string;
    qty: number;
    unit: string;
    cogs: string;
    expiry_date: string;
    inventory_item?: {
        name: string;
    };
}

interface LowStockItem {
    id: number;
    name: string;
    low_stock_threshold: number;
    batches: Batch[];
}

interface Props {
    batches: Batch[];
    lowStockItems: LowStockItem[];
}

export default function InventoryIndex({ batches, lowStockItems }: Props) {
    const { currentTeam } = usePage().props as any;
    const isOwner = currentTeam?.role === 'owner';

    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [editQty, setEditQty] = useState<string>('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState<number | null>(null);

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

    const handleUpdateQty = () => {
        if (!editingBatch) return;

        router.patch(`/${currentTeam.slug}/inventory/${editingBatch.id}`, {
            qty: parseInt(editQty),
        }, {
            onSuccess: () => {
                setEditingBatch(null);
            }
        });
    };

    const handleDeleteBatch = () => {
        if (batchToDelete === null) return;

        router.delete(`/${currentTeam.slug}/inventory/${batchToDelete}`, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setBatchToDelete(null);
            }
        });
    };

    const getStatusVariant = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = parseISO(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (isBefore(expiry, today)) {
            return 'destructive';
        }

        if (isBefore(expiry, addDays(today, 3))) {
            return 'destructive';
        }

        if (isBefore(expiry, addDays(today, 7))) {
            return 'warning';
        }

        return 'secondary';
    };

    const getStatusLabel = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = parseISO(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (isBefore(expiry, today)) {
            return 'Expired';
        }

        return `${formatDistanceToNow(expiry, { addSuffix: false })} left`;
    };

    return (
        <>
            <Head title="Inventory — Cak DONE" />

            <div className="flex flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
                    <p className="text-muted-foreground">Pantau stok barang dan tanggal kadaluarsa secara otomatis.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="bg-card border-border">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Total Batch</p>
                                    <p className="text-2xl font-bold text-foreground">{batches.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Expired</p>
                                    <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Nearing Expiry</p>
                                    <p className="text-2xl font-bold text-amber-500">{warningCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                    <ArrowUpCircle className="h-5 w-5 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Low Stock</p>
                                    <p className="text-2xl font-bold text-rose-500">{lowStockItems.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Replenishment Suggestions */}
                {lowStockItems.length > 0 && (
                    <Card className="border-rose-500/50 bg-rose-500/5 overflow-hidden">
                        <CardHeader className="px-6 py-4">
                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                <ArrowUpCircle className="h-5 w-5" />
                                <CardTitle className="text-lg font-bold">Replenishment Required</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {lowStockItems.map(item => {
                                    const currentStock = item.batches.reduce((sum, b) => sum + b.qty, 0);
                                    return (
                                        <div key={item.id} className="flex flex-col p-3 rounded-xl bg-background border border-border shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-foreground">{item.name}</span>
                                                <Badge variant="destructive" className="text-[10px] px-1.5 h-4">CRITICAL</Badge>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>Sisa Stok:</span>
                                                <span className="font-medium text-rose-500">{currentStock}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Minimum:</span>
                                                <span className="font-medium">{item.low_stock_threshold}</span>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-rose-500 rounded-full"
                                                        style={{ width: `${Math.min(100, (currentStock / item.low_stock_threshold) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Table */}
                <Card className="border-border bg-card overflow-hidden">
                    <CardHeader className="border-b border-border px-6">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            Stock & Expiry Watchdog
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border">
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground">Product Name</TableHead>
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground">Quantity</TableHead>
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground">Expiry Date</TableHead>
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground">Status</TableHead>
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground text-right">COGS</TableHead>
                                        {isOwner && (
                                            <TableHead className="py-3.5 px-6 font-bold text-muted-foreground text-center w-[80px]">Actions</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {batches.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isOwner ? 6 : 5} className="text-center py-20 text-muted-foreground italic">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                                                        📦
                                                    </div>
                                                    No inventory items found. Add some through Smart Entry!
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        batches.map((batch) => (
                                            <TableRow
                                                key={batch.id}
                                                className="group border-border hover:bg-accent/30 transition-colors"
                                            >
                                                <TableCell className="py-4 px-6 font-medium text-foreground">
                                                    {batch.inventory_item?.name || batch.item_name}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{batch.qty}</span> {batch.unit}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-muted-foreground">
                                                    {new Date(batch.expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge
                                                        variant={getStatusVariant(batch.expiry_date) as any}
                                                        className="rounded-full px-3 py-1 font-medium ring-1 ring-inset ring-current/10"
                                                    >
                                                        {getStatusLabel(batch.expiry_date)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right font-mono text-foreground">
                                                    Rp {parseFloat(batch.cogs).toLocaleString('id-ID')}
                                                </TableCell>
                                                {isOwner && (
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
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem
                                                                    className="gap-2 cursor-pointer"
                                                                    onClick={() => {
                                                                        setEditingBatch(batch);
                                                                        setEditQty(batch.qty.toString());
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    Edit Batch
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                                    onClick={() => {
                                                                        setBatchToDelete(batch.id);
                                                                        setIsDeleteDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Delete
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

                {/* Edit Qty Dialog */}
                <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Stock Quantity</DialogTitle>
                            <DialogDescription>
                                Masukkan jumlah stok terbaru untuk {editingBatch?.inventory_item?.name || editingBatch?.item_name}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="qty" className="text-right">
                                    Quantity
                                </Label>
                                <Input
                                    id="qty"
                                    type="number"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className="col-span-3"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingBatch(null)}>Cancel</Button>
                            <Button onClick={handleUpdateQty}>Simpan Perubahan</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-destructive">Delete Batch?</DialogTitle>
                            <DialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Batch stok ini akan dihapus permanen dari sistem.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
                            <Button variant="destructive" onClick={handleDeleteBatch}>Ya, Hapus Permanen</Button>
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
