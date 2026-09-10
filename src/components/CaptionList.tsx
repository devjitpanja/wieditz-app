"use client";

import { useState } from "react";
import { CaptionEntry } from "@/types";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

interface Props {
  captions: CaptionEntry[];
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  currentTime?: number;
}

export default function CaptionList({ captions, onUpdate, onDelete, currentTime = 0 }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const startEdit = (c: CaptionEntry) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const commitEdit = (id: string) => {
    if (editText.trim()) onUpdate(id, editText.trim());
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  if (captions.length === 0) {
    return (
      <div className="text-center text-white/30 text-sm py-10">
        No captions yet. Process a video to generate captions.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 custom-scroll">
      {captions.map((c) => {
        const isActive = currentTime >= c.start && currentTime <= c.end;
        const isEditing = editingId === c.id;

        return (
          <div
            key={c.id}
            className={cn(
              "group rounded-xl px-3 py-2.5 transition-all border",
              isActive
                ? "bg-violet-500/15 border-violet-500/40"
                : "bg-white/5 border-transparent hover:bg-white/8"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/40 tabular-nums font-mono">
                {formatTime(c.start)} → {formatTime(c.end)}
              </span>
              {!isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(c)}
                    className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="p-1 rounded-md hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="flex items-end gap-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 bg-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white resize-none outline-none border border-violet-500/50 min-h-[52px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(c.id); }
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => commitEdit(c.id)}
                    className="p-1.5 rounded-md bg-violet-500 hover:bg-violet-400 text-white transition-colors"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/80 leading-snug">{c.text}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
