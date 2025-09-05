import React from "react";
import ChartBar from "../components/ChartBar";

// A tiny mock so the chart has something to draw.
// Your component expects: fetchData(params.date_range) -> { data, error }
// And uses data.data_result = [{ x: ..., y: ... }, ...]
const mockFetchData = async (dateRange) => {
  // simulate API latency
  await new Promise(r => setTimeout(r, 400));
  return {
    data: {
      data_result: [
        { x: "Mon", y: 12 },
        { x: "Tue", y: 18 },
        { x: "Wed", y: 7 },
        { x: "Thu", y: 22 },
        { x: "Fri", y: 14 },
      ],
    },
    error: null,
  };
};

export default function ChartDemo() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <ChartBar
        fetchData={mockFetchData}
        params={{ date_range: { start: "2025-08-25", end: "2025-08-29" } }}
      />
    </div>
  );
}
