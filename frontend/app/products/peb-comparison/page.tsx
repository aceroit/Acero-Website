import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroImageSection } from "@/components/sections/hero-image-section"
import { TabbedComparisonSection } from "@/components/sections/tabbed-comparison-section"
import { ContentSection } from "@/components/sections/content-section"

// General Criteria Data
const generalCriteriaData = [
  {
    criteria: "Design dimension",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "average" as const, label: "Average" },
    reinforcedConcrete: { value: "average" as const, label: "Average" },
  },
  {
    criteria: "Architectural flexibility",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "poor" as const, label: "Poor" },
    reinforcedConcrete: { value: "poor" as const, label: "Poor" },
  },
  {
    criteria: "Quality control",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "poor" as const, label: "Poor" },
    reinforcedConcrete: { value: "poor" as const, label: "Poor" },
  },
  {
    criteria: "Traceability of material",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "average" as const, label: "Average" },
    reinforcedConcrete: { value: "poor" as const, label: "Poor" },
  },
  {
    criteria: "Delivery and logistics",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "average" as const, label: "Average" },
    reinforcedConcrete: { value: "poor" as const, label: "Poor" },
  },
  {
    criteria: "Error modification",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "poor" as const, label: "Poor" },
    reinforcedConcrete: { value: "good" as const, label: "Good" },
  },
  {
    criteria: "Future options",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "poor" as const, label: "Poor" },
    reinforcedConcrete: { value: "average" as const, label: "Average" },
  },
  {
    criteria: "Efficiency",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "average" as const, label: "Average" },
    reinforcedConcrete: { value: "good" as const, label: "Good" },
  },
  {
    criteria: "Seismic resistance",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "poor" as const, label: "Poor" },
    reinforcedConcrete: { value: "poor" as const, label: "Poor" },
  },
  {
    criteria: "Lifespan of building",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "good" as const, label: "Good" },
    reinforcedConcrete: { value: "average" as const, label: "Average" },
  },
  {
    criteria: "Construction accuracy",
    preEngineered: { value: "good" as const, label: "Good" },
    conventionalSteel: { value: "good" as const, label: "Good" },
    reinforcedConcrete: { value: "poor" as const, label: "Poor" },
  },
]

// Cost Comparison Data
const costComparisonData = [
  {
    criteria: "Design engineering",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "medium" as const, label: "Medium" },
    reinforcedConcrete: { value: "low" as const, label: "Low" },
  },
  {
    criteria: "Materials",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "high" as const, label: "High" },
    reinforcedConcrete: { value: "medium" as const, label: "Medium" },
  },
  {
    criteria: "Fabrication",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "medium" as const, label: "Medium" },
    reinforcedConcrete: { value: "low" as const, label: "Low" },
  },
  {
    criteria: "Structure weight",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "high" as const, label: "High" },
    reinforcedConcrete: { value: "high" as const, label: "High" },
  },
  {
    criteria: "Erection",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "high" as const, label: "High" },
    reinforcedConcrete: { value: "low" as const, label: "Low" },
  },
  {
    criteria: "Delivery logistics",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "medium" as const, label: "Medium" },
    reinforcedConcrete: { value: "high" as const, label: "High" },
  },
  {
    criteria: "Maintenance",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "medium" as const, label: "Medium" },
    reinforcedConcrete: { value: "high" as const, label: "High" },
  },
  {
    criteria: "Foundation",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "medium" as const, label: "Medium" },
    reinforcedConcrete: { value: "high" as const, label: "High" },
  },
  {
    criteria: "Building accessories",
    preEngineered: { value: "low" as const, label: "Low" },
    conventionalSteel: { value: "high" as const, label: "High" },
    reinforcedConcrete: { value: "medium" as const, label: "Medium" },
  },
]

// Time Comparison Data
const timeComparisonData = [
  {
    criteria: "Total project time",
    preEngineered: { value: "on-time" as const, label: "On-Time" },
    conventionalSteel: { value: "average" as const, label: "Average" },
    reinforcedConcrete: { value: "slow" as const, label: "Slow" },
  },
  {
    criteria: "Materials",
    preEngineered: { value: "on-time" as const, label: "On-Time" },
    conventionalSteel: { value: "slow" as const, label: "Slow" },
    reinforcedConcrete: { value: "on-time" as const, label: "On-Time" },
  },
  {
    criteria: "Design engineering",
    preEngineered: { value: "on-time" as const, label: "On-Time" },
    conventionalSteel: { value: "average" as const, label: "Average" },
    reinforcedConcrete: { value: "average" as const, label: "Average" },
  },
  {
    criteria: "Fabrication",
    preEngineered: { value: "on-time" as const, label: "On-Time" },
    conventionalSteel: { value: "slow" as const, label: "Slow" },
    reinforcedConcrete: { value: "average" as const, label: "Average" },
  },
  {
    criteria: "Erection",
    preEngineered: { value: "on-time" as const, label: "On-Time" },
    conventionalSteel: { value: "slow" as const, label: "Slow" },
    reinforcedConcrete: { value: "average" as const, label: "Average" },
  },
  {
    criteria: "Foundation",
    preEngineered: { value: "on-time" as const, label: "On-Time" },
    conventionalSteel: { value: "average" as const, label: "Average" },
    reinforcedConcrete: { value: "slow" as const, label: "Slow" },
  },
]

// Tab Configuration
const comparisonTabs = [
  {
    id: "general",
    label: "General Criteria",
    legend: [
      { value: "good" as const, color: "bg-green-500", label: "Good" },
      { value: "average" as const, color: "bg-yellow-500", label: "Average" },
      { value: "poor" as const, color: "bg-red-500", label: "Poor" },
    ],
    data: generalCriteriaData,
  },
  {
    id: "cost",
    label: "Cost Comparison",
    legend: [
      { value: "low" as const, color: "bg-green-500", label: "Low" },
      { value: "medium" as const, color: "bg-yellow-500", label: "Medium" },
      { value: "high" as const, color: "bg-red-500", label: "High" },
    ],
    data: costComparisonData,
  },
  {
    id: "time",
    label: "Time Comparison",
    legend: [
      { value: "on-time" as const, color: "bg-green-500", label: "On-Time" },
      { value: "average" as const, color: "bg-yellow-500", label: "Average" },
      { value: "slow" as const, color: "bg-red-500", label: "Slow" },
    ],
    data: timeComparisonData,
  },
]

export default function PEBComparisonPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Section 1: Hero Image */}
        <HeroImageSection
          image="/images/peb-comparison/hero.jpg"
          title="Pre-Engineered Steel Building vs Conventional Steel"
        />

        {/* Section 2: Tabbed Comparison Section */}
        <TabbedComparisonSection
          title="PEB Comparison"
          subtitle="To learn more about PEB Comparison, click to see comparison"
          tabs={comparisonTabs}
        />

        {/* Section 3: Content Section */}
        <ContentSection
          title=""
          paragraphs={[
            "Acero's PEBs benefit from factory-controlled manufacturing processes, ensuring consistency and high quality across components. Precision engineering reduces the need for on-site adjustments, minimizing the potential for errors during construction. Acero's PEBs optimize material usage through computerized design, reducing waste and enhancing efficiency. Strict quality control measures during fabrication and assembly contribute to the overall quality assurance of Acero's PEBs.",
          ]}
          layout="text-only"
        />
      </main>
      <Footer />
    </>
  )
}

