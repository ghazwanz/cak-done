import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { FormEvent, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, ArrowDown, ArrowUp, FileText, ChartLine, Clock } from 'lucide-react';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
// import { Link } from '@inertiajs/react';
// import AppLayout from '@/layouts/app-layout'; // Pastikan path ini sesuai dengan layout bawaan projectmu

interface ForecastData {
    date: string;
    predicted_balance: number;
}

interface Props {
    auth: {
        user: {
            name: string;
            email: string;
        };
    };
    currentBalance?: number;
    forecast7Days?: ForecastData[];
    forecast30Days?: ForecastData[];
    teamSlug?: string;
}

export default function Dashboard({ auth, currentBalance = 0, forecast7Days = [], forecast30Days = [], teamSlug }: Props) {
    const [view, setView] = useState<'business' | 'personal'>('business');

    // For demo purposes, we'll split the balance. 
    // In a real app, these would come from the backend.
    const businessBalance = currentBalance;
    const personalBalance = currentBalance * 0.2; // Dummy data for personal

    return (
        <>
            <Head title="Dashboard Utama - Cak DONE" />
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 bg-background relative h-full">
                <div className="max-w-7xl mx-auto space-y-8">
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
                        <div className="absolute -right-10 -bottom-10 opacity-20 transform -rotate-12">
                            <i className="fas fa-robot text-[150px]"></i>
                        </div>

                        <div className="flex flex-col md:flex-row items-start gap-5 relative z-10 w-full">
                            <div className="bg-white/10 p-4 rounded-2xl shrink-0 text-amber-300 backdrop-blur-md border border-white/20">
                                <i className="fas fa-lightbulb text-3xl"></i>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl font-bold tracking-wide">Bisikan Strategis Cak DONE</h3>
                                    <span className="bg-white/20 text-[10px] uppercase px-2 py-0.5 rounded border border-white/30 backdrop-blur-sm">Prediksi Arus Kas</span>
                                </div>
                                <p className="text-primary-foreground/90 leading-relaxed text-sm md:text-base font-medium">
                                    "Bos, Kas hari ini stabil. Tapi hati-hati, <strong className="text-amber-300">Stok Sosis Kanzler</strong> sisa 5 bungkus dan besok expired! Saran saya, buat promo Bundling hari ini untuk mempercepat penjualan sebelum rusak."
                                </p>
                            </div>
                        </div>
                    </div>



                    {/* ========================================== */}
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
                                    Pemasukan Hari Ini
                                </CardTitle>
                                <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl">
                                    <ArrowDown className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold text-foreground mb-1">
                                    Rp {(view === 'business' ? 850000 : 125000).toLocaleString('id-ID')}
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">Dari {view === 'business' ? '24' : '2'} Transaksi</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-sm border-border bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Pengeluaran Hari Ini
                                </CardTitle>
                                <div className="bg-destructive/10 text-destructive p-2 rounded-xl">
                                    <ArrowUp className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold text-foreground mb-1">
                                    Rp {(view === 'business' ? 320000 : 45000).toLocaleString('id-ID')}
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    {view === 'business' ? 'Belanja bahan baku' : 'Jajan sore'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>




                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* Cashflow Prediction Chart */}
                        <Card className="shadow-sm border-border bg-card xl:col-span-2">
                            <CardHeader className="p-5 border-b border-border bg-muted/30 rounded-t-2xl flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="font-bold text-foreground flex items-center gap-2">
                                    <div className="bg-emerald-500/10 text-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center">
                                        <ChartLine className="h-4 w-4" />
                                    </div>
                                    Prediksi Arus Kas (7 Hari ke Depan)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart 
                                        data={view === 'business' ? forecast7Days : forecast7Days.map(d => ({ ...d, predicted_balance: d.predicted_balance * 0.2 }))} 
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={view === 'business' ? "#10b981" : "#a855f7"} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={view === 'business' ? "#10b981" : "#a855f7"} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            formatter={(value: number) => [`Rp ${Math.round(value).toLocaleString('id-ID')}`, 'Prediksi Saldo']}
                                            labelFormatter={(label) => `Tanggal: ${label}`}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor:"var(--background)", boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="predicted_balance" stroke={view === 'business' ? "#10b981" : "#a855f7"} strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-border bg-card">
                            <CardHeader className="p-5 border-b border-border bg-muted/30 rounded-t-2xl flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="font-bold text-foreground flex items-center gap-2">
                                    <div className="bg-amber-500/10 text-amber-500 w-8 h-8 rounded-lg flex items-center justify-center">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    Watchdog {view === 'business' ? 'Inventori' : 'Pribadi'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">

                                <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-xl border border-destructive/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-destructive"></div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-card text-destructive w-12 h-12 rounded-xl shadow-sm border border-destructive/20 flex items-center justify-center text-xl glow-destructive/20">
                                            <i className="fas fa-hotdog"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm">Sosis Sapi Kanzler</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">Sisa: <span className="font-bold text-destructive">5 Bks</span></p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-wider rounded-lg animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">Besok Basi!</span>
                                </div>
                            </CardContent>
                        </Card>


                        <Card className="rounded-2xl shadow-sm border-border bg-card flex flex-col">
                            <CardHeader className="p-5 border-b border-border bg-muted/30 rounded-t-2xl flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="font-bold text-foreground flex items-center gap-2">
                                    <div className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center"><i className="fas fa-list-ul"></i></div>
                                    Jurnal Terakhir
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-x-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-border">
                                        <tr className="hover:bg-muted/30 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs"><i className="fas fa-microphone"></i></div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">Pesanan Gofood #882</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] border border-emerald-500/20 font-bold">Penjualan</span></td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-500 text-sm">+ Rp 145.000</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
        },
    ],
});
