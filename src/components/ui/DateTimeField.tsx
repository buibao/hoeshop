"use client";
import { useId, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { DayPicker } from "@daypicker/react";
import { vi } from "@daypicker/react/locale";
import {
  CalendarDays,
  Clock3,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  calendarDate,
  calendarIso,
  dateError,
  displayDate,
  parseDisplayDate,
} from "@/domain/date-time";
import { vietnamToday } from "@/domain/schemas";
import { useStoreOverlay } from "@/components/StoreScope";
type Props = {
  name: string;
  label: string;
  type: "date" | "time";
  defaultValue?: string | number;
  hint?: string;
  errors?: Record<string, string>;
  required?: boolean;
  disabled?: boolean;
};
export function DateTimeField({
  name,
  label,
  type,
  defaultValue = "",
  hint,
  errors,
  required,
  disabled,
}: Props) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    hidden = useRef<HTMLInputElement>(null),
    returnFocus = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(
      type === "date"
        ? displayDate(String(defaultValue))
        : String(defaultValue),
    ),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    [draft, setDraft] = useState(""),
    [month, setMonth] = useState(() =>
      calendarDate(
        type === "date" && defaultValue ? String(defaultValue) : vietnamToday(),
      ),
    );
  const [position, setPosition] = useState({ left: 20, top: 80 });
  const portalClassName = useStoreOverlay(show);
  const serverError = errors?.[name],
    feedback = error || serverError;
  const iso = type === "date" ? parseDisplayDate(value) : null;
  function commit(next: string) {
    const canonical =
      type === "date" ? (next ? parseDisplayDate(next) || next : "") : next;
    setValue(next);
    setError("");
    if (hidden.current) {
      hidden.current.value = canonical;
      hidden.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
    // React form handlers must see the update even though the value field is hidden.
    input.current
      ?.closest("form")
      ?.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function open(origin: "input" | "button" = "button") {
    returnFocus.current = origin === "input" ? input.current : trigger.current;
    const rect = input.current?.getBoundingClientRect();
    if (rect)
      setPosition({
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 366)),
        top: Math.max(12, Math.min(rect.bottom + 10, window.innerHeight - 490)),
      });
    setDraft(
      type === "time" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
        ? value
        : type === "time"
          ? "09:00"
          : iso || "",
    );
    if (type === "date") setMonth(calendarDate(iso || vietnamToday()));
    setShow(true);
  }
  function close() {
    setShow(false);
  }
  const hour = draft.slice(0, 2),
    minute = draft.slice(3, 5);
  function timeKey(
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    count: number,
  ) {
    let next = index;
    if (e.key === "ArrowDown") next = (index + 1) % count;
    else if (e.key === "ArrowUp") next = (index + count - 1) % count;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else return;
    e.preventDefault();
    const list = e.currentTarget.parentElement;
    const button = list?.querySelectorAll<HTMLButtonElement>("button")[next];
    button?.focus();
    button?.click();
  }
  return (
    <div className="field hoe-widget date-time-field">
      <label htmlFor={id}>
        {label}
        {required ? (
          <span className="required-mark" aria-hidden="true" />
        ) : null}
      </label>
      <div className="date-time-input">
        <input
          ref={input}
          id={id}
          type="text"
          value={value}
          placeholder={type === "date" ? "dd/mm/yyyy" : "hh:mm"}
          disabled={disabled}
          required={required}
          inputMode="numeric"
          maxLength={10}
          aria-invalid={!!feedback}
          aria-describedby={
            [hint ? id + "-hint" : "", feedback ? id + "-error" : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          onChange={(e) => commit(e.target.value)}
          onBlur={() =>
            setError(
              value
                ? type === "date"
                  ? dateError(value)
                  : /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
                    ? ""
                    : "Nhập giờ 24 giờ theo dạng hh:mm."
                : "",
            )
          }
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && e.altKey) {
              e.preventDefault();
              open("input");
            }
          }}
        />
        <button
          ref={trigger}
          type="button"
          className="picker-trigger"
          disabled={disabled}
          aria-label={
            type === "date" ? "Mở lịch: " + label : "Chọn giờ: " + label
          }
          aria-haspopup="dialog"
          aria-expanded={show}
          onClick={() => open()}
        >
          {type === "date" ? <CalendarDays size={20} /> : <Clock3 size={20} />}
        </button>
      </div>
      <input
        ref={hidden}
        type="hidden"
        name={name}
        data-focus-target={id}
        value={
          type === "date"
            ? value
              ? parseDisplayDate(value) || value
              : ""
            : value
        }
      />
      {hint ? (
        <span id={id + "-hint"} className="field-hint">
          {hint}
        </span>
      ) : null}
      {feedback ? (
        <span id={id + "-error"} className="required small" role="alert">
          {feedback}
        </span>
      ) : null}
      <Modal
        show={show}
        onHide={close}
        onEntered={() => {
          const dialog = document
            .getElementById(id + "-title")
            ?.closest<HTMLElement>(".modal-dialog");
          if (!dialog) return;
          if (window.innerWidth >= 768)
            setPosition((previous) => ({
              ...previous,
              top: Math.max(
                12,
                Math.min(
                  previous.top,
                  window.innerHeight -
                    dialog.getBoundingClientRect().height -
                    12,
                ),
              ),
            }));
          if (type === "time") {
            const selected = dialog.querySelectorAll<HTMLButtonElement>(
              '[role="option"][aria-selected="true"]',
            );
            selected.forEach((button) =>
              button.scrollIntoView({ block: "center" }),
            );
            selected[0]?.focus();
          }
        }}
        restoreFocus={false}
        onExited={() => returnFocus.current?.focus()}
        className={`hoe-widget hoe-picker ${portalClassName}`}
        dialogClassName="hoe-picker-dialog"
        backdropClassName="hoe-picker-backdrop"
        aria-labelledby={id + "-title"}
        style={
          {
            "--picker-left": position.left + "px",
            "--picker-top": position.top + "px",
          } as React.CSSProperties
        }
      >
        <Modal.Header>
          <div>
            <span className="eyebrow">MỘT NGÀY DỊU DÀNG</span>
            <Modal.Title id={id + "-title"}>
              {type === "date" ? "Chọn ngày mong muốn" : "Chọn giờ mong muốn"}
            </Modal.Title>
          </div>
          <button
            type="button"
            className="picker-close"
            aria-label="Đóng bộ chọn"
            onClick={close}
          >
            <X size={20} />
          </button>
        </Modal.Header>
        <Modal.Body>
          {type === "date" ? (
            <>
              <DayPicker
                mode="single"
                locale={vi}
                weekStartsOn={1}
                month={month}
                onMonthChange={setMonth}
                selected={draft ? calendarDate(draft) : undefined}
                onSelect={(date) => setDraft(date ? calendarIso(date) : "")}
                disabled={{ before: calendarDate(vietnamToday()) }}
                autoFocus
                className="hoe-calendar"
                classNames={{
                  day_button: "hoe-day-button",
                  selected: "hoe-day-selected",
                  today: "hoe-day-today",
                  disabled: "hoe-day-disabled",
                  month_caption: "hoe-month-caption",
                  weekdays: "hoe-weekdays",
                  weekday: "hoe-weekday",
                  month_grid: "hoe-month-grid",
                  nav: "hoe-calendar-nav",
                  button_previous: "hoe-month-button",
                  button_next: "hoe-month-button",
                }}
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === "left" ? (
                      <ChevronLeft size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    ),
                }}
                labels={{
                  labelNext: () => "Tháng sau",
                  labelPrevious: () => "Tháng trước",
                  labelGrid: (date) =>
                    "Lịch tháng " +
                    (date.getMonth() + 1) +
                    ", năm " +
                    date.getFullYear(),
                  labelDayButton: (date, modifiers) =>
                    `${date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${modifiers.selected ? ", đã chọn" : ""}`,
                }}
              />
              <button
                type="button"
                className="link-button picker-today"
                onClick={() => {
                  setDraft(vietnamToday());
                  setMonth(calendarDate(vietnamToday()));
                }}
              >
                Chọn hôm nay
              </button>
            </>
          ) : (
            <div className="time-columns">
              {[
                { label: "Giờ", count: 24, current: hour },
                { label: "Phút", count: 60, current: minute },
              ].map((column, c) => (
                <div key={column.label}>
                  <div className="time-column-label">{column.label}</div>
                  <div
                    className="time-list"
                    role="listbox"
                    aria-label={column.label}
                  >
                    {Array.from({ length: column.count }, (_, n) => {
                      const v = String(n).padStart(2, "0");
                      return (
                        <button
                          type="button"
                          role="option"
                          aria-selected={column.current === v}
                          tabIndex={column.current === v ? 0 : -1}
                          key={v}
                          onFocus={(e) =>
                            e.currentTarget.scrollIntoView({ block: "nearest" })
                          }
                          onKeyDown={(e) => timeKey(e, n, column.count)}
                          onClick={() =>
                            setDraft(
                              c === 0 ? v + ":" + minute : hour + ":" + v,
                            )
                          }
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="picker-note" aria-live="polite">
            {draft
              ? type === "date"
                ? "Ngày bạn chọn: " + displayDate(draft)
                : "Giờ bạn chọn: " + draft
              : "Bạn chưa chọn ngày."}
            <br />
            Shop sẽ liên hệ xác nhận lịch nhận hoa.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              commit("");
              close();
            }}
          >
            Xóa lựa chọn
          </button>
          <div className="picker-actions">
            <button type="button" className="button secondary" onClick={close}>
              Hủy
            </button>
            <button
              type="button"
              className="button"
              disabled={!draft}
              onClick={() => {
                commit(type === "date" ? displayDate(draft) : draft);
                close();
              }}
            >
              Xác nhận
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
