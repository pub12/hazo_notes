"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HiHome,
  HiDocumentText,
  HiPaperClip,
  HiSave,
  HiCollection,
  HiBeaker,
  HiViewGrid,
  HiMenu,
} from "react-icons/hi";

const nav_items = [
  {
    title: "Home",
    href: "/",
    icon: HiHome,
    group: "general",
  },
  {
    title: "Basic Notes",
    href: "/notes/basic",
    icon: HiDocumentText,
    group: "popover",
    description: "Simple note creation with popover",
  },
  {
    title: "Popover Style",
    href: "/notes/popover",
    icon: HiDocumentText,
    group: "popover",
    description: "Popover panel configuration",
  },
  {
    title: "Slide Panel",
    href: "/notes/slide-panel",
    icon: HiMenu,
    group: "slide",
    description: "Slide-out panel style",
  },
  {
    title: "With Files",
    href: "/notes/with-files",
    icon: HiPaperClip,
    group: "files",
    description: "File attachments demo",
  },
  {
    title: "Auto-Save",
    href: "/notes/auto-save",
    icon: HiSave,
    group: "modes",
    description: "Auto-save on blur",
  },
  {
    title: "Multiple",
    href: "/notes/multiple",
    icon: HiCollection,
    group: "advanced",
    description: "Multiple instances",
  },
  {
    title: "Integration",
    href: "/notes/integration",
    icon: HiBeaker,
    group: "advanced",
    description: "Full integration test",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const general_items = nav_items.filter((item) => item.group === "general");
  const notes_items = nav_items.filter((item) => item.group !== "general");

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <HiViewGrid className="h-6 w-6 text-amber-500 mr-2" />
        <h2 className="text-lg font-semibold">Hazo Notes</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {/* General */}
        <div className="mb-4">
          {general_items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-1",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 mr-2" />
                {item.title}
              </Link>
            );
          })}
        </div>

        {/* Separator */}
        <div className="border-t border-border my-4" />

        {/* Test Scenarios */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Test Scenarios
          </p>
          {notes_items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-1",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                title={item.description}
              >
                <Icon className="h-5 w-5 mr-2" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          hazo_notes v1.0.0
        </p>
      </div>
    </div>
  );
}
