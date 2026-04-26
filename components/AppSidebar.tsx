import { Database, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Scraper", url: "/", icon: Database },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar/40 backdrop-blur-2xl">
        {/* Brand */}
        <div className="h-20 flex items-center px-5 border-b border-sidebar-border">
          <div className="size-3 rounded-full bg-gradient-button shadow-glow-cyan shrink-0" />
          {!collapsed && (
            <div className="ml-3 flex flex-col leading-tight">
              <span className="text-base font-semibold text-foreground tracking-tight">
                LB Scraper
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                v2.4.1 · Online
              </span>
            </div>
          )}
        </div>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
              Módulos
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink
                      to={item.url}
                      end
                      className="relative rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="!bg-sidebar-accent !text-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:rounded-r-full before:bg-primary before:shadow-glow-cyan"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="glass-panel rounded-xl p-3 flex items-center gap-3">
              <div className="size-2 rounded-full bg-log-success animate-pulse" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-foreground font-medium truncate">
                  LaunchBox Pro
                </span>
                <span className="text-[10px] font-mono text-muted-foreground truncate">
                  Conexão segura
                </span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
