// utils/formatDate.js
// Hàm tiện ích xử lý ngày tháng với Day.js

import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.locale('vi');

export const formatDate = (date, format = 'DD/MM/YYYY') =>
  dayjs(date).format(format);

export const formatDateTime = (date) =>
  dayjs(date).format('DD/MM/YYYY HH:mm');

export const formatRelative = (date) => dayjs(date).fromNow();

export const formatMonthYear = (date) => dayjs(date).format('MM/YYYY');

export const startOfMonth = (date) => dayjs(date).startOf('month');
export const endOfMonth = (date) => dayjs(date).endOf('month');

export const isSameMonth = (a, b) =>
  dayjs(a).isSame(dayjs(b), 'month');

export const getDaysInMonth = (date) => dayjs(date).daysInMonth();

export const getLast7Days = () =>
  Array.from({ length: 7 }, (_, i) =>
    dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'),
  );

export const getLast12Months = () =>
  Array.from({ length: 12 }, (_, i) =>
    dayjs().subtract(11 - i, 'month').format('YYYY-MM'),
  );

export default dayjs;
