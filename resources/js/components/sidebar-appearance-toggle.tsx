import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export function SidebarAppearanceToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <div 
            onClick={toggleTheme}
            className={cn(
                "flex items-center justify-between w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-300",
                isDark 
                    ? "bg-slate-800/50 border border-slate-700/50 text-slate-100" 
                    : "bg-blue-50/50 border border-blue-100/50 text-blue-900"
            )}
        >
            <div className="flex items-center gap-3">
                {isDark ? (
                    <Moon className="h-5 w-5 text-blue-400" />
                ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-semibold text-sm">
                    {isDark ? 'Mode Gelap' : 'Mode Terang'}
                </span>
            </div>

            {/* Custom Toggle Switch */}
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
        </div>
    );
}
