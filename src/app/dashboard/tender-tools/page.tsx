'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, RefreshCw, Ruler, FileText, Layers, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const fileSchema = (typeof window !== 'undefined' ? z.instanceof(File) : z.any()).optional();

const drawingSchema = z.object({
  drawingFile: fileSchema,
});
type DrawingFormValues = z.infer<typeof drawingSchema>;

const measurementSchema = z.object({
    measurementType: z.string().min(1, 'Please select a measurement type.'),
});
type MeasurementFormValues = z.infer<typeof measurementSchema>;

export default function TenderToolsPage() {
    const { toast } = useToast();
    const [drawingFileName, setDrawingFileName] = React.useState<string | null>(null);
    const [is3dModelVisible, setIs3dModelVisible] = React.useState(false);
    const [measurements, setMeasurements] = React.useState<any[]>([]);
    const [boq, setBoq] = React.useState<any[]>([]);
    const [isBoqVisible, setIsBoqVisible] = React.useState(false);

    const drawingForm = useForm<DrawingFormValues>({ resolver: zodResolver(drawingSchema) });
    const measurementForm = useForm<MeasurementFormValues>({ resolver: zodResolver(measurementSchema) });

    function onDrawingUpload(values: DrawingFormValues) {
        if (values.drawingFile) {
            setDrawingFileName(values.drawingFile.name);
            setIs3dModelVisible(false);
            setMeasurements([]);
            setIsBoqVisible(false);
            setBoq([]);
            toast({
                title: 'Drawing Uploaded',
                description: `${values.drawingFile.name} is ready for processing.`,
            });
        }
    }

    function onConvertTo3d() {
        if (!drawingFileName) {
            toast({ variant: 'destructive', title: 'No Drawing', description: 'Please upload a 2D drawing first.' });
            return;
        }
        setIs3dModelVisible(true);
        toast({
            title: 'Conversion in Progress...',
            description: 'Your 2D drawing is being converted to a 3D model.',
        });
    }
    
    function onDownload3d() {
        toast({ title: 'Download Started', description: 'Your 3D model is being downloaded.' });
    }

    function onCalculateMeasurements(values: MeasurementFormValues) {
        if (!drawingFileName) {
            toast({ variant: 'destructive', title: 'No Drawing', description: 'Please upload a drawing first.' });
            return;
        }
        
        let mockData: any[] = [];
        const selectedType = values.measurementType;

        if (selectedType === 'Excavation') {
            mockData = [
                { id: 1, type: 'Excavation', description: 'Foundation Footing F1', quantity: 15.0, unit: 'm³' },
                { id: 2, type: 'Excavation', description: 'Foundation Footing F2', quantity: 22.5, unit: 'm³' },
            ];
        } else if (selectedType === 'Plastering') {
            mockData = [
                { id: 1, type: 'Plastering', description: 'Internal Wall - Room 101', quantity: 85.2, unit: 'm²' },
                { id: 2, type: 'Plastering', description: 'External Wall - North Face', quantity: 120.0, unit: 'm²' },
            ];
        } else if (selectedType === 'Concrete') {
            mockData = [
                 { id: 1, type: 'Concrete', description: 'Slab S1', quantity: 12.0, unit: 'm³' },
                 { id: 2, type: 'Concrete', description: 'Column C1', quantity: 2.5, unit: 'm³' },
            ];
        } else {
            mockData = [
                { id: 1, type: 'Excavation', description: 'Foundation Footings', quantity: 150.0, unit: 'm³' },
                { id: 2, type: 'Concrete', description: 'Foundations & Slabs', quantity: 75.2, unit: 'm³' },
                { id: 3, type: 'Plastering', description: 'Total Internal Walls', quantity: 850.0, unit: 'm²' },
            ];
        }

        setMeasurements(mockData);
        setIsBoqVisible(false);
        setBoq([]);
        toast({ title: 'Measurements Calculated', description: `Measurements for ${selectedType} have been extracted.` });
    }

    function onDownloadMeasurements() {
        toast({ title: 'Measurement Export Started', description: 'Your measurement data is being downloaded.' });
    }

    function onGenerateBoq() {
        if (measurements.length === 0) {
            toast({ variant: 'destructive', title: 'No Measurements', description: 'Please calculate measurements first to generate a BOQ.' });
            return;
        }

        const newBoq = measurements.map(m => ({
            id: m.id,
            description: m.description,
            quantity: m.quantity,
            unit: m.unit,
            rate: Math.floor(Math.random() * 100) + 10, // Mock rate
        }));
        
        setBoq(newBoq);
        setIsBoqVisible(true);
        toast({ title: 'BOQ & Estimation Generated', description: 'A standard format BOQ has been created and is ready for download and editing.' });
    }

    const handleBoqChange = (index: number, field: 'quantity' | 'rate', value: string) => {
        const updatedBoq = [...boq];
        const numericValue = parseFloat(value) || 0;
        updatedBoq[index] = { ...updatedBoq[index], [field]: numericValue };
        setBoq(updatedBoq);
    };

    const handleDownloadBoq = (format: 'Excel' | 'PDF') => {
        toast({
            title: 'Download Started',
            description: `Your BOQ is being downloaded as a ${format} file.`
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <Layers /> Tender Department Tools
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* 2D/3D AutoCAD Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. 2D to 3D AutoCAD Conversion</CardTitle>
                        <CardDescription>Upload a 2D drawing to generate a 3D model and extract measurements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Form {...drawingForm}>
                            <form onChange={drawingForm.handleSubmit(onDrawingUpload)} className="space-y-4">
                                <FormField
                                    control={drawingForm.control}
                                    name="drawingFile"
                                    render={({ field: { onChange, value, ...rest } }) => (
                                        <FormItem>
                                            <FormLabel>Upload 2D AutoCAD File (.dwg, .dxf)</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept=".dwg, .dxf" onChange={(e) => onChange(e.target.files?.[0])} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                        
                        {drawingFileName && (
                             <div className="space-y-4 pt-4">
                                <Separator />
                                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Processed Drawing: {drawingFileName}</h4>
                                        <div className="flex gap-2">
                                            <Button onClick={onConvertTo3d}><RefreshCw className="mr-2"/>Convert to 3D</Button>
                                            <Button onClick={onDownload3d} variant="outline" disabled={!is3dModelVisible}><Download className="mr-2"/>Download 3D</Button>
                                        </div>
                                    </div>
                                    {is3dModelVisible && (
                                        <div className="w-full sm:w-40 h-32 bg-secondary rounded-lg flex items-center justify-center">
                                            <p className="text-muted-foreground text-sm">3D Model Preview</p>
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}
                    </CardContent>
                </Card>

                {/* Measurement & BOQ */}
                <Card>
                    <CardHeader>
                        <CardTitle>2. Measurement & BOQ Generation</CardTitle>
                        <CardDescription>Extract measurements and generate a Bill of Quantities from the drawing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <Form {...measurementForm}>
                            <form onSubmit={measurementForm.handleSubmit(onCalculateMeasurements)} className="flex items-end gap-4">
                                <FormField
                                    control={measurementForm.control}
                                    name="measurementType"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>Measurement Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a measurement type" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Excavation">Excavation</SelectItem>
                                                    <SelectItem value="Concrete">Concrete</SelectItem>
                                                    <SelectItem value="Plastering">Plastering</SelectItem>
                                                    <SelectItem value="Shuttering">Shuttering</SelectItem>
                                                    <SelectItem value="Reinforcement">Reinforcement</SelectItem>
                                                    <SelectItem value="Overall">Overall Measurement</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit"><Ruler className="mr-2"/>Calculate</Button>
                            </form>
                       </Form>
                       
                       {measurements.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <Separator />
                                <div className="flex justify-between items-center">
                                     <h4 className="font-semibold">Extracted Measurements</h4>
                                     <Button onClick={onDownloadMeasurements} variant="outline" size="sm"><Download className="mr-2"/>Download Measurements</Button>
                                </div>
                                <div className="max-h-40 overflow-y-auto border rounded-md">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Quantity</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {measurements.map(m => (
                                                <TableRow key={m.id}><TableCell>{m.type}</TableCell><TableCell>{m.description}</TableCell><TableCell>{`${m.quantity} ${m.unit}`}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Button onClick={onGenerateBoq} className="w-full"><FileText className="mr-2"/>Generate Estimation and BOQ</Button>
                            </div>
                       )}
                    </CardContent>
                </Card>
            </div>

            {isBoqVisible && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>3. Generated BOQ & Estimation</CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Download className="mr-2" />
                                        Download BOQ
                                        <ChevronDown className="ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleDownloadBoq('Excel')}>Excel (.xlsx)</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownloadBoq('PDF')}>PDF (.pdf)</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <CardDescription>Review and edit the auto-generated Bill of Quantities. Rates and quantities are editable.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="max-h-96 overflow-y-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-32">Quantity</TableHead>
                                        <TableHead className="w-24">Unit</TableHead>
                                        <TableHead className="w-32">Rate</TableHead>
                                        <TableHead className="w-40 text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {boq.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.description}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    value={item.quantity}
                                                    onChange={(e) => handleBoqChange(index, 'quantity', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleBoqChange(index, 'rate', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">${(item.quantity * item.rate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
