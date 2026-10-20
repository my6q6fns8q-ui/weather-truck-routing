import { useEffect, useId, useState } from "react";
import type { Place } from "@/domain/types";
import { useTranslate } from "@/i18n";
import {
  type PickTarget,
  tripActions,
  useDraft,
  useNaming,
  usePicking,
} from "@/store";
import { usePlaceSearch } from "./usePlaceSearch";

interface Props {
  target: PickTarget;
  label: string;
}

const BLUR_GRACE_MS = 120;

export default function PlaceInput({ target, label }: Props) {
  const place = useDraft()[target];
  const picking = usePicking() === target;
  const naming = useNaming() === target;
  const t = useTranslate();

  const [text, setText] = useState(place?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputId = useId();
  const listId = useId();

  useEffect(() => {
    if (place) setText(place.label);
  }, [place]);

  const settled = !!place && text === place.label;
  const { options, status } = usePlaceSearch(text, !settled);

  const choose = (chosen: Place) => {
    setText(chosen.label);
    setOpen(false);
    tripActions.choosePlace(target, chosen);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open || !options.length) return;
    if (event.key === "ArrowDown")
      (event.preventDefault(), setActive((i) => (i + 1) % options.length));
    else if (event.key === "ArrowUp")
      (event.preventDefault(),
        setActive((i) => (i - 1 + options.length) % options.length));
    else if (event.key === "Enter")
      (event.preventDefault(), choose(options[active]));
    else if (event.key === "Escape") setOpen(false);
  };

  const showList =
    open && !settled && (options.length > 0 || status !== "idle");

  return (
    <div className="field place-input">
      <label htmlFor={inputId}>
        <span>{label}</span>
      </label>
      <div className="place-row">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={t("trip.searchPlaceholder")}
          value={text}
          aria-busy={naming}
          title={naming ? t("places.naming") : undefined}
          className={place ? "chosen" : ""}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            if (place) tripActions.setPlace(target, null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), BLUR_GRACE_MS)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className={`pick${picking ? " on" : ""}`}
          aria-pressed={picking}
          aria-label={picking ? t("trip.picking") : t("trip.pickOnMap")}
          title={picking ? t("trip.picking") : t("trip.pickOnMap")}
          onClick={() =>
            picking
              ? tripActions.cancelPicking()
              : tripActions.startPicking(target)
          }
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M8 1.6c-2.4 0-4.4 2-4.4 4.4 0 3.2 4.4 8.4 4.4 8.4s4.4-5.2 4.4-8.4c0-2.4-2-4.4-4.4-4.4Z"
              fill="currentColor"
            />
            <circle cx="8" cy="6" r="1.6" fill="#fff" />
          </svg>
        </button>
      </div>
      {showList && (
        <ul id={listId} role="listbox" className="suggestions">
          {options.map((option, index) => (
            <li
              key={`${option.lat},${option.lon}`}
              role="option"
              aria-selected={index === active}
              className={index === active ? "active" : ""}
              onMouseDown={() => choose(option)}
              onMouseEnter={() => setActive(index)}
            >
              {option.label}
            </li>
          ))}
          {status === "loading" && (
            <li className="hint">{t("places.searching")}</li>
          )}
          {status === "empty" && (
            <li className="hint">{t("places.noResults")}</li>
          )}
          {status === "error" && (
            <li className="hint">{t("places.unavailable")}</li>
          )}
        </ul>
      )}
    </div>
  );
}
