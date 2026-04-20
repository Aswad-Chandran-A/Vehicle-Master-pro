// utils/compliance.js
export function getStatusBadge(status) {
    switch (status) {
      case 'green':       return { cls: 'badge-green',  label: 'Compliant',     dot: 'bg-emerald-400' }
      case 'yellow':      return { cls: 'badge-yellow', label: 'Expiring Soon', dot: 'bg-amber-400' }
      case 'red':         return { cls: 'badge-red',    label: 'Expired',       dot: 'bg-red-400' }
      case 'blacklisted': return { cls: 'badge-black',  label: 'Blacklisted',   dot: 'bg-slate-400' }
      default:            return { cls: 'badge-yellow', label: 'Unknown',       dot: 'bg-slate-400' }
    }
  }
  
  export function daysLabel(days) {
    if (days === null || days === undefined) return '—'
    if (days < 0) return `Expired ${Math.abs(days)}d ago`
    if (days === 0) return 'Expires today'
    return `${days}d left`
  }
  
  export function daysColor(days) {
    if (days === null) return 'text-slate-500'
    if (days <= 0)  return 'text-red-400'
    if (days <= 15) return 'text-amber-400'
    return 'text-emerald-400'
  }
  
  export function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  
  export const DOC_LABELS = {
    INS:    'Insurance',
    PUC:    'PUC',
    FIT:    'Fitness',
    RC:     'RC',
    PERMIT: 'Permit',
    TAX:    'Tax',
  }