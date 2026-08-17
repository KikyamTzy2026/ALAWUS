export const TASK_LIST = [
  {
    id: 'repair_computer',
    room: 'IT Department',
    label: 'Repair Computer',
    type: 'sequence',
    x: 180,
    y: 150
  },
  {
    id: 'upload_files',
    room: 'IT Department',
    label: 'Upload Files',
    type: 'hold',
    x: 220,
    y: 190
  },
  {
    id: 'check_invoices',
    room: 'Finance Room',
    label: 'Check Invoices',
    type: 'match',
    x: 620,
    y: 150
  },
  {
    id: 'organize_documents',
    room: 'Finance Room',
    label: 'Organize Documents',
    type: 'sort',
    x: 660,
    y: 190
  },
  {
    id: 'sort_records',
    room: 'HR Department',
    label: 'Sort Employee Records',
    type: 'sort',
    x: 620,
    y: 420
  },
  {
    id: 'equipment_inspection',
    room: 'Main Office',
    label: 'Equipment Inspection',
    type: 'hold',
    x: 400,
    y: 300
  }
];

export function getTaskById(id) {
  return TASK_LIST.find((t) => t.id === id);
}
