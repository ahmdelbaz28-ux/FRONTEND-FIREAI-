import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EventLog } from "../EventLog";

describe("EventLog Component", () => {
  it("should block export on sudden disconnect", () => {
    const eventLogs = ["System running", "Critical Alert"];
    
    // Use React.createElement instead of JSX to avoid parser issues
    render(React.createElement(EventLog, { 
      eventLogs, 
      dataMode: "live", 
      connectionStatus: "disconnected" 
    }));
    
    const button = screen.getByText("Export JSON");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Unavailable in Simulation Mode or Disconnected");
  });
});
