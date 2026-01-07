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
    { id: 'REQ-001', type: 'Request', site: 'North Site', status: 'Pending', date: '2 days ago', details: '50 bags Cement' },
    { id: 'REC-001', type: 'Receipt', site: 'MAPI Store', status: 'Completed', date: '3 days ago', details: '10 tons Steel' },
    { id: 'REQ-002', type: 'Request', site: 'South Site', status: 'Approved', date: '4 days ago', details: '2000 pcs Bricks' },
    { id: 'INV-001', type: 'Invoice', site: 'West Site', status: 'Uploaded', date: '5 days ago', details: 'INV-2024-001' },
    { id: 'SHIFT-001', type: 'Shift', site: 'North to South', status: 'In Transit', date: '6 days ago', details: '10 bags Cement' },
];

export const allMaterials = [
    { id: 'mat-1', name: 'Cement', unit: 'bag', description: 'Portland cement, 50kg bag' },
    { id: 'mat-2', name: 'Steel Rebar', unit: 'ton', description: '12mm diameter steel reinforcement bars' },
    { id: 'mat-3', name: 'Sand', unit: 'cubic meter', description: 'Fine aggregate for concrete' },
    { id: 'mat-4', name: 'Bricks', unit: 'pcs', description: 'Standard clay bricks' },
    { id: 'mat-5', name: 'Gravel', unit: 'cubic meter', description: 'Coarse aggregate for concrete' },
    { id: 'mat-6', name: 'Paint', unit: 'liter', description: 'White emulsion paint' },
];

export const lowStockMaterials = [
    { id: 'ls-1', material: 'Steel Rebar', site: 'North Site', quantity: '5 tons' },
    { id: 'ls-2', material: 'Paint', site: 'West Site', quantity: '20 liters' },
    { id: 'ls-3', material: 'Cement', site: 'North Site', quantity: '50 bags' },
];

export const pendingRequests = [
    { id: 'pr-1', material: 'Cement', quantity: '100 bags', site: 'North Site' },
    { id: 'pr-2', material: 'Bricks', quantity: '5000 pcs', site: 'South Site' },
    { id: 'pr-3', material: 'Sand', quantity: '20 m³', site: 'West Site' },
];