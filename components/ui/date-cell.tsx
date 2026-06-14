import { format } from "date-fns-jalali";

const DateCell = ({ date }: { date: Date }) => {
  try {
    return format(new Date(date), "d MMMM  HH:mm");
  } catch {
    return String(date ?? "");
  }
};

export default DateCell;
