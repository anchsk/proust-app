"use client";
import Link from "next/link";
import { SquarePenIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Entry } from "@/lib/history";

type SearchHistoryProps = {
  entries: Entry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewSearch: () => void;
  onClearHistory: () => void;
};

export function SearchHistory({ entries, activeId, onSelect, onNewSearch, onClearHistory }: SearchHistoryProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  // On mobile the sidebar is a drawer; close it once the user has picked where to go
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const goHome = () => {
    onNewSearch();
    closeOnMobile();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        {/* A real link so it can still be opened in a new tab; in-app clicks reset in place */}
        <Link
          href="/"
          onNavigate={(e) => {
            e.preventDefault();
            goHome();
          }}
          className="self-start rounded-md px-2 pt-1 font-medium text-sm outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          Proust Recherche
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={goHome}>
              <SquarePenIcon />
              New search
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            {entries.length === 0 ? (
              <p className="px-2 text-muted-foreground text-xs">Your searches will appear here.</p>
            ) : (
              <SidebarMenu>
                {entries.toReversed().map((entry) => (
                  <SidebarMenuItem key={entry.id}>
                    <SidebarMenuButton
                      isActive={entry.id === activeId}
                      onClick={() => { onSelect(entry.id); closeOnMobile(); }}
                    >
                      <span className="truncate">{entry.question}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {entries.length > 0 && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton className="text-muted-foreground">
                    <Trash2Icon />
                    Clear history
                  </SidebarMenuButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear search history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All {entries.length} saved {entries.length === 1 ? "search" : "searches"} and their answers
                      will be removed from this browser. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => { onClearHistory(); closeOnMobile(); }}>
                      Clear history
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
