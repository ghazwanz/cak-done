import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Clock,
    LineChart,
    Package,
    Sparkles,
    Wallet,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import AppearanceToggleTab from '@/components/appearance-tabs';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth, currentTeam } = usePage().props;
    const dashboardUrl = currentTeam ? dashboard(currentTeam.slug) : '/dashboard';
    
    // Ensure useAppearance runs to apply current theme correctly on mount
    useAppearance();

    return (
        <>
            <Head title="Cak Done - Asisten Keuangan Otonom"/>
            {/* 
                Root styling with Blue Theme principles. 
                Using a very dark background in dark mode, and pure white in light mode.
            */}
            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1B1B18] font-['Instrument_Sans'] transition-colors duration-300 dark:bg-[#050505] dark:text-[#EDEDEC] selection:bg-[#0E6BFD] selection:text-white">
                
                {/* Navbar */}
                <header className="sticky top-0 z-50 w-full border-b border-[#e3e3e0]/50 bg-[#FDFDFC]/80 backdrop-blur-md transition-colors duration-300 dark:border-[#3E3E3A]/50 dark:bg-[#050505]/80">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-2">
                            <AppLogoIcon className="h-8 w-8" />
                            <span className="text-lg font-bold tracking-tight">Cak Done</span>
                        </div>
                        <nav className="flex items-center gap-6">
                            <div className="hidden sm:block">
                                <AppearanceToggleTab />
                            </div>
                            
                            {auth.user ? (
                                <Link
                                    href={dashboardUrl}
                                    className="inline-block rounded-full bg-[#1b1b18] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-black hover:scale-105 active:scale-95 dark:bg-[#EDEDEC] dark:text-[#1C1C1A] dark:hover:bg-white"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link
                                        href={login()}
                                        className="text-sm font-medium transition-colors hover:text-[#0E6BFD]"
                                    >
                                        Masuk
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-block rounded-full bg-[#1b1b18] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-black hover:scale-105 active:scale-95 dark:bg-[#EDEDEC] dark:text-[#1C1C1A] dark:hover:bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                        >
                                            Daftar Gratis
                                        </Link>
                                    )}
                                </div>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="relative isolate overflow-hidden px-6 pt-32 pb-24 sm:pt-40 lg:px-8 flex flex-col items-center text-center">
                        {/* Animated Grid Background */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(14,107,253,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,107,253,0.10)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(14,107,253,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,107,253,0.16)_1px,transparent_1px)]" />
                            <div className="absolute left-[8%] top-[128px] h-px w-56 animate-[hero-grid-pulse-x_4.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[#0E6BFD] to-transparent opacity-0 shadow-[0_0_24px_rgba(14,107,253,0.7)]" />
                            <div className="absolute left-[48%] top-[256px] h-px w-80 animate-[hero-grid-pulse-x_6.2s_ease-in-out_1.1s_infinite] bg-gradient-to-r from-transparent via-[#0E6BFD] to-transparent opacity-0 shadow-[0_0_24px_rgba(14,107,253,0.65)]" />
                            <div className="absolute left-[18%] top-[384px] h-px w-72 animate-[hero-grid-pulse-x_5.6s_ease-in-out_2.4s_infinite] bg-gradient-to-r from-transparent via-[#0E6BFD] to-transparent opacity-0 shadow-[0_0_24px_rgba(14,107,253,0.6)]" />
                            <div className="absolute left-[192px] top-[8%] h-64 w-px animate-[hero-grid-pulse-y_5.4s_ease-in-out_.6s_infinite] bg-gradient-to-b from-transparent via-[#0E6BFD] to-transparent opacity-0 shadow-[0_0_24px_rgba(14,107,253,0.65)]" />
                            <div className="absolute left-[calc(50%+128px)] top-[30%] h-80 w-px animate-[hero-grid-pulse-y_6.8s_ease-in-out_1.8s_infinite] bg-gradient-to-b from-transparent via-[#0E6BFD] to-transparent opacity-0 shadow-[0_0_24px_rgba(14,107,253,0.6)]" />
                            <div className="absolute left-[calc(100%-256px)] top-[16%] h-72 w-px animate-[hero-grid-pulse-y_5.9s_ease-in-out_3s_infinite] bg-gradient-to-b from-transparent via-[#0E6BFD] to-transparent opacity-0 shadow-[0_0_24px_rgba(14,107,253,0.55)]" />
                            <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#0E6BFD]/20 to-[#072C68]/5 opacity-50 blur-[120px] dark:from-[#0E6BFD]/20 dark:to-[#072C68]/10 dark:opacity-70 transition-colors duration-1000" />
                        </div>
                        
                        <div className="inline-flex items-center rounded-full border border-[#e3e3e0] bg-white/50 px-3 py-1 text-sm font-medium backdrop-blur-sm dark:border-[#3E3E3A] dark:bg-[#161615]/50 mb-8">
                            <Sparkles className="mr-2 h-4 w-4 text-[#0E6BFD]" />
                            <span className="text-[#706f6c] dark:text-[#A1A09A]">Generasi Baru Manajemen Keuangan</span>
                        </div>
                        
                        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
                            Asisten Keuangan <span className="bg-gradient-to-r from-[#0E6BFD] to-[#072C68] bg-clip-text text-transparent">Otonom.</span>
                        </h1>
                        
                        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                            Tinggalkan cara manual. Catat transaksi dengan suara, pantau stok kedaluwarsa secara otomatis, dan amankan arus kas bisnis Anda dalam satu platform cerdas.
                        </p>
                        
                        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href={register()}
                                className="group relative flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#0E6BFD] to-[#0C66F2] px-8 py-4 text-base font-semibold text-white shadow-[0_0_30px_rgba(14,107,253,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(14,107,253,0.5)] active:scale-95"
                            >
                                <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></span>
                                <span className="relative flex items-center gap-2">
                                    Mulai Sekarang <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </span>
                            </Link>
                            <a 
                                href="#features" 
                                className="flex items-center justify-center rounded-full border-2 border-[#e3e3e0] bg-transparent px-8 py-4 text-base font-semibold text-[#1B1B18] transition-all hover:border-[#1B1B18] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#EDEDEC]"
                            >
                                Pelajari Lebih Lanjut
                            </a>
                        </div>
                    </section>

                    {/* Value Prop (Mengapa Cak Done) */}
                    <section className="px-6 py-24 sm:py-32 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            <div className="mx-auto max-w-2xl text-center">
                                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Tantangan UMKM Masa Kini</h2>
                                <p className="mt-4 text-lg text-[#706f6c] dark:text-[#A1A09A]">
                                    Cara lama menahan potensi bisnis Anda. Kami memahami rasa sakit dari operasional manual.
                                </p>
                            </div>
                            
                            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                                {/* Card 1 */}
                                <div className="relative flex flex-col rounded-3xl bg-[#f5f5f4] p-8 shadow-sm transition-all hover:shadow-md dark:bg-[#111111] dark:shadow-none dark:ring-1 dark:ring-[#3E3E3A] group overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-[#0E6BFD]/10 blur-2xl transition-all group-hover:bg-[#0E6BFD]/20"></div>
                                    <AlertTriangle className="h-10 w-10 text-[#0E6BFD]" />
                                    <h3 className="mt-6 text-xl font-bold">Financial Blindness</h3>
                                    <p className="mt-4 text-base leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                        Mencampur dana pribadi dan usaha, tidak tahu pasti berapa laba harian sebenarnya.
                                    </p>
                                </div>
                                {/* Card 2 */}
                                <div className="relative flex flex-col rounded-3xl bg-[#f5f5f4] p-8 shadow-sm transition-all hover:shadow-md dark:bg-[#111111] dark:shadow-none dark:ring-1 dark:ring-[#3E3E3A] group overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-[#0C66F2]/10 blur-2xl transition-all group-hover:bg-[#0C66F2]/20"></div>
                                    <Clock className="h-10 w-10 text-[#0C66F2]" />
                                    <h3 className="mt-6 text-xl font-bold">Kelelahan Administrasi</h3>
                                    <p className="mt-4 text-base leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                        Menghabiskan waktu berjam-jam setiap malam hanya untuk merekap nota yang berminyak dan lecek.
                                    </p>
                                </div>
                                {/* Card 3 */}
                                <div className="relative flex flex-col rounded-3xl bg-[#f5f5f4] p-8 shadow-sm transition-all hover:shadow-md dark:bg-[#111111] dark:shadow-none dark:ring-1 dark:ring-[#3E3E3A] group overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-[#0E6BFD]/10 blur-2xl transition-all group-hover:bg-[#0E6BFD]/20"></div>
                                    <Package className="h-10 w-10 text-[#0E6BFD]" />
                                    <h3 className="mt-6 text-xl font-bold">Food Waste & Kerugian</h3>
                                    <p className="mt-4 text-base leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                        Banyak produk kedaluwarsa tanpa disadari di dasar freezer karena ketiadaan sistem pelacakan FIFO.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Breakthrough Showcase */}
                    <section className="relative overflow-hidden py-24 sm:py-32">
                        <div className="absolute inset-0 bg-[#0a0a0a]"></div>
                        <div className="absolute top-1/2 left-1/2 -z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#0E6BFD]/10 to-transparent blur-3xl"></div>
                        
                        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                                Breakthrough doesn't happen<br />
                                <span className="text-4xl text-[#706f6c] sm:text-6xl">with manual entry.</span>
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#A1A09A]">
                                Rasakan kebebasan mengelola bisnis dengan asisten otonom yang bekerja 24/7 di latar belakang.
                            </p>
                            
                            {/* Stylized Dashboard Mockup */}
                            <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-[#3E3E3A] bg-[#111111]/80 p-2 shadow-2xl backdrop-blur-xl sm:p-4">
                                <div className="rounded-xl border border-[#3E3E3A]/50 bg-[#0a0a0a] overflow-hidden">
                                    {/* Mockup Header */}
                                    <div className="flex items-center gap-2 border-b border-[#3E3E3A] px-4 py-3">
                                        <div className="flex gap-1.5">
                                            <div className="h-3 w-3 rounded-full bg-[#3E3E3A]"></div>
                                            <div className="h-3 w-3 rounded-full bg-[#3E3E3A]"></div>
                                            <div className="h-3 w-3 rounded-full bg-[#3E3E3A]"></div>
                                        </div>
                                    </div>
                                    {/* Mockup Body */}
                                    <div className="p-6 md:p-10">
                                        <div className="flex flex-col md:flex-row gap-8">
                                            <div className="flex-1 space-y-6">
                                                <div className="h-8 w-1/3 rounded-lg bg-[#3E3E3A]/30"></div>
                                                <div className="flex items-end gap-4 h-48 border-b border-l border-[#3E3E3A]/50 p-4">
                                                    {/* Fake Chart Bars */}
                                                    {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                                                        <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-[#0E6BFD]/20 to-[#0E6BFD]" style={{ height: `${h}%` }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-full md:w-64 flex flex-col gap-4">
                                                <div className="rounded-xl border border-[#3E3E3A]/50 bg-[#161615] p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E6BFD]/20">
                                                            <Activity className="h-5 w-5 text-[#0E6BFD]" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm text-[#A1A09A]">Prediksi Arus Kas</div>
                                                            <div className="font-bold text-white">Aman</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-[#3E3E3A]/50 bg-[#161615] p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff8c00]/20">
                                                            <AlertTriangle className="h-5 w-5 text-[#ff8c00]" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm text-[#A1A09A]">Stok Hampir Expired</div>
                                                            <div className="font-bold text-white">2 Item</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Feature Grid */}
                    <section id="features" className="px-6 py-24 sm:py-32 lg:px-8 bg-[#FDFDFC] dark:bg-[#050505]">
                        <div className="mx-auto max-w-7xl">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Semua yang Anda butuhkan.</h2>
                                <p className="mt-4 text-lg text-[#706f6c] dark:text-[#A1A09A] max-w-2xl mx-auto">
                                    Fitur otonom yang bekerja 24/7 untuk memastikan operasional bisnis Anda berjalan lancar tanpa pengawasan konstan.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="border border-[#e3e3e0] dark:border-[#3E3E3A] rounded-2xl p-8 hover:bg-[#f5f5f4] dark:hover:bg-[#111111] transition-colors">
                                    <div className="h-12 w-12 rounded-lg bg-[#1B1B18] dark:bg-white flex items-center justify-center mb-6 text-white dark:text-[#1B1B18]">
                                        <Wallet className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Smart Multimodal Entry (Catat)</h3>
                                    <p className="text-[#706f6c] dark:text-[#A1A09A]">Catat transaksi melalui pesan suara atau foto nota. AI secara otomatis mengkategorikan dan menyimpannya.</p>
                                </div>
                                <div className="border border-[#e3e3e0] dark:border-[#3E3E3A] rounded-2xl p-8 hover:bg-[#f5f5f4] dark:hover:bg-[#111111] transition-colors">
                                    <div className="h-12 w-12 rounded-lg bg-[#0E6BFD] flex items-center justify-center mb-6 text-white">
                                        <Package className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Autonomous Inventory Watchdog</h3>
                                    <p className="text-[#706f6c] dark:text-[#A1A09A]">Notifikasi push otomatis untuk stok yang mendekati kedaluwarsa, lengkap dengan rekomendasi diskon.</p>
                                </div>
                                <div className="border border-[#e3e3e0] dark:border-[#3E3E3A] rounded-2xl p-8 hover:bg-[#f5f5f4] dark:hover:bg-[#111111] transition-colors">
                                    <div className="h-12 w-12 rounded-lg bg-[#1B1B18] dark:bg-white flex items-center justify-center mb-6 text-white dark:text-[#1B1B18]">
                                        <LineChart className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Predictive Cash Flow Agent</h3>
                                    <p className="text-[#706f6c] dark:text-[#A1A09A]">Analisis tren pengeluaran masa lalu untuk memprediksi risiko likuiditas di masa depan.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Personas (Portfolio Style) */}
                    <section className="border-t border-[#e3e3e0] dark:border-[#3E3E3A] bg-[#f5f5f4] dark:bg-[#111111] py-24 sm:py-32">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                                    Desain Khusus <span className=" text-[#706f6c] dark:text-[#A1A09A]">Untuk Anda</span>
                                </h2>
                                <p className="mt-4 text-lg text-[#706f6c] dark:text-[#A1A09A] max-w-2xl mx-auto">
                                    Cak Done memahami alur kerja unik setiap jenis usaha, memberikan solusi yang tepat sasaran untuk masalah harian Anda.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                {/* Persona 1 */}
                                <div className="group relative overflow-hidden rounded-3xl bg-[#FDFDFC] dark:bg-[#050505] border border-[#e3e3e0] dark:border-[#3E3E3A] transition-all hover:shadow-2xl hover:shadow-[#0E6BFD]/10">
                                    <div className="aspect-[4/3] bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 p-8 flex flex-col justify-end relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                        
                                        {/* Widget Preview for SWK */}
                                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3/4 max-w-[280px]">
                                            <div className="rounded-xl border border-[#3E3E3A]/30 bg-white/80 dark:bg-[#161615]/80 p-4 shadow-lg backdrop-blur-md transform transition-transform group-hover:-translate-y-2 group-hover:scale-105 duration-500">
                                                <div className="flex items-center justify-between border-b border-[#e3e3e0] dark:border-[#3E3E3A] pb-2 mb-3">
                                                    <span className="text-xs font-semibold text-[#706f6c] dark:text-[#A1A09A]">Laba Hari Ini</span>
                                                    <span className="text-xs text-[#0E6BFD] font-bold">+15%</span>
                                                </div>
                                                <div className="text-2xl font-bold mb-1">Rp 450.000</div>
                                                <div className="flex gap-2 mt-3">
                                                    <div className="h-2 w-1/3 rounded-full bg-[#0E6BFD]"></div>
                                                    <div className="h-2 w-2/3 rounded-full bg-[#dbdbd7] dark:bg-[#3E3E3A]"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl p-6 border border-[#e3e3e0] dark:border-[#3E3E3A] text-center">
                                            <h3 className="text-2xl font-bold mb-1">Pemilik Warung (SWK)</h3>
                                            <p className="text-sm font-medium text-[#0E6BFD] mb-3 uppercase tracking-wider">Lelah merekap nota setiap malam?</p>
                                            <p className="text-[#706f6c] dark:text-[#A1A09A] text-sm">
                                                Ketahui laba harian seketika tanpa berhitung manual. Pisahkan uang bisnis dan pribadi secara instan melalui asisten suara.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Persona 2 */}
                                <div className="group relative overflow-hidden rounded-3xl bg-[#FDFDFC] dark:bg-[#050505] border border-[#e3e3e0] dark:border-[#3E3E3A] transition-all hover:shadow-2xl hover:shadow-[#0E6BFD]/10">
                                    <div className="aspect-[4/3] bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 p-8 flex flex-col justify-end relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
 
                                        {/* Widget Preview for Frozen Food */}
                                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3/4 max-w-[280px]">
                                            <div className="rounded-xl border border-[#3E3E3A]/30 bg-white/80 dark:bg-[#161615]/80 p-4 shadow-lg backdrop-blur-md transform transition-transform group-hover:-translate-y-2 group-hover:scale-105 duration-500">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="h-8 w-8 rounded bg-[#ff8c00]/20 flex items-center justify-center">
                                                        <AlertTriangle className="h-4 w-4 text-[#ff8c00]" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold">Sosis Sapi Premium</div>
                                                        <div className="text-[10px] text-[#706f6c] dark:text-[#A1A09A]">Batch #402</div>
                                                    </div>
                                                </div>
                                                <div className="rounded bg-[#ff8c00]/10 p-2 border border-[#ff8c00]/20">
                                                    <div className="text-xs font-bold text-[#ff8c00] text-center">Expired dalam 3 Hari</div>
                                                    <div className="text-[10px] text-center mt-1 dark:text-[#A1A09A]">Rekomendasi: Diskon 20%</div>
                                                </div>
                                            </div>
                                        </div>
 
                                        <div className="relative z-10 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl p-6 border border-[#e3e3e0] dark:border-[#3E3E3A] text-center">
                                            <h3 className="text-2xl font-bold mb-1">Produsen Frozen Food</h3>
                                            <p className="text-sm font-medium text-[#0E6BFD] mb-3 uppercase tracking-wider">Sering rugi karena stok kedaluwarsa?</p>
                                            <p className="text-[#706f6c] dark:text-[#A1A09A] text-sm">
                                                Lacak expired date per batch secara otonom. Jangan sampai rugi karena stok terbuang di dasar freezer akibat minimnya kontrol FIFO.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="relative overflow-hidden py-32 text-center">
                        <div className="absolute inset-0 bg-[#050505]"></div>
                        {/* Stars / Particles effect using CSS */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        
                        <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-8">
                            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                                Siap Meningkatkan<br />
                                <span className="text-[#0E6BFD]">Bisnis Anda?</span>
                            </h2>
                            <p className="mt-6 text-lg text-[#A1A09A]">
                                Bergabunglah dengan UMKM lainnya di Surabaya yang telah beralih ke masa depan pengelolaan keuangan yang cerdas.
                            </p>
                            <div className="mt-10">
                                <Link
                                    href={register()}
                                    className="inline-block rounded-full bg-[#0E6BFD] px-10 py-5 text-lg font-bold text-white shadow-[0_0_30px_rgba(14,107,253,0.3)] transition-all hover:scale-105 hover:bg-[#0C66F2] hover:shadow-[0_0_50px_rgba(14,107,253,0.5)]"
                                >
                                    Daftar Sekarang - Gratis!
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="bg-[#050505] py-12 border-t border-[#3E3E3A]/50">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <AppLogoIcon className="h-8 w-8" />
                            <span className="text-xl font-bold tracking-tight text-white">Cak Done</span>
                        </div>
                        <div className="flex gap-8 text-sm text-[#A1A09A]">
                            <Link href="/login" className="hover:text-white transition-colors">Masuk</Link>
                            <Link href="/register" className="hover:text-white transition-colors">Daftar</Link>
                            <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
                        </div>
                        <p className="text-sm text-[#A1A09A]">
                            &copy; 2026 Cak Done - Tim WesWayaeOnAktifDinyalakan.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
