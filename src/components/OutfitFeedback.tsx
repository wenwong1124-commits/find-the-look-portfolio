import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface OutfitFeedbackData {
  vote: "up" | "down";
  tags: string[];
}

const POSITIVE_TAGS = ["love the style", "great fit", "perfect colors", "good value"];
const NEGATIVE_TAGS = ["too expensive", "wrong color", "not my vibe", "wrong occasion"];

interface OutfitFeedbackProps {
  feedback?: OutfitFeedbackData;
  onFeedback: (data: OutfitFeedbackData) => void;
}

export function OutfitFeedback({ feedback, onFeedback }: OutfitFeedbackProps) {
  const [localVote, setLocalVote] = useState<"up" | "down" | null>(feedback?.vote ?? null);
  const [localTags, setLocalTags] = useState<string[]>(feedback?.tags ?? []);

  const handleVote = (vote: "up" | "down") => {
    const newVote = localVote === vote ? null : vote;
    if (!newVote) {
      setLocalVote(null);
      setLocalTags([]);
      return;
    }
    setLocalVote(newVote);
    setLocalTags([]);
    onFeedback({ vote: newVote, tags: [] });
  };

  const toggleTag = (tag: string) => {
    if (!localVote) return;
    const newTags = localTags.includes(tag)
      ? localTags.filter((t) => t !== tag)
      : [...localTags, tag];
    setLocalTags(newTags);
    onFeedback({ vote: localVote, tags: newTags });
  };

  const tags = localVote === "up" ? POSITIVE_TAGS : localVote === "down" ? NEGATIVE_TAGS : [];

  return (
    <div className="px-4 py-3 border-t border-border space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-semibold text-muted-foreground font-sans uppercase tracking-wider mr-2">
          Rate this outfit
        </span>
        <button
          onClick={() => handleVote("up")}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            localVote === "up"
              ? "bg-accent/20 text-accent"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleVote("down")}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            localVote === "down"
              ? "bg-destructive/20 text-destructive"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
          aria-label="Thumbs down"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {localVote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 overflow-hidden"
          >
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full border transition-all font-sans",
                  localTags.includes(tag)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
