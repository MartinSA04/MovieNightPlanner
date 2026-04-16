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
      <button className={buttonVariants({ size: "sm", variant: "secondary" })} onClick={() => setOpen(true)} type="button">
        Invite people
      </button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Invite people
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Share code or link
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Anyone with either option can join this group.
                </p>
              </div>

              <button
                aria-label="Close invite popup"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-900 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-white"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Ticket className="h-4 w-4" />
                  <span>Invite code</span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className={cn(inputClassName, "font-semibold uppercase tracking-[0.16em]")}
                    readOnly
                    value={inviteCode}
                  />
                  <button
                    className={buttonVariants({
                      size: "sm",
                      variant: copiedField === "code" ? "primary" : "secondary"
                    })}
                    onClick={() => handleCopy("code", inviteCode)}
                    type="button"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copiedField === "code" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Link2 className="h-4 w-4" />
                  <span>Invite link</span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input className={inputClassName} readOnly value={inviteLink} />
                  <button
                    className={buttonVariants({
                      size: "sm",
                      variant: copiedField === "link" ? "primary" : "secondary"
                    })}
                    onClick={() => handleCopy("link", inviteLink)}
                    type="button"
                  >
                    <Copy className="mr-2 h-4 w-4" />
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
