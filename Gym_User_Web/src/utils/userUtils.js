export const resolveUserId = (user) => {
  if (!user) return null;
  return (
    user.id ||
    user.userId ||
    user.user_id ||
    user.memberId ||
    user.member_id ||
    null
  );
};
