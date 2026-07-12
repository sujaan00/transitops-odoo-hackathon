"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const palette = ["#0f9f94", "#2563eb", "#f59e0b", "#dc2626", "#7c3aed", "#16a34a", "#0891b2"];

export function LineChartCard({
  title,
  description,
  data,
  xKey,
  lines
}: {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  xKey: string;
  lines: { key: string; label: string; color?: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="h-80">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.35)" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Legend />
              {lines.map((line, index) => (
                <Line key={line.key} type="monotone" dataKey={line.key} name={line.label} stroke={line.color ?? palette[index % palette.length]} strokeWidth={2.4} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function BarChartCard({
  title,
  description,
  data,
  xKey,
  bars
}: {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; label: string; color?: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="h-80">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.35)" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Legend />
              {bars.map((bar, index) => (
                <Bar key={bar.key} dataKey={bar.key} name={bar.label} fill={bar.color ?? palette[index % palette.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function PieChartCard({
  title,
  description,
  data,
  nameKey = "name",
  valueKey = "value"
}: {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  nameKey?: string;
  valueKey?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="h-80">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={58} outerRadius={96} paddingAngle={2}>
                {data.map((_, index) => (
                  <Cell key={index} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">No data available for this chart.</div>;
}
