import React, { useMemo } from "react";

// Hardcoded list of user IDs that should not see the widget
const HIDDEN_USERS = ["abc123", "bob42", "carol99"];

// Helper to extract a cookie value by name
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

// This is the reusable wrapper anyone can use
export const HideForUsers = ({ children }) => {
  const userId = useMemo(() => getCookie("UserID"), []);
  const isHidden = userId && HIDDEN_USERS.includes(userId);

  if (isHidden) return null;
  return <>{children}</>;
};
