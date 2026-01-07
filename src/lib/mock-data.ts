export const monthlyConsumption = [
  { month: 'Jan', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Feb', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Mar', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Apr', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'May', consumption: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Jun', consumption: Math.floor(Math.random() * 5000) + 1000 },
];

export const materialStock = [
    { name: 'Cement', value: 400 },
    { name: 'Steel', value: 300 },
    { name: 'Sand', value: 300 },
    { name: 'Bricks', value: 200 },
    { name: 'Gravel', value: 278 },
    { name: 'Paint', value: 189 },
];

export const recentActivities = [
    { id: 'REQ-001', type: 'Request', site: 'North Site', status: 'Pending', date: '2 days ago'},
    { id: 'REC-001', type: 'Receipt', site: 'MAPI Store', status: 'Completed', date: '3 days ago'},
    { id: 'REQ-002', type: 'Request', site: 'South Site', status: 'Approved', date: '4 days ago'},
    { id: 'INV-001', type: 'Invoice', site: 'West Site', status: 'Uploaded', date: '5 days ago'},
    { id: 'SHIFT-001', type: 'Shift', site: 'North to South', status: 'In Transit', date: '6 days ago'},
];

export const allMaterials = [
    { id: 'mat-1', name: 'Cement', unit: 'bag', description: 'Portland cement, 50kg bag' },
    { id: 'mat-2', name: 'Steel Rebar', unit: 'ton', description: '12mm diameter steel reinforcement bars' },
    { id: 'mat-3', name: 'Sand', unit: 'cubic meter', description: 'Fine aggregate for concrete' },
    { id: 'mat-4', name: 'Bricks', unit: 'pcs', description: 'Standard clay bricks' },
    { id: 'mat-5', name: 'Gravel', unit: 'cubic meter', description: 'Coarse aggregate for concrete' },
    { id: 'mat-6', name: 'Paint', unit: 'liter', description: 'White emulsion paint' },
];
