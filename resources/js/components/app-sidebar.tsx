import { Link, usePage } from '@inertiajs/react';
import { FileText, LayoutGrid, Package, ReceiptText, Sparkles } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { SidebarAppearanceToggle } from '@/components/sidebar-appearance-toggle';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import * as ai from '@/routes/catat';
import * as inventory from '@/routes/inventory';
import * as reports from '@/routes/reports';
import * as transactions from '@/routes/transactions';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const currentTeamSlug = page.props.currentTeam?.slug;
    const dashboardUrl = currentTeamSlug ? dashboard.url(currentTeamSlug) : '/';
    const inventoryUrl = currentTeamSlug ? inventory.index.url(currentTeamSlug) : '#';
    const transactionsUrl = currentTeamSlug ? transactions.index.url(currentTeamSlug) : '#';
    const catatUrl = currentTeamSlug ? ai.index.url(currentTeamSlug) : '#';
    const cashflowUrl = currentTeamSlug ? reports.cashflow.url(currentTeamSlug) : '#';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
        {
            title: 'Transaksi',
            href: transactionsUrl,
            icon: ReceiptText,
        },
        {
            title: 'AI Insights',
            href: catatUrl,
            icon: Sparkles,
        },
        {
            title: 'Laporan Kas',
            href: cashflowUrl,
            icon: FileText,
        },
        {
            title: 'Inventory',
            href: inventoryUrl,
            icon: Package,
        },
    ];

    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <SidebarAppearanceToggle />
                
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
