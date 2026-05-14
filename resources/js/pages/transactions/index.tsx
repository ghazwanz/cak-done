import { Head, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Wallet, ReceiptText, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { dashboard } from '@/routes';
import * as transactions from '@/routes/transactions';
import type { BreadcrumbItem } from '@/types';

interface Transaction {
    id: number;
    item_name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    is_business: boolean;
    raw_input: string | null;
    created_at: string;
    user?: {
        name: string;
    };
}

interface Props {
    transactions: {
        data: Transaction[];
        links: any[];
        meta: any;
    };
}

export default function TransactionsIndex({ transactions: transactionsData }: Props) {
    const { currentTeam } = usePage().props as any;
    const items = transactionsData.data;

    const totalIncome = items
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = items
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpense;

    return (
        <>
            <Head title="Riwayat Transaksi — Cak DONE" />

            <div className="flex flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Riwayat Transaksi</h1>
                    <p className="text-muted-foreground">Catatan operasional bisnis Anda yang diolah secara cerdas.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card border-border shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Total Pemasukan</p>
                                    <p className="text-2xl font-bold text-emerald-500 mt-1">
                                        Rp {totalIncome.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                    <ArrowDownLeft className="h-6 w-6 text-emerald-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Total Pengeluaran</p>
                                    <p className="text-2xl font-bold text-rose-500 mt-1">
                                        Rp {totalExpense.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                                    <ArrowUpRight className="h-6 w-6 text-rose-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Saldo Bersih</p>
                                    <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                                        Rp {netProfit.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Wallet className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table & Controls */}
                <Card className="border-border bg-card overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/30 px-6 flex flex-row items-center justify-between space-y-0 py-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <ReceiptText className="h-5 w-5 text-primary" />
                            Jurnal Finansial
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari transaksi..."
                                    className="pl-9 h-9 w-[200px] lg:w-[300px] bg-background border-border"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="border-border">
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground">Tanggal</TableHead>
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground">Item / Keterangan</TableHead>
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground">Kategori</TableHead>
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground">Tipe</TableHead>
                                        <TableHead className="py-3.5 px-6 font-bold text-muted-foreground text-right">Nominal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                                                        💸
                                                    </div>
                                                    Belum ada transaksi terdaftar. Gunakan Log Cepat untuk mencatat!
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((t) => (
                                            <TableRow
                                                key={t.id}
                                                className="group border-border hover:bg-accent/30 transition-colors"
                                            >
                                                <TableCell className="py-4 px-6 text-muted-foreground text-sm">
                                                    {format(new Date(t.created_at), 'dd MMM yyyy, HH:mm')}
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">{t.item_name}</span>
                                                        {t.raw_input && (
                                                            <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">
                                                                "{t.raw_input}"
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 capitalize text-muted-foreground text-sm">
                                                    {t.category.replace('_', ' ')}
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge
                                                        variant={t.type === 'income' ? 'secondary' : 'destructive'}
                                                        className={`rounded-full px-3 py-0.5 font-medium border-none ${
                                                            t.type === 'income' 
                                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                                                                : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                                                        }`}
                                                    >
                                                        {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={`py-4 px-6 text-right font-mono font-bold ${
                                                    t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                                                }`}>
                                                    {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
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

TransactionsIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard.url(props.currentTeam.slug) : '/',
        },
        {
            title: 'Transaksi',
            href: props.currentTeam ? transactions.index.url(props.currentTeam.slug) : '#',
        },
    ] satisfies BreadcrumbItem[],
});
