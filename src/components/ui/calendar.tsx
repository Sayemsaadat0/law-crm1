import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";
import "react-day-picker/style.css";

import { cn, formatCalendarMonthShort, formatIsoDateInput } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-white dark:bg-gray-800 group/calendar p-3 rounded-lg [--cell-size:2.15rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => formatCalendarMonthShort(date),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1.5 w-full shrink-0 mb-1.5 px-0.5 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 aria-disabled:opacity-50 p-0 select-none rounded-md",
          "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100",
          "border border-gray-200 dark:border-gray-700",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 aria-disabled:opacity-50 p-0 select-none rounded-md",
          "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100",
          "border border-gray-200 dark:border-gray-700",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex w-full flex-col items-center justify-center gap-1.5 min-h-8 mb-1.5 px-0.5",
          defaultClassNames.month_caption
        ),
        // Month + year pickers sit in one row; gap matches --rdp-dropdown-gap from library CSS
        dropdowns: cn(
          "relative inline-flex w-full max-w-full flex-wrap items-center justify-center gap-2 sm:gap-3",
          defaultClassNames.dropdowns
        ),
        // Visible “pill”: native <select> is invisible and layered on top (see `dropdown`)
        dropdown_root: cn(
          "relative inline-flex min-h-8 shrink-0 items-stretch justify-center",
          "min-w-[7.25rem] rounded-lg border border-gray-300 bg-white shadow-sm",
          "text-gray-900 transition-colors",
          "hover:border-gray-400",
          "focus-within:border-primary-green focus-within:ring-2 focus-within:ring-primary-green/25",
          "dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500",
          defaultClassNames.dropdown_root
        ),
        // Native <select> must stay an invisible full-area overlay (see react-day-picker Dropdown)
        dropdown: cn(
          "absolute inset-0 z-[3] m-0 h-full w-full min-w-0 cursor-pointer",
          "appearance-none border-0 bg-transparent p-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-semibold text-gray-900 dark:text-gray-100",
          captionLayout === "label"
            ? "text-base"
            : [
                "relative z-[1] inline-flex h-8 min-h-8 w-full items-center justify-center gap-1.5",
                "pointer-events-none whitespace-nowrap px-2.5 text-xs",
                "[&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-gray-500",
              ],
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse mt-1.5",
        weekdays: cn("flex mb-0.5", defaultClassNames.weekdays),
        weekday: cn(
          "text-gray-600 dark:text-gray-400 rounded-md flex-1 font-semibold text-[11px] select-none py-1.5",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full gap-1", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold rounded-md",
          defaultClassNames.today
        ),
        outside: cn(
          "text-gray-400 dark:text-gray-500 aria-selected:text-gray-400 dark:aria-selected:text-gray-500",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-gray-300 dark:text-gray-600 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      // ref={ref}
      variant="ghost"
      size="icon"
      data-day={formatIsoDateInput(day.date)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary-green data-[selected-single=true]:text-gray-900 data-[selected-single=true]:font-semibold",
        "data-[range-middle=true]:bg-gray-100 data-[range-middle=true]:text-gray-900 dark:data-[range-middle=true]:bg-gray-700 dark:data-[range-middle=true]:text-gray-100",
        "data-[range-start=true]:bg-primary-green data-[range-start=true]:text-gray-900",
        "data-[range-end=true]:bg-primary-green data-[range-end=true]:text-gray-900",
        "text-gray-900 dark:text-gray-100 font-medium",
        "group-data-[focused=true]/day:border-2 group-data-[focused=true]/day:border-primary-green group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-primary-green/20",
        "hover:bg-gray-100 dark:hover:bg-gray-700 hover:rounded-md transition-colors",
        "aspect-square size-auto w-full h-8 flex items-center justify-center leading-none rounded-md",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
        "[&>span]:text-xs [&>span]:font-medium",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
