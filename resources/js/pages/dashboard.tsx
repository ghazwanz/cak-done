import { Head, router, Link } from '@inertiajs/react';
import { Wallet, ArrowDown, ArrowUp, FileText, ChartLine, Clock, ChevronRight, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';
import inventory from '@/routes/inventory';
import transactions from '@/routes/transactions';

interface CashFlowData {
    date: string;
    balance: number;
}

interface Transaction {
    id: number;
    item_name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    created_at: string;
}

interface Props {
    auth: {
        user: {
            name: string;
            email: string;
        };
    };
    currentBalance?: number;
    historicalCashFlow?: CashFlowData[];
    period?: string;
    teamSlug?: string;
    latestBriefing?: string | null;
    watchdog?: {
        lowStockCount: number;
        expiredCount: number;
        alerts: any[];
    };
    recentTransactions?: Transaction[];
    monthlyTotals?: {
        income: number;
        expense: number;
        count: number;
    };
    proactiveAlerts?: Array<{
        name?: string;
        day?: string;
        message?: string;
        days_to?: number;
        type?: string;
    }>;
}

export default function Dashboard({ 
    auth, 
    currentBalance = 0, 
    historicalCashFlow = [], 
    period = '7_days', 
    teamSlug, 
    latestBriefing,
    watchdog = { lowStockCount: 0, expiredCount: 0, alerts: [] },
    recentTransactions = [],
    monthlyTotals = { income: 0, expense: 0, count: 0 },
    proactiveAlerts = []
}: Props) {
    const [view, setView] = useState<'business' | 'personal'>('business');

    const businessBalance = currentBalance;
    const personalBalance = currentBalance * 0.2; // Dummy for personal

    const periods = [
        { id: '7_days', label: '7 Hari' },
        { id: '1_month', label: '1 Bulan' },
        { id: '3_months', label: '3 Bulan' },
        { id: '1_year', label: '1 Tahun' },
        { id: '5_years', label: '5 Tahun' },
    ];

    const handlePeriodChange = (newPeriod: string) => {
        if (!teamSlug) {
return;
}

        router.get(dashboard.url(teamSlug), { period: newPeriod }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Dashboard Utama - Cak DONE" />
            <div className="flex-1 overflow-y-auto p-4 bg-background relative h-full">
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Ringkasan Finansial</h2>
                            <p className="text-sm text-muted-foreground">Selamat datang kembali, {auth.user.name}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-[300px]">
                                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50">
                                    <TabsTrigger value="business" className="rounded-lg">Bisnis</TabsTrigger>
                                    <TabsTrigger value="personal" className="rounded-lg">Pribadi</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="hidden lg:flex items-center gap-2 text-xs font-medium bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sinkronisasi Aktif
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-primary/90 via-primary/80 to-primary/90 rounded-2xl p-6 md:p-8 text-primary-foreground shadow-xl relative overflow-hidden flex items-center justify-between border border-primary/20">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                        <div className="flex flex-col md:flex-row items-start gap-5 relative z-10 w-full">
                            <div className="bg-white/10 p-4 rounded-2xl shrink-0 text-amber-300 backdrop-blur-md border border-white/20">
                                <i className="fas fa-lightbulb text-3xl"></i>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl font-bold tracking-wide">Bisikan Strategis Cak DONE</h3>
                                    <span className="bg-white/20 text-[10px] uppercase px-2 py-0.5 rounded border border-white/30 backdrop-blur-sm">Analisis Real-time</span>
                                </div>
                                <p className="text-primary-foreground/90 leading-relaxed text-sm md:text-base font-medium">
                                    {latestBriefing ? latestBriefing : "Belum ada bisikan strategis hari ini. Sistem AI sedang menganalisa data transaksi Anda..."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {proactiveAlerts.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Antisipasi Bisnis</h3>
                            </div>
                            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
                                {proactiveAlerts.map((alert, idx) => (
                                    <div 
                                        key={idx} 
                                        className="min-w-[280px] md:min-w-[320px] p-4 rounded-2xl bg-card border-2 border-primary/10 shadow-sm flex flex-col gap-3 group hover:border-primary/30 transition-all cursor-default"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:scale-110 transition-transform">
                                                {alert.name ? <Calendar className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                                            </div>
                                            {alert.days_to !== undefined && (
                                                <span className="text-[10px] font-black uppercase px-2 py-1 bg-amber-500/10 text-amber-600 rounded-lg">
                                                    H-{alert.days_to}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm mb-1">{alert.name || (alert.day ? `Pola Hari ${alert.day}` : 'Peringatan Bisnis')}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {alert.message || alert.advice || (alert.type === 'income' ? 'Hari ini biasanya ramai pemasukan!' : 'Hati-hati pengeluaran membengkak.')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="rounded-2xl shadow-sm border-border bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Total Kas {view === 'business' ? 'Usaha' : 'Pribadi'}
                                </CardTitle>
                                <div className={view === 'business' ? "bg-primary/10 text-primary p-2 rounded-xl" : "bg-purple-500/10 text-purple-500 p-2 rounded-xl"}>
                                    <Wallet className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold text-foreground mb-1">
                                    Rp {(view === 'business' ? businessBalance : personalBalance).toLocaleString('id-ID')}
                                </div>
                                {view === 'business' && (
                                    <a href={`/${teamSlug}/reports/cashflow`} target="_blank" className="text-sm text-primary font-bold hover:underline flex items-center gap-1 mt-2">
                                        <FileText className="h-3 w-3" /> Cetak Laporan (IAI)
                                    </a>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-sm border-border bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Pemasukan Bulan Ini
                                </CardTitle>
                                <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl">
                                    <ArrowDown className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold text-foreground mb-1">
                                    Rp {(view === 'business' ? monthlyTotals.income : monthlyTotals.income * 0.2).toLocaleString('id-ID')}
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">Dari {view === 'business' ? monthlyTotals.count : Math.round(monthlyTotals.count * 0.2)} Transaksi</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-sm border-border bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Pengeluaran Bulan Ini
                                </CardTitle>
                                <div className="bg-destructive/10 text-destructive p-2 rounded-xl">
                                    <ArrowUp className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold text-foreground mb-1">
                                    Rp {(view === 'business' ? monthlyTotals.expense : monthlyTotals.expense * 0.2).toLocaleString('id-ID')}
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    {view === 'business' ? 'Total operasional & bahan' : 'Total kebutuhan pribadi'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <Card className="shadow-sm border-border bg-card">
                            <CardHeader className="p-5 border-b border-border bg-muted/30 rounded-t-2xl flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="font-bold text-foreground flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-amber-500/10 text-amber-500 w-8 h-8 rounded-lg flex items-center justify-center">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        Watchdog {view === 'business' ? 'Inventori' : 'Pribadi'}
                                    </div>
                                    {teamSlug && (
                                        <Link 
                                            href={inventory.index.url(teamSlug)} 
                                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 font-bold uppercase tracking-wider"
                                        >
                                            Kelola <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {watchdog.alerts.length > 0 ? (
                                    watchdog.alerts.map((alert, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-destructive/5 rounded-xl border border-destructive/20 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-1.5 h-full bg-destructive"></div>
                                            <div className="flex items-center gap-4">
                                                <div className="bg-card text-destructive w-12 h-12 rounded-xl shadow-sm border border-destructive/20 flex items-center justify-center text-xl glow-destructive/20">
                                                    <Clock className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-sm">{alert.item_name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Sisa: <span className="font-bold text-destructive">{alert.qty} unit</span></p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-wider rounded-lg animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                                {new Date(alert.expiry_date) < new Date() ? 'Kedaluwarsa!' : 'Segera Habis!'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                                            <i className="fas fa-check-circle"></i>
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">Semua stok aman & segar!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-sm border-border bg-card flex flex-col">
                            <CardHeader className="p-5 border-b border-border bg-muted/30 rounded-t-2xl flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="font-bold text-foreground flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center"><i className="fas fa-list-ul"></i></div>
                                        Jurnal Terakhir
                                    </div>
                                    {teamSlug && (
                                        <Link 
                                            href={transactions.index.url(teamSlug)} 
                                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 font-bold uppercase tracking-wider"
                                        >
                                            Semua <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-x-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-border">
                                        {recentTransactions.length > 0 ? (
                                            recentTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-muted/30 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                                {tx.type === 'income' ? <ArrowDown className="h-3 w-3 text-emerald-500" /> : <ArrowUp className="h-3 w-3 text-destructive" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground text-sm">{tx.item_name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('id-ID')}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] border font-bold ${
                                                            tx.type === 'income' 
                                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                                : 'bg-destructive/10 text-destructive border-destructive/20'
                                                        }`}>
                                                            {tx.category || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-destructive'}`}>
                                                        {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-10 text-center text-muted-foreground italic text-sm">
                                                    Belum ada transaksi tercatat.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-border bg-card xl:col-span-2">
                            <CardHeader className="p-5 border-b border-border bg-muted/30 rounded-t-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 space-y-0">
                                <CardTitle className="font-bold text-foreground flex items-center gap-2">
                                    <div className="bg-emerald-500/10 text-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center">
                                        <ChartLine className="h-4 w-4" />
                                    </div>
                                    Riwayat Arus Kas ({periods.find(p => p.id === period)?.label})
                                </CardTitle>

                                <div className="flex bg-background/50 p-1 rounded-lg border border-border shadow-inner">
                                    {periods.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handlePeriodChange(p.id)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                period === p.id 
                                                    ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart 
                                        data={view === 'business' ? historicalCashFlow : historicalCashFlow.map(d => ({ ...d, balance: d.balance * 0.2 }))} 
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={view === 'business' ? "#10b981" : "#a855f7"} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={view === 'business' ? "#10b981" : "#a855f7"} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fill: '#64748b' }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fill: '#64748b' }} 
                                            tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}k`} 
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [`Rp ${Math.round(value).toLocaleString('id-ID')}`, 'Saldo']}
                                            labelFormatter={(label) => `Waktu: ${label}`}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor:"var(--background)", boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="balance" stroke={view === 'business' ? "#10b981" : "#a855f7"} strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.teamSlug ? dashboard.url(props.teamSlug) : '#',
        },
    ],
});
