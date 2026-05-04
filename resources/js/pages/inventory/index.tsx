import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { BreadcrumbItem } from '@/types';
import { formatDistanceToNow, isBefore, addDays, parseISO } from 'date-fns';

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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: '/inventory',
    },
];

export default function InventoryIndex({ batches }: Props) {
    const getStatusVariant = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = parseISO(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        
        if (isBefore(expiry, today)) return 'destructive'; // Expired
        if (isBefore(expiry, addDays(today, 3))) return 'destructive'; // < 3 days (Red)
        if (isBefore(expiry, addDays(today, 7))) return 'warning'; // < 7 days (Yellow)
        return 'secondary'; // Safe (Neutral)
    };

    const getStatusLabel = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = parseISO(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        
        if (isBefore(expiry, today)) return 'Expired';
        return `Expires in ${formatDistanceToNow(expiry, { addSuffix: false })}`;
    };

    return (
        <>
            <Head title="Inventory" />
            
            <div className="flex flex-col gap-8 p-4 md:p-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Inventory</h1>
                    <p className="text-muted-foreground text-lg">Pantau stok barang dan tanggal kadaluarsa secara otomatis.</p>
                </div>

                <Card className="border-none shadow-xl shadow-indigo-100/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden">
                    <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Stock & Expiry Watchdog
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <TableRow className="border-slate-100 dark:border-slate-800">
                                        <TableHead className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">Product Name</TableHead>
                                        <TableHead className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">Quantity</TableHead>
                                        <TableHead className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">Expiry Date</TableHead>
                                        <TableHead className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                                        <TableHead className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300 text-right">COGS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {batches.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2">
                                                        📦
                                                    </div>
                                                    No inventory items found. Add some through Smart Entry!
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        batches.map((batch) => (
                                            <TableRow key={batch.id} className="group border-slate-100 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">
                                                    {batch.inventory_item?.name || batch.item_name}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-slate-600 dark:text-slate-400">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{batch.qty}</span> {batch.unit}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-slate-600 dark:text-slate-400">
                                                    {new Date(batch.expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge variant={getStatusVariant(batch.expiry_date) as any} className="rounded-full px-3 py-1 font-medium ring-1 ring-inset ring-current/10">
                                                        {getStatusLabel(batch.expiry_date)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right font-mono text-slate-900 dark:text-slate-200">
                                                    Rp {parseFloat(batch.cogs).toLocaleString('id-ID')}
                                                </TableCell>
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
