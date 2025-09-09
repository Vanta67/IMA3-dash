import React, { useMemo, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Check, Cloud, Gauge, Leaf, LineChart as LineIcon, Sparkles, Upload, Factory, Recycle, Droplets } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

/**
 * Microsoft CI + GenAI Sustainable Innovation Dashboard
 * -----------------------------------------------------
 * This single-file React app provides an interactive dashboard structure
 * you can use for your research report. It supports:
 *  - Uploading CSVs (Xbox Sustainability dataset; ESG metrics)
 *  - Exploring CI + GenAI sustainability KPIs (energy, CO2e, efficiency)
 *  - SDG alignment views (SDG 6, 7, 9, 12, 13)
 *  - Year/region filters
 *
 * CSV expectations (you can adapt in code):
 * 1) Xbox Sustainability dataset (example columns):
 *    Title,FiscalYear,Region,AverageACPower_W,TitleEnergy_MWh,TitleCO2e_MetricTon
 * 2) ESG Metrics (example columns):
 *    Metric,Year,Value,Unit,SDG
 *
 * The dashboard ships with clean SAMPLE DATA so it's usable immediately.
 * Replace or append your own CSVs via the uploaders below.
 */

// --------- SAMPLE DATA (feel free to replace) ---------
const SAMPLE_XBOX = [
  { Title: "Halo Infinite", FiscalYear: 2022, Region: "US", AverageACPower_W: 78, TitleEnergy_MWh: 1200, TitleCO2e_MetricTon: 540 },
  { Title: "Forza Horizon 5", FiscalYear: 2022, Region: "US", AverageACPower_W: 72, TitleEnergy_MWh: 950, TitleCO2e_MetricTon: 410 },
  { Title: "Sea of Thieves", FiscalYear: 2022, Region: "EU", AverageACPower_W: 65, TitleEnergy_MWh: 620, TitleCO2e_MetricTon: 270 },
  { Title: "Halo Infinite", FiscalYear: 2023, Region: "US", AverageACPower_W: 70, TitleEnergy_MWh: 1100, TitleCO2e_MetricTon: 480 },
  { Title: "Forza Horizon 5", FiscalYear: 2023, Region: "EU", AverageACPower_W: 69, TitleEnergy_MWh: 900, TitleCO2e_MetricTon: 380 },
  { Title: "Sea of Thieves", FiscalYear: 2023, Region: "EU", AverageACPower_W: 60, TitleEnergy_MWh: 540, TitleCO2e_MetricTon: 240 },
  { Title: "Starfield", FiscalYear: 2024, Region: "US", AverageACPower_W: 82, TitleEnergy_MWh: 1300, TitleCO2e_MetricTon: 560 },
  { Title: "Forza Motorsport", FiscalYear: 2024, Region: "US", AverageACPower_W: 75, TitleEnergy_MWh: 980, TitleCO2e_MetricTon: 420 },
  { Title: "Hi-Fi Rush", FiscalYear: 2024, Region: "APAC", AverageACPower_W: 52, TitleEnergy_MWh: 300, TitleCO2e_MetricTon: 120 },
];

const SAMPLE_ESG = [
  { Metric: "RenewableEnergyShare", Year: 2022, Value: 58, Unit: "%", SDG: "SDG 7" },
  { Metric: "RenewableEnergyShare", Year: 2023, Value: 64, Unit: "%", SDG: "SDG 7" },
  { Metric: "RenewableEnergyShare", Year: 2024, Value: 71, Unit: "%", SDG: "SDG 7" },
  { Metric: "WaterReplenished", Year: 2023, Value: 6.1, Unit: "billion L", SDG: "SDG 6" },
  { Metric: "WaterReplenished", Year: 2024, Value: 7.4, Unit: "billion L", SDG: "SDG 6" },
  { Metric: "WasteDiverted", Year: 2023, Value: 82, Unit: "%", SDG: "SDG 12" },
  { Metric: "WasteDiverted", Year: 2024, Value: 85, Unit: "%", SDG: "SDG 12" },
  { Metric: "LowCarbonContracts", Year: 2023, Value: 18, Unit: "GW", SDG: "SDG 13" },
  { Metric: "LowCarbonContracts", Year: 2024, Value: 22, Unit: "GW", SDG: "SDG 13" },
  { Metric: "SustainableInnovationPilots", Year: 2024, Value: 35, Unit: "projects", SDG: "SDG 9" },
];

// Optional peer benchmark upload structure (if used)
const SAMPLE_BENCHMARK = [
  { Company: "Microsoft", Year: 2022, EmissionsIntensity: 18.5 },
  { Company: "Microsoft", Year: 2023, EmissionsIntensity: 17.2 },
  { Company: "Microsoft", Year: 2024, EmissionsIntensity: 16.0 },
  { Company: "Peer Avg", Year: 2022, EmissionsIntensity: 22.0 },
  { Company: "Peer Avg", Year: 2023, EmissionsIntensity: 21.1 },
  { Company: "Peer Avg", Year: 2024, EmissionsIntensity: 20.4 },
];

// ------------- Utilities -------------
const parseCsv = (file, onDone) => {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results) => onDone(results.data || []),
  });
};

const yearsRangeFromData = (rows, key = "FiscalYear") => {
  const years = Array.from(new Set((rows || []).map((r) => Number(r[key])).filter(Boolean)));
  if (years.length === 0) return [2022, 2024];
  return [Math.min(...years), Math.max(...years)];
};

const numberFmt = (n, digits = 0) => {
  if (n === undefined || n === null || isNaN(n)) return "–";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

// ------------- Main App -------------
export default function Dashboard() {
  const [xboxRows, setXboxRows] = useState(SAMPLE_XBOX);
  const [esgRows, setEsgRows] = useState(SAMPLE_ESG);
  const [benchRows, setBenchRows] = useState(SAMPLE_BENCHMARK);

  const [region, setRegion] = useState("ALL");
  const [yearRange, setYearRange] = useState(yearsRangeFromData(SAMPLE_XBOX));

  const allRegions = useMemo(() => ["ALL", ...Array.from(new Set((xboxRows || []).map(r => r.Region).filter(Boolean)))], [xboxRows]);
  const [minYear, maxYear] = useMemo(() => yearsRangeFromData(xboxRows), [xboxRows]);

  // Adjust slider if new data changes bounds
  React.useEffect(() => {
    const [minY, maxY] = yearsRangeFromData(xboxRows);
    setYearRange([minY, maxY]);
  }, [xboxRows]);

  const filteredXbox = useMemo(() => {
    return (xboxRows || []).filter(r => {
      const inYear = r.FiscalYear >= yearRange[0] && r.FiscalYear <= yearRange[1];
      const inRegion = region === "ALL" ? true : r.Region === region;
      return inYear && inRegion;
    });
  }, [xboxRows, yearRange, region]);

  // Aggregations for KPIs
  const kpis = useMemo(() => {
    if (filteredXbox.length === 0) return { totalEnergy: 0, totalCO2: 0, avgPower: 0, titles: 0 };
    const totalEnergy = filteredXbox.reduce((s, r) => s + (Number(r.TitleEnergy_MWh) || 0), 0);
    const totalCO2 = filteredXbox.reduce((s, r) => s + (Number(r.TitleCO2e_MetricTon) || 0), 0);
    const avgPower = filteredXbox.reduce((s, r) => s + (Number(r.AverageACPower_W) || 0), 0) / filteredXbox.length;
    const titles = new Set(filteredXbox.map(r => r.Title)).size;
    return { totalEnergy, totalCO2, avgPower, titles };
  }, [filteredXbox]);

  // Time series for CO2 and Energy
  const byYear = useMemo(() => {
    const map = new Map();
    filteredXbox.forEach(r => {
      const y = Number(r.FiscalYear);
      if (!map.has(y)) map.set(y, { Year: y, Energy_MWh: 0, CO2e_t: 0 });
      const obj = map.get(y);
      obj.Energy_MWh += Number(r.TitleEnergy_MWh) || 0;
      obj.CO2e_t += Number(r.TitleCO2e_MetricTon) || 0;
    });
    return Array.from(map.values()).sort((a,b) => a.Year - b.Year);
  }, [filteredXbox]);

  // Top titles by efficiency proxy: lower CO2e per MWh is better
  const titleEfficiency = useMemo(() => {
    const map = new Map();
    filteredXbox.forEach(r => {
      const key = r.Title;
      if (!map.has(key)) map.set(key, { Title: key, Energy_MWh: 0, CO2e_t: 0 });
      const o = map.get(key);
      o.Energy_MWh += Number(r.TitleEnergy_MWh) || 0;
      o.CO2e_t += Number(r.TitleCO2e_MetricTon) || 0;
    });
    const rows = Array.from(map.values()).map(o => ({
      ...o,
      CO2e_per_MWh: o.Energy_MWh > 0 ? o.CO2e_t / o.Energy_MWh : 0,
    }));
    return rows.sort((a,b) => a.CO2e_per_MWh - b.CO2e_per_MWh).slice(0, 10);
  }, [filteredXbox]);

  // ESG time series by metric
  const esgSeries = useMemo(() => {
    const byMetric = {};
    (esgRows || []).forEach(r => {
      const key = r.Metric;
      if (!byMetric[key]) byMetric[key] = [];
      byMetric[key].push({ Year: Number(r.Year), Value: Number(r.Value), Unit: r.Unit, SDG: r.SDG });
    });
    Object.values(byMetric).forEach(arr => arr.sort((a,b) => a.Year - b.Year));
    return byMetric;
  }, [esgRows]);

  // Benchmark chart data (optional)
  const benchSeries = useMemo(() => {
    const map = new Map();
    (benchRows || []).forEach(r => {
      const y = Number(r.Year);
      if (!map.has(y)) map.set(y, { Year: y });
      const obj = map.get(y);
      obj[r.Company] = Number(r.EmissionsIntensity);
    });
    return Array.from(map.values()).sort((a,b) => a.Year - b.Year);
  }, [benchRows]);

  const sdgs = [
    { code: "SDG 6", label: "Clean Water & Sanitation", icon: <Droplets className="w-5 h-5" /> },
    { code: "SDG 7", label: "Affordable & Clean Energy", icon: <Cloud className="w-5 h-5" /> },
    { code: "SDG 9", label: "Industry, Innovation & Infrastructure", icon: <Factory className="w-5 h-5" /> },
    { code: "SDG 12", label: "Responsible Consumption & Production", icon: <Recycle className="w-5 h-5" /> },
    { code: "SDG 13", label: "Climate Action", icon: <Leaf className="w-5 h-5" /> },
  ];

  const colors = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#14b8a6", "#a855f7", "#0ea5e9"]; // For pies only; recharts otherwise auto-colors

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Microsoft: CI + Generative AI for Sustainable Innovation</h1>
            <p className="text-sm text-neutral-600 mt-1">Interactive dashboard aligning operational metrics with SDGs and competitive intelligence.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="rounded-2xl"><Sparkles className="w-4 h-4 mr-2"/>AI Insights (demo)</Button>
          </div>
        </div>

        {/* Uploaders & Filters */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Data Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Xbox Sustainability CSV</div>
                <Input type="file" accept=".csv" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  parseCsv(f, setXboxRows);
                }}/>
                <div className="text-xs text-neutral-500">Columns: Title, FiscalYear, Region, AverageACPower_W, TitleEnergy_MWh, TitleCO2e_MetricTon</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">ESG Metrics CSV</div>
                <Input type="file" accept=".csv" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  parseCsv(f, setEsgRows);
                }}/>
                <div className="text-xs text-neutral-500">Columns: Metric,Year,Value,Unit,SDG</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">(Optional) Benchmark CSV</div>
                <Input type="file" accept=".csv" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  parseCsv(f, setBenchRows);
                }}/>
                <div className="text-xs text-neutral-500">Columns: Company,Year,EmissionsIntensity</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="text-sm font-medium">Region</div>
                <div className="flex flex-wrap gap-2">
                  {allRegions.map(r => (
                    <Button key={r} variant={region===r?"default":"outline"} size="sm" className="rounded-full" onClick={()=>setRegion(r)}>{r}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm font-medium">Fiscal Year Range</div>
                <div className="px-2">
                  <Slider min={minYear} max={maxYear} step={1} value={yearRange} onValueChange={setYearRange} />
                  <div className="flex justify-between text-xs text-neutral-600 mt-1">
                    <span>{yearRange[0]}</span>
                    <span>{yearRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-600">Total Energy (MWh)</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between"><div className="text-3xl font-semibold">{numberFmt(kpis.totalEnergy)}</div><Gauge className="w-5 h-5"/></CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-600">Total CO₂e (t)</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between"><div className="text-3xl font-semibold">{numberFmt(kpis.totalCO2)}</div><Cloud className="w-5 h-5"/></CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-600">Avg Power (W)</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between"><div className="text-3xl font-semibold">{numberFmt(kpis.avgPower,1)}</div><LineIcon className="w-5 h-5"/></CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-600">Active Titles</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between"><div className="text-3xl font-semibold">{numberFmt(kpis.titles)}</div><Check className="w-5 h-5"/></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ci" className="w-full">
          <TabsList className="grid grid-cols-4 md:grid-cols-5 gap-2 rounded-2xl">
            <TabsTrigger value="ci">Competitive Intelligence</TabsTrigger>
            <TabsTrigger value="innovation">Sustainable Innovation</TabsTrigger>
            <TabsTrigger value="sdg">SDG Alignment</TabsTrigger>
            <TabsTrigger value="esg">ESG Metrics</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* CI Tab */}
          <TabsContent value="ci" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>Emissions Intensity Benchmark (optional)</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={benchSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Microsoft" />
                      <Line type="monotone" dataKey="Peer Avg" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>CO₂e vs Energy (Yearly)</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={byYear}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="CO2e_t" name="CO₂e (t)" />
                      <Area type="monotone" dataKey="Energy_MWh" name="Energy (MWh)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Innovation Tab */}
          <TabsContent value="innovation" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>Top 10 Titles by Efficiency (lowest CO₂e per MWh)</CardTitle></CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={titleEfficiency} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="Title" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="CO2e_per_MWh" name="CO₂e / MWh" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>Energy & CO₂e Composition</CardTitle></CardHeader>
                <CardContent className="h-80 grid md:grid-cols-2 gap-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie dataKey="TitleEnergy_MWh" nameKey="Title" data={filteredXbox} outerRadius={90}>
                          {filteredXbox.map((_, i) => (<Cell key={i} fill={colors[i % colors.length]} />))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center text-xs text-neutral-600 mt-1">Energy by Title</div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie dataKey="TitleCO2e_MetricTon" nameKey="Title" data={filteredXbox} outerRadius={90}>
                          {filteredXbox.map((_, i) => (<Cell key={i} fill={colors[i % colors.length]} />))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center text-xs text-neutral-600 mt-1">CO₂e by Title</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SDG Tab */}
          <TabsContent value="sdg" className="mt-4">
            <div className="grid md:grid-cols-5 gap-4">
              {sdgs.map((s, idx) => (
                <Card key={s.code} className="rounded-2xl shadow-sm hover:shadow transition p-4 flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2"><div>{s.icon}</div><div className="font-semibold">{s.code}</div></div>
                  <div className="text-sm text-neutral-600">{s.label}</div>
                  <div className="mt-auto text-xs text-neutral-500">Click ESG tab for time series</div>
                </Card>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {/* Link SDG 7 to Renewable Energy */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>SDG 7 • Renewable Energy Share (%)</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(esgSeries["RenewableEnergyShare"]||[])}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Year" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="Value" name="Renewables %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>SDG 6 • Water Replenished (billion L)</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(esgSeries["WaterReplenished"]||[])}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Year" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="Value" name="Water (bn L)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>SDG 12 • Waste Diverted (%)</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(esgSeries["WasteDiverted"]||[])}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Year" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="Value" name="Waste Diverted %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>SDG 13 • Low-Carbon Power Contracts (GW)</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(esgSeries["LowCarbonContracts"]||[])}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Year" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="Value" name="GW" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ESG Tab */}
          <TabsContent value="esg" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>CO₂e (t) by Year</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={byYear}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Year" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="CO2e_t" name="CO₂e (t)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>Energy (MWh) by Year</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byYear}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Year" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="Energy_MWh" name="Energy (MWh)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>How to Use This Dashboard</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-700">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Upload your <strong>Xbox sustainability CSV</strong> and <strong>ESG metrics CSV</strong> to replace the sample data.</li>
                  <li>Use the <strong>Region</strong> chips and <strong>Fiscal Year range</strong> to filter visualizations.</li>
                  <li>The <strong>Competitive Intelligence</strong> tab lets you optionally add a peer benchmark for emissions intensity.</li>
                  <li>The <strong>SDG</strong> and <strong>ESG</strong> tabs visualize alignment with SDG 6, 7, 9, 12, and 13 using your ESG time series.</li>
                  <li>All charts update instantly on data/filter changes and are suitable for screenshots in your report.</li>
                </ul>
                <div className="text-xs text-neutral-500">Note: Sample numbers are illustrative. Replace with official Microsoft datasets for publication.</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
