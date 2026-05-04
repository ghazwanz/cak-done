import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { FormEvent, useState } from 'react';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
// import { Link } from '@inertiajs/react';
// import AppLayout from '@/layouts/app-layout'; // Pastikan path ini sesuai dengan layout bawaan projectmu

interface Props {
    auth: {
        user: {
            name: string;
            email: string;
        };
    };
}

export default function Dashboard({ auth }: Props) {
    return (
        <>
            <Head title="Dashboard Utama - Cak DONE" />
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 bg-slate-50 relative h-full">

                <div className="max-w-7xl mx-auto space-y-8">


                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Ringkasan Finansial</h2>
                            <p className="text-sm text-slate-500 mt-1">Selamat datang kembali, {auth.user.name}</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-xs font-medium bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-200">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sinkronisasi Aktif
                        </div>
                    </div>




                    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                        <div className="absolute -right-10 -bottom-10 opacity-20 transform -rotate-12">
                            <i className="fas fa-robot text-[150px]"></i>
                        </div>

                        <div className="flex items-start gap-5 relative z-10 w-full lg:w-4/5">
                            <div className="bg-white/10 p-4 rounded-2xl shrink-0 text-amber-300 backdrop-blur-md border border-white/20">
                                <i className="fas fa-lightbulb text-3xl"></i>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl font-bold tracking-wide">Bisikan Strategis Cak DONE</h3>
                                    <span className="bg-blue-500/50 text-[10px] uppercase px-2 py-0.5 rounded border border-blue-400">Prediksi Arus Kas</span>
                                </div>
                                <p className="text-blue-50 leading-relaxed text-sm md:text-base font-medium">
                                    "Bos, Kas hari ini stabil. Tapi hati-hati, <strong className="text-amber-300">Stok Sosis Kanzler</strong> sisa 5 bungkus dan besok expired! Saran saya, buat promo Bundling hari ini untuk mempercepat penjualan sebelum rusak."
                                </p>
                            </div>
                        </div>
                    </div>



                    {/* ========================================== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Total Saldo Kas</p>
                                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><i className="fas fa-wallet text-lg"></i></div>
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">Rp 4.250.000</h3>
                            <p className="text-sm text-green-600 font-bold"><i className="fas fa-arrow-trend-up text-xs"></i> +12% <span className="text-slate-400 font-normal">vs minggu lalu</span></p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Pemasukan Hari Ini</p>
                                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl"><i className="fas fa-arrow-down text-lg"></i></div>
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">Rp 850.000</h3>
                            <p className="text-sm text-slate-400 font-medium"><i className="fas fa-receipt mr-1"></i> Dari 24 Transaksi</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Pengeluaran Hari Ini</p>
                                <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl"><i className="fas fa-arrow-up text-lg"></i></div>
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">Rp 320.000</h3>
                            <p className="text-sm text-slate-400 font-medium"><i className="fas fa-shopping-basket mr-1"></i> Belanja bahan baku</p>
                        </div>
                    </div>




                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">


                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <div className="bg-amber-100 text-amber-500 w-8 h-8 rounded-lg flex items-center justify-center"><i className="fas fa-clock"></i></div>
                                    Expiry Watchdog
                                </h3>
                            </div>
                            <div className="p-6 flex-1 space-y-4">

                                <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white text-rose-500 w-12 h-12 rounded-xl shadow-sm border border-rose-100 flex items-center justify-center text-xl">
                                            <i className="fas fa-hotdog"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">Sosis Sapi Kanzler</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">Sisa: <span className="font-bold text-slate-700">5 Bks</span></p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg animate-pulse">Besok Basi!</span>
                                </div>
                            </div>
                        </div>


                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center"><i className="fas fa-list-ul"></i></div>
                                    Jurnal Terakhir
                                </h3>
                            </div>
                            <div className="p-0 flex-1 overflow-x-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-50">
                                        <tr className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs"><i className="fas fa-microphone"></i></div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">Pesanan Gofood #882</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] border border-emerald-100 font-bold">Penjualan</span></td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600 text-sm">+ Rp 145.000</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
