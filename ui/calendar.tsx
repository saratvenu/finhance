"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DayPicker,
  type DayPickerProps,
} from "react-day-picker";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CalendarProps = DayPickerProps & {
  className?: string;
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button:
          "h-7 w-7 rounded-md border border-default-300 bg-transparent p-0 text-default-500 hover:bg-default-100 hover:text-default-900 transition",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "w-8 text-[0.8rem] font-normal text-default-500 text-center",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:z-20",
          props.mode === "range"
            ? "[&:has(.day-range-end)]:rounded-r-md [&:has(.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day:
          "h-8 w-8 rounded-md p-0 font-normal text-default-900 hover:bg-default-100 aria-selected:opacity-100 transition",
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary focus:bg-primary",
        day_today:
          "bg-default-200 text-default-900",
        day_outside:
          "text-default-400 aria-selected:bg-default-200 aria-selected:text-default-500",
        day_disabled:
          "text-default-400 opacity-50",
        day_range_middle:
          "aria-selected:bg-default-100 aria-selected:text-default-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: (buttonProps) => (
          <button {...buttonProps} type="button">
            <ChevronLeft className="h-4 w-4" />
          </button>
        ),
        NextMonthButton: (buttonProps) => (
          <button {...buttonProps} type="button">
            <ChevronRight className="h-4 w-4" />
          </button>
        ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";
