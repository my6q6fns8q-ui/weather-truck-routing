import { useEffect, useId, useRef, useState } from "react";
import { searchPlaces } from "../api";
import type { Place } from "../types";

interface Props {
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
}

export default function PlaceInput({ label, value, onChange }: Props) {
  const [text, setText] = useState(value?.label ?? "");
  const [options, setOptions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const listId = useId();
  const abort = useRef<AbortController>();

  useEffect(() => {
    if (value && text === value.label) return;
    const q = text.trim();
    if (q.length < 3) {
      setOptions([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const timer = setTimeout(async () => {
      abort.current?.abort();
      const ctl = (abort.current = new AbortController());
      try {
        const found = await searchPlaces(q, ctl.signal);
        setOptions(found);
        setActive(0);
        setStatus(found.length ? "idle" : "empty");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setStatus("error");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [text, value]);

  const choose = (place: Place) => {
    setText(place.label);
    setOpen(false);
    onChange(place);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !options.length) return;
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => (a + 1) % options.length));
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => (a - 1 + options.length) % options.length));
    else if (e.key === "Enter") (e.preventDefault(), choose(options[active]));
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="field place-input">
      <label>
        <span>{label}</span>
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Search"
          value={text}
          className={value ? "chosen" : ""}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
      </label>
      {open && (options.length > 0 || status !== "idle") && !(value && text === value.label) && (
        <ul id={listId} role="listbox" className="suggestions">
          {options.map((o, i) => (
            <li
              key={`${o.lat},${o.lon}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseDown={() => choose(o)}
              onMouseEnter={() => setActive(i)}
            >
              {o.label}
            </li>
          ))}
          {status === "loading" && <li className="hint">…</li>}
          {status === "empty" && <li className="hint">No results</li>}
          {status === "error" && <li className="hint">Unavailable</li>}
        </ul>
      )}
    </div>
  );
}
