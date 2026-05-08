import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Calendar, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as reports from '@/routes/reports';
import { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

interface Props {
    startDate: string;
    endDate: string;
    operatingIncome: number;
    operatingExpense: number;
    netOperatingCash: number;
    startingBalance: number;
    endingBalance: number;
}

export default function CashflowReport({
    startDate,
    endDate,
    operatingIncome,
    operatingExpense,
    netOperatingCash,
    startingBalance,
    endingBalance,
}: Props) {
    const { currentTeam } = usePage().props as any;
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const formatCurrency = (amount: number) => {
        if (!mounted) return 'Rp ...';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <>
            <Head title="Laporan Arus Kas" />

            <div className="flex flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Laporan Arus Kas</h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar size={14} /> {startDate} — {endDate}
                        </p>
                    </div>
                    <Button 
                        asChild 
                        variant="outline" 
                        className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary"
                    >
                        <a href={reports.cashflow.url(currentTeam.slug, { pdf: 1 })} target="_blank" rel="noreferrer">
                            <FileDown className="mr-2 h-4 w-4" /> Cetak PDF (IAI)
                        </a>
                    </Button>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold flex items-center gap-2">
                                <Wallet size={12} /> Saldo Awal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <div className="text-xl font-black text-foreground">{formatCurrency(startingBalance)}</div>
                        </CardContent>
                    </Card>

                    <Card className={cn(
                        "border-border shadow-sm",
                        netOperatingCash >= 0 ? "bg-emerald-500/5" : "bg-destructive/5"
                    )}>
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold flex items-center gap-2">
                                <TrendingUp size={12} /> Perubahan Kas Bersih
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <div className={cn(
                                "text-xl font-black",
                                netOperatingCash >= 0 ? "text-emerald-500" : "text-destructive"
                            )}>
                                {netOperatingCash > 0 ? '+' : ''}{formatCurrency(netOperatingCash)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5 shadow-lg glow-primary/5">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-[10px] uppercase text-primary tracking-widest font-bold flex items-center gap-2">
                                <TrendingUp size={12} /> Saldo Akhir
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <div className="text-xl font-black text-primary">{formatCurrency(endingBalance)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Table */}
                <Card className="border-border bg-card shadow-sm overflow-hidden">
                    <CardHeader className="p-6 border-b border-border bg-muted/30">
                        <CardTitle className="text-sm font-bold text-foreground">Aktivitas Operasi (Standard IAI)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="w-[60%] px-6">Deskripsi Aktivitas</TableHead>
                                    <TableHead className="text-right px-6">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="hover:bg-muted/30 border-border transition-colors">
                                    <TableCell className="px-6 py-4 font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <ArrowUpRight size={16} />
                                        </div>
                                        Penerimaan dari Pelanggan (Omzet)
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right font-bold text-emerald-500">
                                        {formatCurrency(operatingIncome)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-muted/30 border-border transition-colors">
                                    <TableCell className="px-6 py-4 font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                                            <ArrowDownRight size={16} />
                                        </div>
                                        Pembayaran Beban & Inventori
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right font-bold text-destructive">
                                        ({formatCurrency(operatingExpense)})
                                    </TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/50 font-black border-none">
                                    <TableCell className="px-6 py-5 text-foreground uppercase tracking-wider text-[10px]">
                                        Arus Kas Bersih dari Aktivitas Operasi
                                    </TableCell>
                                    <TableCell className={cn(
                                        "px-6 py-5 text-right text-lg",
                                        netOperatingCash >= 0 ? "text-emerald-500" : "text-destructive"
                                    )}>
                                        {formatCurrency(netOperatingCash)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Final Calculation Section */}
                <div className="p-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Rekapitulasi Akhir</p>
                        <p className="text-sm text-muted-foreground">Saldo Awal + Perubahan Kas = Saldo Akhir Kas</p>
                    </div>
                    <div className="text-2xl font-black text-foreground flex items-center gap-3">
                        <span className="text-muted-foreground/30">{formatCurrency(startingBalance)}</span>
                        <span className="text-primary">+</span>
                        <span className={cn(netOperatingCash >= 0 ? "text-emerald-500" : "text-destructive")}>
                            ({formatCurrency(netOperatingCash)})
                        </span>
                        <span className="text-primary">=</span>
                        <span className="text-primary underline decoration-primary/30 underline-offset-8">{formatCurrency(endingBalance)}</span>
                    </div>
                </div>
            </div>
        </>
    );
}

CashflowReport.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard.url(props.currentTeam.slug) : '/',
        },
        {
            title: 'Laporan Kas',
            href: props.currentTeam ? reports.cashflow.url(props.currentTeam.slug) : '#',
        },
    ] satisfies BreadcrumbItem[],
});
