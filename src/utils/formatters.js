import { formatDistanceToNow, format } from 'date-fns';

export const formatTimestamp = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatTime = (date) => {
  return format(new Date(date), 'HH:mm');
};

export const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return format(messageDate, 'HH:mm');
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return format(messageDate, 'MMM dd');
  }
};