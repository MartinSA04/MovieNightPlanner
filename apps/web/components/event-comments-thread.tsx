"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { buttonVariants, cn, inputClassName } from "@movie-night/ui";

interface EventCommentItem {
  authorAvatarUrl: string | null;
  authorDisplayName: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  id: string;
  updatedAt: string;
}

interface EventCommentsThreadProps {
  currentUserId: string;
  eventId: string;
  initialComments: EventCommentItem[];
}

interface CommentMutationResponse {
  comment?: EventCommentItem;
  error?: string;
  status?: "deleted";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const source = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return source.toUpperCase();
}

export function EventCommentsThread({
  currentUserId,
  eventId,
  initialComments
}: EventCommentsThreadProps) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  async function handlePost() {
    const trimmed = body.trim();
    if (!trimmed || isPosting) return;

    setIsPosting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed })
      });
      const payload = (await response.json().catch(() => null)) as CommentMutationResponse | null;

      if (!response.ok || !payload?.comment) {
        setError(payload?.error ?? "Could not post comment.");
        return;
      }

      setComments((current) => [...current, payload.comment!]);
      setBody("");
      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 0);
    } catch {
      setError("Could not post comment.");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;

    setIsDeleting(commentId);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/comments/${commentId}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => null)) as CommentMutationResponse | null;

      if (!response.ok) {
        setError(payload?.error ?? "Could not delete comment.");
        return;
      }

      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch {
      setError("Could not delete comment.");
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      {comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const canDelete = comment.authorUserId === currentUserId;
            return (
              <li
                key={comment.id}
                className="flex gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3"
              >
                <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-secondary text-xs font-semibold text-foreground">
                  {comment.authorAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      src={comment.authorAvatarUrl}
                    />
                  ) : (
                    getInitials(comment.authorDisplayName)
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      {comment.authorDisplayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(comment.createdAt)}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground/90">
                    {comment.body}
                  </p>
                </div>

                {canDelete ? (
                  <button
                    aria-label="Delete comment"
                    className={cn(
                      buttonVariants({ size: "sm", variant: "ghost" }),
                      "h-8 w-8 px-0 text-muted-foreground"
                    )}
                    disabled={isDeleting === comment.id}
                    onClick={() => void handleDelete(comment.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
          No comments yet. Start the conversation.
        </div>
      )}

      <div ref={listEndRef} />

      <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3">
        <textarea
          className={cn(inputClassName, "min-h-[5.5rem] resize-none py-2.5")}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void handlePost();
            }
          }}
          placeholder="Share a thought, a vote case, or a plot warning…"
          value={body}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</p>
          <button
            className={buttonVariants({ size: "sm" })}
            disabled={isPosting || body.trim().length === 0}
            onClick={() => void handlePost()}
            type="button"
          >
            <Send className="h-4 w-4" />
            {isPosting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
