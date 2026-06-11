import type { Company, DataPoint, MetricAssignment, MetricDef } from './types'
import { isValidPeriod } from './periods'

export interface ValidationError { field: string; message: string }

const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function validateCompany(c: Partial<Company>): ValidationError[] {
  const errs: ValidationError[] = []
  if (!c.name?.trim()) errs.push({ field: 'name', message: 'Company name is required.' })
  if (!c.sector?.trim()) errs.push({ field: 'sector', message: 'Pick a sector.' })
  if (!c.geography?.trim()) errs.push({ field: 'geography', message: 'Pick a geography.' })
  if (!c.investmentDate) errs.push({ field: 'investmentDate', message: 'Investment date is required.' })
  if (!isFiniteNum(c.committedUsd) || c.committedUsd < 0)
    errs.push({ field: 'committedUsd', message: 'Committed capital must be 0 or more.' })
  if (!isFiniteNum(c.deployedUsd) || c.deployedUsd < 0)
    errs.push({ field: 'deployedUsd', message: 'Deployed capital must be 0 or more.' })
  if (isFiniteNum(c.committedUsd) && isFiniteNum(c.deployedUsd) && c.deployedUsd > c.committedUsd)
    errs.push({ field: 'deployedUsd', message: 'Deployed cannot exceed committed capital.' })
  if (c.ownershipPct != null && (!isFiniteNum(c.ownershipPct) || c.ownershipPct < 0 || c.ownershipPct > 100))
    errs.push({ field: 'ownershipPct', message: 'Ownership must be between 0 and 100%.' })
  return errs
}

export function validateMetricDef(m: Partial<MetricDef>): ValidationError[] {
  const errs: ValidationError[] = []
  if (!m.name?.trim()) errs.push({ field: 'name', message: 'Metric name is required.' })
  if (!m.unit?.trim()) errs.push({ field: 'unit', message: 'Unit is required (e.g. tCO2e, people, %).' })
  if (!m.definition?.trim()) errs.push({ field: 'definition', message: 'Add a one-line definition so everyone measures the same thing.' })
  return errs
}

export function validateAssignment(a: Partial<MetricAssignment>): ValidationError[] {
  const errs: ValidationError[] = []
  if (!a.companyId) errs.push({ field: 'companyId', message: 'Company is required.' })
  if (!a.metricId) errs.push({ field: 'metricId', message: 'Metric is required.' })
  if (a.baseline != null && !isFiniteNum(a.baseline))
    errs.push({ field: 'baseline', message: 'Baseline must be a number.' })
  if (a.target != null && !isFiniteNum(a.target))
    errs.push({ field: 'target', message: 'Target must be a number.' })
  return errs
}

export function validateDataPoint(d: Partial<DataPoint>): ValidationError[] {
  const errs: ValidationError[] = []
  if (!d.assignmentId) errs.push({ field: 'assignmentId', message: 'Metric assignment is required.' })
  if (!d.period || !isValidPeriod(d.period))
    errs.push({ field: 'period', message: 'Period must look like 2024-Q1 or 2024.' })
  if (!isFiniteNum(d.value))
    errs.push({ field: 'value', message: 'Value must be a number.' })
  if (d.evidenceUrl && !/^(https?:\/\/|\/)/.test(d.evidenceUrl))
    errs.push({ field: 'evidenceUrl', message: 'Evidence link must be a URL.' })
  return errs
}

/** Parse a numeric cell from CSV — returns null for anything non-numeric. */
export function parseNumericCell(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}
