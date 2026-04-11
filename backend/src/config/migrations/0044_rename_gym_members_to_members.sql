-- Migration 0044: Rename gym_members table to members

-- First, rename the existing simple members table to members_old
RENAME TABLE members TO members_old;

-- Then rename gym_members to members
RENAME TABLE gym_members TO members;

-- Note: The old members table (now members_old) can be dropped later if not needed