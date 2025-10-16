import React, { useMemo } from "react";

// Hardcoded list of users for whom the widget should be hidden
const HIDDEN_USERS = ["abc123", "bob42", "carol99"];

// Simple helper function to read a cookie value
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

// Main widget component
export const HiddenWidget = () => {
  // Read user ID from cookie only once when component mounts
  const userId = useMemo(() => getCookie("UserID"), []);
  const isHidden = userId && HIDDEN_USERS.includes(userId);

  if (isHidden) return null; // Hide the widget entirely

  return (
    <div className="widget" style={{ padding: "1em", border: "1px solid #ccc" }}>
      <h3>Welcome!</h3>
      <p>Your User ID is: {userId ?? "Unknown"}</p>
    </div>
  );
};
