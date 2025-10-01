//app/layout.tsx

import "./globals.css";
import Providers from "./providers";
import Link from "next/link";
import WhoAmI from "./_components/whoami";

// shadcn/ui dropdown
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50">
        <Providers>
          <header className="w-full border-b bg-white">
            <div className="mx-auto max-w-5xl flex items-center justify-between p-3">
              <div className="flex items-center gap-4">
                <Link href="/" className="font-semibold">
                  ISMS-App
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 text-sm text-neutral-700"
                    >
                      Owner
                      <span className="ml-1 inline-block align-middle">▾</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/people">People</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ownership">Teams</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 text-sm text-neutral-700"
                    >
                      Assets
                      <span className="ml-1 inline-block align-middle">▾</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-neutral-500">
                      Core Assets
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/assets/processes">Processes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/assets/applications">Applications</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/assets/systems">Systems</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/assets/data">Data</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/assets/locations">Locations</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/assets/connections">Connections</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                <WhoAmI />
                <AuthButtons />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-5xl p-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <ClientAuthButtons />
    </div>
  );
}

// Inline a tiny client wrapper
function ClientAuthButtons() {
  // Mark as client
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const Comp = require("./login/_client-auth-buttons").default;
  return <Comp />;
}
