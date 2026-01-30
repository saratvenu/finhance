"use client";

import { Card, CardBody } from "@heroui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const data = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 500 },
  { name: "Apr", value: 700 },
  { name: "May", value: 600 },
  { name: "Jun", value: 800 },
];

export function OverviewChart() {
  return (
    <Card className="w-full h-[350px]">
      <CardBody>
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0070f3" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

