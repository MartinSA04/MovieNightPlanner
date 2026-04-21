"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Ticket, X } from "lucide-react";
import { buttonVariants, cn, inputClassName } from "@movie-night/ui";

interface GroupInviteDialogProps {
  inviteCode: string;
  inviteLink: string;
}

async function writeToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.focus();
  input.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(input);
  }
}

export function GroupInviteDialog({ inviteCode, inviteLink }: GroupInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copiedField) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedField(null);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedField]);

  async function handleCopy(field: "code" | "link", value: string) {
    const copied = await writeToClipboard(value);

    if (copied) {
      setCopiedField(field);
    }
  }

  return (
    <>
      <button
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={() => setOpen(true)}
        type="button"
      >
        Invite people
      </button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Invite people
                </h2>
                <p className="text-sm text-muted-foreground">
                  Share the code or link with anyone you want to invite.
                </p>
              </div>

              <button
                aria-label="Close invite popup"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "h-9 w-9 px-0"
                )}
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  htmlFor="invite-code-input"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  Invite code
                </label>
                <div className="flex gap-2">
                  <input
                    id="invite-code-input"
                    className={cn(inputClassName, "font-semibold uppercase tracking-[0.16em]")}
                    readOnly
                    value={inviteCode}
                  />
                  <button
                    aria-label="Copy invite code"
                    className={buttonVariants({
                      size: "sm",
                      variant: copiedField === "code" ? "primary" : "outline"
                    })}
                    onClick={() => handleCopy("code", inviteCode)}
                    type="button"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedField === "code" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  htmlFor="invite-link-input"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Invite link
                </label>
                <div className="flex gap-2">
                  <input
                    id="invite-link-input"
                    className={inputClassName}
                    readOnly
                    value={inviteLink}
                  />
                  <button
                    aria-label="Copy invite link"
                    className={buttonVariants({
                      size: "sm",
                      variant: copiedField === "link" ? "primary" : "outline"
                    })}
                    onClick={() => handleCopy("link", inviteLink)}
                    type="button"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedField === "link" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
