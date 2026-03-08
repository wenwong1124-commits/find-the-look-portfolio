import { Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavbarProps {
  savedCount: number;
}

export function Navbar({ savedCount }: NavbarProps) {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg tracking-[0.3em] font-light text-foreground uppercase" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          STYLECAPSULE
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/saved"
            className={cn(
              "relative p-2 rounded-full transition-colors hover:bg-secondary",
              location.pathname === "/saved" && "bg-secondary"
            )}
            aria-label="Saved outfits"
          >
            <Heart className="w-5 h-5 text-foreground" />
            {savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-warm text-warm-foreground text-[10px] flex items-center justify-center font-sans font-semibold">
                {savedCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
