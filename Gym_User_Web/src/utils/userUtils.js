export const resolveUserId = (user) => {
  if (!user) return null;
  return (
    user.id ||
    user.userId ||
    user.user_id ||
    user.memberId ||
    user.member_id ||
    user.userUuid ||
    user.user_uuid ||
    user.memberUuid ||
    user.member_uuid ||
    user.uuid ||
    null
  );
};
