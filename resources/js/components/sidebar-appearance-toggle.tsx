import { Moon, Sun } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export function SidebarAppearanceToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { state } = useSidebar();
    const isDark = resolvedAppearance === 'dark';
    const isCollapsed = state === 'collapsed';

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    const toggleContent = (
        <div 
            onClick={toggleTheme}
            className={cn(
                "flex items-center cursor-pointer transition-all duration-300",
                isCollapsed 
                    ? "justify-center h-9 w-9 rounded-lg bg-slate-800/50 border border-slate-700/50" 
                    : "justify-between w-full px-4 py-3 rounded-xl bg-blue-50/50 border border-blue-100/50",
                !isCollapsed && (isDark 
                    ? "bg-slate-800/50 border border-slate-700/50 text-slate-100" 
                    : "bg-blue-50/50 border border-blue-100/50 text-blue-900")
            )}
        >
            <div className={cn("flex items-center gap-3", isCollapsed && "gap-0")}>
                {isDark ? (
                    <Moon className="h-5 w-5 text-blue-400" />
                ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                )}
                {!isCollapsed && (
                    <span className="font-semibold text-sm">
                        {isDark ? 'Mode Gelap' : 'Mode Terang'}
                    </span>
                )}
            </div>

            {!isCollapsed && (
                <div className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    isDark ? "bg-slate-700" : "bg-emerald-500"
                )}>
                    <span
                        aria-hidden="true"
                        className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            isDark ? "translate-x-0" : "translate-x-5"
                        )}
                    />
                </div>
            )}
        </div>
    );

    if (isCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {toggleContent}
                </TooltipTrigger>
                <TooltipContent side="right">
                    {isDark ? 'Mode Terang' : 'Mode Gelap'}
                </TooltipContent>
            </Tooltip>
        );
    }

    return toggleContent;
}
