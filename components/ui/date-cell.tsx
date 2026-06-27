import { format } from "date-fns-jalali";

const DateCell = ({ date }: { date?: Date | string | null }) => {
  if (!date) return "-";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return format(parsedDate, "d MMMM HH:mm");
};

export default DateCell;
