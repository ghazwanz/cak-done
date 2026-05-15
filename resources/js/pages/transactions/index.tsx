import { Head, usePage, router, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Wallet, ReceiptText, Search, Filter, Calendar, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { dashboard } from '@/routes';
import * as transactions from '@/routes/transactions';
import type { BreadcrumbItem } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

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
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
    filters: {
        search?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function TransactionsIndex({ transactions: transactionsData, filters }: Props) {
    const { currentTeam } = usePage().props as any;
    const items = transactionsData.data;

    const [search, setSearch] = useState(filters.search || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleSearch = useCallback(
        debounce((value: string) => {
            router.get(
                transactions.index.url(currentTeam.slug, { query: { search: value, start_date: startDate, end_date: endDate } }),
                {},
                { preserveState: true, replace: true }
            );
        }, 300),
        [currentTeam.slug, startDate, endDate]
    );

    const applyDateFilter = () => {
        router.get(
            transactions.index.url(currentTeam.slug, { query: { search, start_date: startDate, end_date: endDate } }),
            {},
            { preserveState: true, replace: true }
        );
    };

    const clearFilters = () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        router.get(
            transactions.index.url(currentTeam.slug),
            {},
            { preserveState: true, replace: true }
        );
    };

    useEffect(() => {
        if (search !== (filters.search || '')) {
            handleSearch(search);
        }
    }, [search]);

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
                    <CardHeader className="border-b border-border bg-muted/30 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <ReceiptText className="h-5 w-5 text-primary" />
                            Jurnal Finansial
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full sm:w-[250px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari transaksi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 bg-background border-border"
                                />
                                {search && (
                                    <button 
                                        onClick={() => setSearch('')}
                                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 h-9">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent border-none text-xs focus:ring-0 text-foreground outline-none"
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent border-none text-xs focus:ring-0 text-foreground outline-none"
                                    />
                                </div>
                                <Button size="sm" onClick={applyDateFilter} className="h-9 px-3">
                                    Filter
                                </Button>
                                {(search || startDate || endDate) && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground">
                                        Reset
                                    </Button>
                                )}
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
                    
                    {/* Pagination */}
                    {transactionsData.total > transactionsData.per_page && (
                        <div className="border-t border-border p-4 bg-muted/20">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        {transactionsData.links[0].url ? (
                                            <PaginationPrevious 
                                                href={transactionsData.links[0].url} 
                                                component={Link}
                                            />
                                        ) : (
                                            <PaginationPrevious className="pointer-events-none opacity-50" />
                                        )}
                                    </PaginationItem>
                                    
                                    {transactionsData.links.slice(1, -1).map((link: any, i: number) => {
                                        if (link.label === '...') {
                                            return (
                                                <PaginationItem key={i}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }
                                        return (
                                            <PaginationItem key={i}>
                                                <PaginationLink 
                                                    href={link.url} 
                                                    isActive={link.active}
                                                    component={Link}
                                                >
                                                    {link.label}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}

                                    <PaginationItem>
                                        {transactionsData.links[transactionsData.links.length - 1].url ? (
                                            <PaginationNext 
                                                href={transactionsData.links[transactionsData.links.length - 1].url} 
                                                component={Link}
                                            />
                                        ) : (
                                            <PaginationNext className="pointer-events-none opacity-50" />
                                        )}
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                            <div className="text-center mt-2 text-xs text-muted-foreground">
                                Menampilkan {transactionsData.from} - {transactionsData.to} dari {transactionsData.total} transaksi
                            </div>
                        </div>
                    )}
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
