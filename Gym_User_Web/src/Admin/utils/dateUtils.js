import dayjs from "dayjs";

export const getDateRangeBounds = (type, customRange = null) => {
  const now = dayjs();
  let start, end;

  switch (type) {
    case 'Today':
      start = now.startOf('day');
      end = now.endOf('day');
      break;
    case 'Yesterday':
      start = now.subtract(1, 'day').startOf('day');
      end = now.subtract(1, 'day').endOf('day');
      break;
    case 'This Week':
      start = now.startOf('week');
      end = now.endOf('week');
      break;
    case 'This Month':
      start = now.startOf('month');
      end = now.endOf('month');
      break;
    case 'Custom':
      if (customRange && customRange.start && customRange.end) {
        start = dayjs(customRange.start).startOf('day');
        end = dayjs(customRange.end).endOf('day');
      } else {
        start = null;
        end = null;
      }
      break;
    default:
      start = null;
      end = null;
  }

  return { start, end };
};

export const filterByDateRange = (data, dateField, type, customRange = null) => {
  if (type === 'All Time') return data;
  
  const { start, end } = getDateRangeBounds(type, customRange);
  if (!start || !end) return data;

  return data.filter(item => {
    const d = dayjs(item[dateField]);
    return d.isAfter(start) && d.isBefore(end);
  });
};
