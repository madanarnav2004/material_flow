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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, RefreshCw, Ruler, FileText, Layers, ChevronDown, Edit, FileType, FileSpreadsheet } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const fileSchema = (typeof window !== 'undefined' ? z.instanceof(File) : z.any()).optional();

const drawingSchema = z.object({
  drawingFile: fileSchema.refine(file => file, 'A drawing file is required.'),
});
type DrawingFormValues = z.infer<typeof drawingSchema>;

const boqUploadSchema = z.object({
  boqFile: fileSchema.refine(file => file, 'A BOQ file is required.'),
});
type BoqUploadFormValues = z.infer<typeof boqUploadSchema>;

export default function TenderToolsPage() {
    const { toast } = useToast();
    const [drawingFileName, setDrawingFileName] = React.useState<string | null>(null);
    const [is3dModelVisible, setIs3dModelVisible] = React.useState(false);
    const [measurements, setMeasurements] = React.useState<any[]>([]);
    const [boq, setBoq] = React.useState<any[]>([]);
    const [isBoqVisible, setIsBoqVisible] = React.useState(false);
    const [isBoqEditable, setIsBoqEditable] = React.useState(true);

    const drawingForm = useForm<DrawingFormValues>({ resolver: zodResolver(drawingSchema) });
    const boqUploadForm = useForm<BoqUploadFormValues>({ resolver: zodResolver(boqUploadSchema) });

    const handleFileDownload = (content: string, fileName: string, mimeType: string) => {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({
                title: 'Download Started',
                description: `Your file ${fileName} is downloading.`,
            });
        } catch (error) {
            console.error("Download failed:", error);
            toast({
                variant: "destructive",
                title: 'Download Failed',
                description: 'There was an issue preparing your file for download.',
            });
        }
    };

    const convertToCsv = (data: any[]) => {
        if (!data || data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    JSON.stringify(row[header] ?? '')
                ).join(',')
            )
        ];
        return csvRows.join('\n');
    };

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
            title: 'Conversion Complete',
            description: 'Your 2D drawing has been converted to a 3D model.',
        });
    }

    function onDownload3d() {
        handleFileDownload('Mock 3D Model Data', 'model-3d.obj', 'text/plain');
    }

    function onCalculateMeasurements() {
        if (!drawingFileName) {
            toast({ variant: 'destructive', title: 'No Drawing', description: 'Please upload a drawing first.' });
            return;
        }
        
        const allMeasurements = [
            { id: 1, type: 'Excavation', description: 'Foundation Footings', quantity: 150.0, unit: 'm³' },
            { id: 2, type: 'Concrete', description: 'Foundation Slabs (M25)', quantity: 75.2, unit: 'm³' },
            { id: 3, type: 'Reinforcement', description: 'Fe-500 Steel', quantity: 5.4, unit: 'ton' },
            { id: 4, type: 'Shuttering', description: 'Column & Beam Shuttering', quantity: 450.0, unit: 'm²' },
            { id: 5, type: 'Brickwork', description: '9-inch Brick Walls', quantity: 88.0, unit: 'm³' },
            { id: 6, type: 'Plastering', description: 'Internal Wall Plaster', quantity: 950.0, unit: 'm²' },
            { id: 7, type: 'Flooring', description: 'Vitrified Tile Flooring', quantity: 320.0, unit: 'm²' },
        ];
        setMeasurements(allMeasurements);
        setIsBoqVisible(false);
        setBoq([]);
        toast({ title: 'Measurements Calculated', description: `Auto quantity takeoff from drawing is complete.` });
    }
    
    function onDownloadMeasurements() {
        const csvData = convertToCsv(measurements);
        handleFileDownload(csvData, 'measurement-report.csv', 'text/csv;charset=utf-8;');
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
            rate: Math.floor(Math.random() * 500) + 50,
        }));
        setBoq(newBoq);
        setIsBoqVisible(true);
        setIsBoqEditable(true);
        toast({ title: 'BOQ Generated', description: 'A standard BOQ has been created from the measurements.' });
    }

    function onBoqUpload(values: BoqUploadFormValues) {
        if (values.boqFile) {
            toast({
                title: 'BOQ Uploaded',
                description: `${values.boqFile.name} processed. Review the editable table below.`,
            });
            const newBoq = [
                { id: 1, description: 'Uploaded: Site Clearing', quantity: 1, unit: 'LS', rate: 5000 },
                { id: 2, description: 'Uploaded: Bulk Earthworks', quantity: 250, unit: 'm³', rate: 45 },
                { id: 3, description: 'Uploaded: Reinforcement Steel (High-Yield)', quantity: 15, unit: 'ton', rate: 950 },
            ];
            setBoq(newBoq);
            setMeasurements([]);
            setIsBoqVisible(true);
            setIsBoqEditable(true);
        }
    }

    const handleBoqChange = (index: number, field: 'quantity' | 'rate', value: string) => {
        const updatedBoq = [...boq];
        const numericValue = parseFloat(value) || 0;
        updatedBoq[index] = { ...updatedBoq[index], [field]: numericValue };
        setBoq(updatedBoq);
    };

    const handleDownloadBoq = (format: 'Excel' | 'PDF' | 'Word') => {
        const csvData = convertToCsv(boq.map(item => ({ ...item, Amount: (item.quantity * item.rate).toFixed(2) })));
        let fileName = 'boq-report';
        let mimeType = '';

        switch (format) {
            case 'Excel':
                fileName += '.csv';
                mimeType = 'text/csv;charset=utf-8;';
                break;
            case 'PDF':
                fileName += '.pdf';
                mimeType = 'application/pdf';
                // PDF generation is complex; we'll simulate with CSV data for now.
                break;
            case 'Word':
                fileName += '.doc';
                mimeType = 'application/msword';
                break;
        }
        handleFileDownload(csvData, fileName, mimeType);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <Layers /> Tender Department Tools
            </h1>

            <Card>
                <CardHeader>
                    <CardTitle>Step 1: Upload 2D AutoCAD Drawing</CardTitle>
                    <CardDescription>Upload a 2D drawing (.dwg, .dxf) to begin the process.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...drawingForm}>
                        <form onSubmit={drawingForm.handleSubmit(onDrawingUpload)} className="space-y-4">
                            <FormField
                                control={drawingForm.control}
                                name="drawingFile"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input type="file" accept=".dwg, .dxf" onChange={(e) => onChange(e.target.files?.[0])} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">
                                <Upload className="mr-2"/>Upload Drawing
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {drawingFileName && (
              <>
                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: 3D Conversion &amp; Quantity Takeoff</CardTitle>
                        <CardDescription>Generate a 3D model and automatically extract measurements from the uploaded drawing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg space-y-4">
                            <h4 className="font-semibold">Processed Drawing: <span className="font-normal text-muted-foreground">{drawingFileName}</span></h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Convert to a 3D model for visualization and download.</p>
                                    <div className="flex gap-2">
                                        <Button onClick={onConvertTo3d}><RefreshCw className="mr-2"/>Convert to 3D</Button>
                                        <Button onClick={onDownload3d} variant="outline" disabled={!is3dModelVisible}><Download className="mr-2"/>Download 3D</Button>
                                    </div>
                                    {is3dModelVisible && (
                                        <div className="w-full h-32 bg-secondary rounded-lg flex items-center justify-center mt-4">
                                            <p className="text-muted-foreground text-sm">3D Model Preview</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Extract all BOQ-related quantities automatically.</p>
                                    <Button onClick={onCalculateMeasurements}><Ruler className="mr-2"/>Auto Quantity Takeoff</Button>
                                </div>
                            </div>
                        </div>

                       {measurements.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <Separator />
                                <div className="flex justify-between items-center">
                                     <h4 className="font-semibold">Extracted Measurements Report</h4>
                                     <Button onClick={onDownloadMeasurements} variant="outline" size="sm"><Download className="mr-2"/>Download Report</Button>
                                </div>
                                <div className="max-h-60 overflow-y-auto border rounded-md">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Item Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Quantity</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {measurements.map(m => (
                                                <TableRow key={m.id}><TableCell>{m.type}</TableCell><TableCell>{m.description}</TableCell><TableCell className="text-right">{`${m.quantity} ${m.unit}`}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                       )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Generate or Upload BOQ</CardTitle>
                        <CardDescription>Create a Bill of Quantities from the extracted measurements or upload your own file.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-4 p-4 border rounded-lg h-full flex flex-col justify-between">
                            <div>
                                <h4 className="font-semibold">Generate Standard BOQ</h4>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Use the measurements from Step 2 to automatically create a standard BOQ.
                                </p>
                            </div>
                            <Button onClick={onGenerateBoq} disabled={measurements.length === 0}>
                                <FileText className="mr-2"/>Generate Standard BOQ
                            </Button>
                        </div>
                        <div className="space-y-4 p-4 border rounded-lg h-full">
                            <h4 className="font-semibold">Upload Custom BOQ</h4>
                            <p className="text-sm text-muted-foreground">
                                Upload your pre-existing BOQ file. The system will attempt to map quantities if possible.
                            </p>
                             <Form {...boqUploadForm}>
                                <form onSubmit={boqUploadForm.handleSubmit(onBoqUpload)} className="space-y-4">
                                    <FormField
                                        control={boqUploadForm.control}
                                        name="boqFile"
                                        render={({ field: { onChange } }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="file" accept=".xlsx,.csv" onChange={(e) => onChange(e.target.files?.[0])} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full">
                                        <FileSpreadsheet className="mr-2"/>Upload Custom BOQ
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </CardContent>
                </Card>
              </>
            )}

            {isBoqVisible && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex-grow">
                                <CardTitle>Step 4: Finalize and Download BOQ</CardTitle>
                                <CardDescription>Review and edit the Bill of Quantities below. Rates and quantities are editable.</CardDescription>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            <Edit className="mr-2" />
                                            {isBoqEditable ? 'Editable' : 'Locked'}
                                            <ChevronDown className="ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => setIsBoqEditable(true)}>Enable Editing</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setIsBoqEditable(false)}>Lock (Read-only)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button>
                                            <Download className="mr-2" />
                                            Download BOQ
                                            <ChevronDown className="ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => handleDownloadBoq('Excel')}><FileSpreadsheet className="mr-2"/>Excel (.csv)</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDownloadBoq('PDF')}><FileType className="mr-2"/>PDF (.pdf)</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDownloadBoq('Word')}><FileText className="mr-2"/>Word (.doc)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
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
                                                    disabled={!isBoqEditable}
                                                />
                                            </TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleBoqChange(index, 'rate', e.target.value)}
                                                    className="h-8"
                                                    disabled={!isBoqEditable}
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
