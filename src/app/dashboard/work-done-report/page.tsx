
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, PlusCircle, Trash } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockBoqData } from '@/lib/mock-data';

const materialSchema = z.object({
  type: z.string().min(1, 'Material type is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity is required.'),
  unit: z.string(),
});

const equipmentSchema = z.object({
  source: z.string().min(1, 'Source is required.'),
  name: z.string().min(1, 'Equipment name is required.'),
  usage: z.coerce.number().min(0.1, 'Usage is required.'),
  unit: z.string(),
});

const workforceSchema = z.object({
  skill: z.string().min(1, 'Skill is required.'),
  designation: z.string().min(1, 'Designation is required.'),
  count: z.coerce.number().min(1, 'Count is required.'),
});

const workDoneSchema = z.object({
  siteName: z.string(),
  reportDate: z.date(),
  descriptionOfWork: z.string().min(1, 'Description of work is required.'),
  categoryNumber: z.string(),
  itemOfWork: z.string().min(1, 'Item of work is required.'),
  itemNumber: z.string(),
  subItemOfWork: z.string().optional(),
  quantityOfWork: z.coerce.number().min(0.1, 'Quantity must be greater than 0.'),
  materials: z.array(materialSchema).optional(),
  equipment: z.array(equipmentSchema).optional(),
  workforce: z.array(workforceSchema).optional(),
});

type WorkDoneFormValues = z.infer<typeof workDoneSchema>;

export default function WorkDoneReportPage() {
  const { toast } = useToast();

  const form = useForm<WorkDoneFormValues>({
    resolver: zodResolver(workDoneSchema),
    defaultValues: {
      siteName: 'North Site', // This would be dynamic based on user
      reportDate: new Date(),
      descriptionOfWork: '',
      categoryNumber: '',
      itemOfWork: '',
      itemNumber: '',
      quantityOfWork: 0,
      materials: [{ type: '', quantity: 0, unit: '' }],
      equipment: [{ source: '', name: '', usage: 0, unit: '' }],
      workforce: [{ skill: '', designation: '', count: 0 }],
    },
  });

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control: form.control,
    name: 'materials',
  });
  const { fields: equipmentFields, append: appendEquipment, remove: removeEquipment } = useFieldArray({
    control: form.control,
    name: 'equipment',
  });
  const { fields: workforceFields, append: appendWorkforce, remove: removeWorkforce } = useFieldArray({
    control: form.control,
    name: 'workforce',
  });
  
  const handleDescriptionChange = (value: string) => {
    form.setValue('descriptionOfWork', value);
    const selectedDesc = mockBoqData.descriptions.find(d => d.description === value);
    form.setValue('categoryNumber', selectedDesc?.categoryNumber || '');
    form.setValue('itemOfWork', '');
    form.setValue('itemNumber', '');
  };
  
  const handleItemChange = (value: string) => {
    form.setValue('itemOfWork', value);
    const selectedItem = mockBoqData.items.find(i => i.item === value);
    form.setValue('itemNumber', selectedItem?.itemNumber || '');
  };

  const selectedDescription = form.watch('descriptionOfWork');
  const availableItems = React.useMemo(() => {
    if (!selectedDescription) return [];
    return mockBoqData.items.filter(i => i.description === selectedDescription);
  }, [selectedDescription]);

  const selectedEquipmentSource = form.watch('equipment');
  const availableEquipment = (index: number) => {
    const source = selectedEquipmentSource?.[index]?.source;
    if (!source) return [];
    return mockBoqData.equipment.filter(e => e.source.toLowerCase() === source.toLowerCase());
  }
  
  const handleMaterialTypeChange = (value: string, index: number) => {
    form.setValue(`materials.${index}.type`, value);
    const selectedMaterial = mockBoqData.materials.find(m => m.type === value);
    form.setValue(`materials.${index}.unit`, selectedMaterial?.unit || '');
  };
  
  const handleEquipmentSourceChange = (value: string, index: number) => {
    form.setValue(`equipment.${index}.source`, value);
    form.setValue(`equipment.${index}.name`, '');
    form.setValue(`equipment.${index}.unit`, '');
  };
  
  const handleEquipmentNameChange = (value: string, index: number) => {
    form.setValue(`equipment.${index}.name`, value);
    const selectedEquipment = mockBoqData.equipment.find(e => e.name === value);
    form.setValue(`equipment.${index}.unit`, selectedEquipment?.unit || '');
  };

  function onSubmit(values: WorkDoneFormValues) {
    console.log(values);
    toast({
      title: 'Report Submitted',
      description: 'Your Daily Work Done Report has been successfully submitted.',
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Daily Work Done Report</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Submit Today's Progress</CardTitle>
          <CardDescription>Fill in the details below to report the work completed today.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                       <FormControl>
                        <Input value={format(field.value, 'PPP')} readOnly disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-medium">Work Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="descriptionOfWork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Work</FormLabel>
                          <Select onValueChange={handleDescriptionChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select work description" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {mockBoqData.descriptions.map(desc => (
                                <SelectItem key={desc.description} value={desc.description}>{desc.description}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="categoryNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Category Number</FormLabel>
                            <FormControl><Input {...field} readOnly disabled /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="itemOfWork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item of Work</FormLabel>
                          <Select onValueChange={handleItemChange} value={field.value} disabled={!selectedDescription}>
                             <FormControl><SelectTrigger><SelectValue placeholder="Select work item" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {availableItems.map(item => (
                                <SelectItem key={item.item} value={item.item}>{item.item}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="itemNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Item Number</FormLabel>
                            <FormControl><Input {...field} readOnly disabled /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="subItemOfWork"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Sub Item of Work (Optional)</FormLabel>
                            <FormControl><Input placeholder="e.g., Waterproofing" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="quantityOfWork"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quantity of Work</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              {/* Material Consumption */}
              <Card>
                <CardHeader>
                    <CardTitle>Material Consumption</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-2/5">Material Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {materialFields.map((field, index) => (
                            <TableRow key={field.id}>
                            <TableCell>
                                <FormField
                                control={form.control}
                                name={`materials.${index}.type`}
                                render={({ field }) => (
                                    <FormItem>
                                    <Select onValueChange={(value) => handleMaterialTypeChange(value, index)} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                        {mockBoqData.materials.map(mat => (
                                            <SelectItem key={mat.type} value={mat.type}>{mat.type}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </TableCell>
                            <TableCell>
                                <FormField
                                control={form.control}
                                name={`materials.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="e.g., 50" {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                                />
                            </TableCell>
                            <TableCell>
                                <FormField
                                control={form.control}
                                name={`materials.${index}.unit`}
                                render={({ field }) => (
                                    <FormItem><FormControl><Input readOnly disabled {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                                />
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeMaterial(index)} disabled={materialFields.length <= 1}>
                                <Trash className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendMaterial({ type: '', quantity: 0, unit: '' })} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Material
                    </Button>
                </CardContent>
              </Card>

              {/* Equipment Usage */}
              <Card>
                <CardHeader><CardTitle>Equipment Usage</CardTitle></CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Source</TableHead>
                                <TableHead>Equipment Name</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {equipmentFields.map((field, index) => (
                                <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`equipment.${index}.source`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <Select onValueChange={(value) => handleEquipmentSourceChange(value, index)} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {/* Unique sources from mock data */}
                                                    {[...new Set(mockBoqData.equipment.map(e => e.source))].map(source => (
                                                        <SelectItem key={source} value={source}>{source}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`equipment.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <Select onValueChange={(value) => handleEquipmentNameChange(value, index)} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {availableEquipment(index).map(eq => (
                                                        <SelectItem key={eq.name} value={eq.name}>{eq.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`equipment.${index}.usage`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" placeholder="e.g., 8" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`equipment.${index}.unit`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input readOnly disabled {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeEquipment(index)} disabled={equipmentFields.length <= 1}>
                                    <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendEquipment({ source: '', name: '', usage: 0, unit: '' })} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Equipment
                    </Button>
                </CardContent>
              </Card>

              {/* Workforce Details */}
              <Card>
                <CardHeader><CardTitle>Workforce Details</CardTitle></CardHeader>
                <CardContent>
                   <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Skill Type</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead>No. of Workers</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {workforceFields.map((field, index) => (
                                <TableRow key={field.id}>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`workforce.${index}.skill`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select skill" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                   {[...new Set(mockBoqData.workforce.map(w => w.skill))].map(skill => (
                                                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                                   ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`workforce.${index}.designation`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {[...new Set(mockBoqData.workforce.map(w => w.designation))].map(des => (
                                                        <SelectItem key={des} value={des}>{des}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`workforce.${index}.count`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeWorkforce(index)} disabled={workforceFields.length <= 1}>
                                    <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendWorkforce({ skill: '', designation: '', count: 0 })} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Workforce
                    </Button>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Daily Report'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
