import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export function SidebarAppearanceToggle() {
    const [mounted, setMounted] = useState(false);
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { state } = useSidebar();
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = resolvedAppearance === 'dark';
    const isCollapsed = state === 'collapsed';

    if (!mounted) {
        return <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />;
    }

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    const toggleContent = (
        <div 
            onClick={toggleTheme}
            className={cn(
                "flex items-center cursor-pointer transition-all duration-300",
                isCollapsed 
                    ? "justify-center h-9 w-9 rounded-lg bg-muted border border-border hover:bg-accent" 
                    : "justify-between w-full px-4 py-3 rounded-xl bg-accent/50 border border-border hover:bg-accent",
                !isCollapsed && (isDark 
                    ? "bg-muted border border-border text-foreground" 
                    : "bg-accent/50 border border-border text-accent-foreground")
            )}
        >
            <div className={cn("flex items-center gap-3", isCollapsed && "gap-0")}>
                {isDark ? (
                    <Moon className="h-5 w-5 text-primary" />
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
                    isDark ? "bg-primary/20" : "bg-primary"
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
