// Inline type definitions (to be moved to types/career.ts later)
interface Vacancy {
  _id: string
  title: string
  department: string
  location: string
  type: string // e.g., "Full-time", "Part-time"
  isActive: boolean
}

interface ExperienceLevel {
  value: string
  label: string
}

interface EducationLevel {
  value: string
  label: string
}

interface Language {
  value: string
  label: string
}

// Static data
export const vacanciesData: Vacancy[] = [
  {
    _id: "1",
    title: "Structural Engineer",
    department: "Engineering",
    location: "Dubai, UAE",
    type: "Full-time",
    isActive: true,
  },
  {
    _id: "2",
    title: "Project Manager",
    department: "Operations",
    location: "Dubai, UAE",
    type: "Full-time",
    isActive: true,
  },
  {
    _id: "3",
    title: "Quality Control Inspector",
    department: "Quality Assurance",
    location: "Dubai, UAE",
    type: "Full-time",
    isActive: true,
  },
  {
    _id: "4",
    title: "Sales Executive",
    department: "Sales",
    location: "Dubai, UAE",
    type: "Full-time",
    isActive: true,
  },
  {
    _id: "5",
    title: "CAD Designer",
    department: "Design",
    location: "Dubai, UAE",
    type: "Full-time",
    isActive: true,
  },
  {
    _id: "6",
    title: "Production Supervisor",
    department: "Manufacturing",
    location: "Dubai, UAE",
    type: "Full-time",
    isActive: true,
  },
]

export const experienceLevels: ExperienceLevel[] = [
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "mid", label: "Mid Level (3-5 years)" },
  { value: "senior", label: "Senior Level (6-10 years)" },
  { value: "executive", label: "Executive Level (10+ years)" },
]

export const educationLevels: EducationLevel[] = [
  { value: "high-school", label: "High School" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
]

export const languages: Language[] = [
  { value: "english", label: "English" },
  { value: "arabic", label: "Arabic" },
  { value: "french", label: "French" },
  { value: "spanish", label: "Spanish" },
  { value: "italian", label: "Italian" },
  { value: "portuguese", label: "Portuguese" },
  { value: "russian", label: "Russian" },
  { value: "turkish", label: "Turkish" },
]

export const activeVacancies = vacanciesData.filter((v) => v.isActive)

