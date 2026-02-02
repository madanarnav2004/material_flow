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
import { Upload, Download, RefreshCw, Ruler, FileText, Layers } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const fileSchema = (typeof window !== 'undefined' ? z.instanceof(File) : z.any()).optional();

const drawingSchema = z.object({
  drawingFile: fileSchema,
});
type DrawingFormValues = z.infer<typeof drawingSchema>;

const boqSchema = z.object({
  boqFile: fileSchema,
});
type BoqFormValues = z.infer<typeof boqSchema>;

const measurementSchema = z.object({
    measurementType: z.string().min(1, 'Please select a measurement type.'),
});
type MeasurementFormValues = z.infer<typeof measurementSchema>;


export default function TenderToolsPage() {
    const { toast } = useToast();
    const [drawingFileName, setDrawingFileName] = React.useState<string | null>(null);
    const [is3dModelVisible, setIs3dModelVisible] = React.useState(false);
    const [measurements, setMeasurements] = React.useState<any[]>([]);

    const drawingForm = useForm<DrawingFormValues>({ resolver: zodResolver(drawingSchema) });
    const boqForm = useForm<BoqFormValues>({ resolver: zodResolver(boqSchema) });
    const measurementForm = useForm<MeasurementFormValues>({ resolver: zodResolver(measurementSchema) });

    function onDrawingUpload(values: DrawingFormValues) {
        if (values.drawingFile) {
            setDrawingFileName(values.drawingFile.name);
            setIs3dModelVisible(false);
            setMeasurements([]);
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
                { id: 1, type: 'Excavation', description: 'Foundation Footing F1', value: '15.0 m³' },
                { id: 2, type: 'Excavation', description: 'Foundation Footing F2', value: '22.5 m³' },
            ];
        } else if (selectedType === 'Plastering') {
            mockData = [
                { id: 1, type: 'Plastering', description: 'Internal Wall - Room 101', value: '85.2 m²' },
                { id: 2, type: 'Plastering', description: 'External Wall - North Face', value: '120.0 m²' },
            ];
        } else if (selectedType === 'Concrete') {
            mockData = [
                 { id: 1, type: 'Concrete', description: 'Slab S1', value: '12.0 m³' },
                 { id: 2, type: 'Concrete', description: 'Column C1', value: '2.5 m³' },
            ];
        } else { // Overall or other types
            mockData = [
                { id: 1, type: 'Excavation', description: 'Foundation Footings', value: '150.0 m³' },
                { id: 2, type: 'Concrete', description: 'Foundations & Slabs', value: '75.2 m³' },
                { id: 3, type: 'Plastering', description: 'Total Internal Walls', value: '850.0 m²' },
            ];
        }

        setMeasurements(mockData);
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
        toast({ title: 'BOQ & Estimation Generated', description: 'A standard format BOQ has been created and is ready for download.' });
    }

    function onBoqUpload(values: BoqFormValues) {
        if (values.boqFile) {
            toast({
                title: 'BOQ Uploaded',
                description: `${values.boqFile.name} has been uploaded successfully.`,
            });
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <Layers /> Tender Department Tools
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 2D/3D AutoCAD Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle>2D to 3D AutoCAD Conversion</CardTitle>
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
                        <CardTitle>Measurement & BOQ Generation</CardTitle>
                        <CardDescription>Extract measurements and generate a Bill of Quantities from the uploaded drawing.</CardDescription>
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
                                        <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {measurements.map(m => (
                                                <TableRow key={m.id}><TableCell>{m.type}</TableCell><TableCell>{m.description}</TableCell><TableCell>{m.value}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Button onClick={onGenerateBoq} className="w-full"><FileText className="mr-2"/>Generate Estimation and BOQ</Button>
                            </div>
                       )}
                    </CardContent>
                </Card>

                 {/* BOQ Upload */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>BOQ Upload</CardTitle>
                        <CardDescription>Upload an existing Bill of Quantities file for analysis or record-keeping.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...boqForm}>
                            <form onSubmit={boqForm.handleSubmit(onBoqUpload)} className="flex items-end gap-4">
                                <FormField
                                    control={boqForm.control}
                                    name="boqFile"
                                    render={({ field: { onChange, value, ...rest } }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>BOQ File (.xlsx, .csv)</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => onChange(e.target.files?.[0])} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit"><Upload className="mr-2"/>Upload BOQ</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
