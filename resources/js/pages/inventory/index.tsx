import { Head, usePage } from '@inertiajs/react';
import { formatDistanceToNow, isBefore, addDays, parseISO } from 'date-fns';
import { MoreHorizontal, Package, Trash2, Edit, AlertTriangle } from 'lucide-react';
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
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import * as inventory from '@/routes/inventory';

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

interface Props {
    batches: Batch[];
}

export default function InventoryIndex({ batches }: Props) {
    const { currentTeam } = usePage().props as any;
    const isOwner = currentTeam?.role === 'owner';

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                </div>

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
                                                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                                                    <Edit className="h-4 w-4" />
                                                                    Edit Batch
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
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
