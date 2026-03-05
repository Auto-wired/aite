"use client";

import { useState } from "react";
import Link from "next/link";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(d: Date) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function isToday(d: Date) {
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

type Cell = { date: string; day: number; isCurrentMonth: boolean; dateObj: Date };

function buildMonthCells(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: Cell[] = [];

  for (let i = 0; i < firstDay; i++) {
    const d = new Date(year, month, 1 - (firstDay - i));
    cells.push({
      date: formatDate(d),
      day: d.getDate(),
      isCurrentMonth: false,
      dateObj: d,
    });
  }
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    cells.push({
      date: formatDate(d),
      day: i,
      isCurrentMonth: true,
      dateObj: d,
    });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month, totalDays + i);
    cells.push({
      date: formatDate(d),
      day: d.getDate(),
      isCurrentMonth: false,
      dateObj: d,
    });
  }
  return cells;
}

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

type Props = { selectedDate?: string };

export function MonthCalendar({ selectedDate }: Props) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildMonthCells(year, month);

  const goPrev = () => {
    setViewDate(new Date(year, month - 1));
  };
  const goNext = () => {
    setViewDate(new Date(year, month + 1));
  };
  const goToday = () => {
    setViewDate(new Date());
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
      <div className="mb-2 flex shrink-0 items-center justify-between sm:mb-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
          {year}년 {MONTH_NAMES[month]}
        </h2>
        <div className="flex gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="이전 달"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(6,1fr)] gap-px text-center sm:gap-0.5">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="flex items-center justify-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500 sm:text-xs"
          >
            {name}
          </div>
        ))}
        {cells.map((cell) => {
          const today = isToday(cell.dateObj);
          const selected = selectedDate === cell.date;
          return (
            <Link
              key={cell.date}
              href={`/?date=${cell.date}`}
              className={`flex min-h-0 items-center justify-center rounded-md text-xs transition sm:text-sm
                ${today ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900" : ""}
                ${selected && !today ? "ring-2 ring-zinc-400 ring-inset dark:ring-zinc-500" : ""}
                ${!today && cell.isCurrentMonth ? "text-zinc-800 dark:text-zinc-200" : ""}
                ${!today && !cell.isCurrentMonth ? "text-zinc-400 dark:text-zinc-500" : ""}
                ${!today ? "hover:bg-zinc-100 dark:hover:bg-zinc-800/80" : ""}
              `}
            >
              {cell.day}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
