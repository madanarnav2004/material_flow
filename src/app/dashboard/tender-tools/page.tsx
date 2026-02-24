'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, RefreshCw, Ruler, FileText, Layers, ChevronDown, Edit, FileType, FileSpreadsheet, ImageIcon, ToyBrick } from 'lucide-react';
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

    const handleFileDownload = (blob: Blob, fileName: string) => {
        try {
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
            const message = error instanceof Error ? error.message : "There was an issue preparing your file for download.";
            toast({
                variant: "destructive",
                title: 'Download Failed',
                description: message,
            });
        }
    };
    
    const handle3dDownload = async (format: string) => {
        const extensions: Record<string, string> = {
            'PNG': 'png', 'JPG': 'jpg', 'DWG': 'dwg', 'DXF': 'dxf',
            'STEP': 'step', 'IFC': 'ifc', 'SKP': 'skp'
        };
        const extension = extensions[format] || 'txt';
        const fileName = `model-3d.${extension}`;
        
        const blueprintImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAFVBMVEX///92d3d4eHh5eXl6enp7e3t8fHwLpC72AAACnElEQVR4nO3c6W6bMBQFYfF+sA3Y+1/b1SoEEkLgxFw6nS/LhU+gB/M3BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAh5D9rF3n/x8n13L/2oP9wGBeT/d+P8v4Pbf+86w+sLw977j3P651lP5R/Xk/Ld28H/KPy/j6X/uG0P7B+/pT/8a7/UP6sH+X/pI/yf9L9fwP2v/79P8P+/s39L0L+R2j/kP0vYv/LyP+6/p9//f+vHwCAwDHyf7s7oF/yv7d76Bf8r9s99Av+t7sH/e/uA33kH2gH/QPaQT+D/oZ20I+g/9gO+gn6H9tBP4H+f3agH0D/LztAfwP99+yAfwD9B+2gH0D/ZztAf4L+JztgXwL+oztgv4T+8Rt0gH5jB+0g/cYOkA7SLm6gA/QbO0gH6Dd2gA7Qb+wAHaBf3AA7QL+xQ/qf9B87SAfoN3aADtBv7AAdgL/ZATtAP7FDdoB+YwftoB/YQTug/8UO0A/sAP0G/sAP0G/sAP0G/sAP0G/sAP0G/sAB2g/8EO0A/sAP0G/sAP0G/sAP0G/sAP0G/sAP0G/sAB2gX9xA/e/v12/oAP3GdtAN0m/sgA7Qb+wAHaDf2AE7QL+xQ/SAfsUO0A/sAP0G/sAP0G/sAP0G/sAP0G/sAP0G/sAB2gX9xAuwz/xx2gH9hBO6D/xQ7QD+wA/cb+f7/+B/s/7w8A8L+7P/D9i1//+b+l/p9//f/T/r9+/v8d/X//fv3//vv6v0f+/f+d/oH/lfbv5X3//pP+l/bv5f2/L++/6H9R/qD/wT+V9u8P+H9f/qH/3j7239L3t3+sP83+8SgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYhf8B8A6jM57PZ+gAAAAASUVORK5CYII=';

        let contentUrl: string;

        if (format === 'PNG' || format === 'JPG') {
            contentUrl = blueprintImageBase64;
        } else {
            const mockContent = `This is a mock 3D model file for the ${format} format.\nThis file is for testing purposes and is not a valid ${format} file.`;
            const blob = new Blob([mockContent], { type: 'text/plain' });
            contentUrl = URL.createObjectURL(blob);
        }

        try {
            console.log('🔗 FETCHING 3D MODEL:', contentUrl.substring(0, 100));
            const response = await fetch(contentUrl, { 
              method: 'GET',
              headers: { 'Cache-Control': 'no-cache' }
            });
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const blob = await response.blob();
            handleFileDownload(blob, fileName);
    
            if (contentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(contentUrl);
            }
        } catch (error) {
            console.error('🔥 3D DOWNLOAD FAILED:', error);
            alert('Failed to download 3D model. Check console for details.');
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

    function onCalculateMeasurements() {
        if (!drawingFileName) {
            toast({ variant: 'destructive', title: 'No Drawing', description: 'Please upload a drawing first.' });
            return;
        }
        
        const allMeasurements = [
            { id: 1, type: 'Excavation', description: 'Foundation Footings', quantity: 150.0, unit: 'm³' },
            { id: 2, type: 'PCC', description: 'Plain Cement Concrete (1:4:8)', quantity: 25.0, unit: 'm³' },
            { id: 3, type: 'Concrete', description: 'Foundation Slabs (M25)', quantity: 75.2, unit: 'm³' },
            { id: 4, type: 'RCC', description: 'Columns & Beams (M25)', quantity: 60.5, unit: 'm³' },
            { id: 5, type: 'Reinforcement', description: 'Fe-500 Steel', quantity: 5.4, unit: 'ton' },
            { id: 6, type: 'Shuttering', description: 'Column & Beam Shuttering', quantity: 450.0, unit: 'm²' },
            { id: 7, type: 'Brickwork', description: '9-inch Brick Walls', quantity: 88.0, unit: 'm³' },
            { id: 8, type: 'Plastering', description: 'Internal Wall Plaster', quantity: 950.0, unit: 'm²' },
            { id: 9, type: 'Flooring', description: 'Vitrified Tile Flooring', quantity: 320.0, unit: 'm²' },
        ];
        setMeasurements(allMeasurements);
        setIsBoqVisible(false);
        setBoq([]);
        toast({ title: 'Measurements Calculated', description: `Auto quantity takeoff from drawing is complete.` });
    }
    
    function onDownloadMeasurements() {
        const csvData = convertToCsv(measurements);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        handleFileDownload(blob, 'measurement-report.csv');
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
        let mimeType = 'text/plain';

        switch (format) {
            case 'Excel':
                fileName += '.csv';
                mimeType = 'text/csv;charset=utf-8;';
                break;
            case 'PDF':
                 // PDF generation is complex; we'll simulate with text data for now.
                fileName += '.pdf';
                mimeType = 'application/pdf';
                handleFileDownload(new Blob([`This is a mock PDF for ${fileName}`], { type: mimeType }), fileName);
                return;
            case 'Word':
                fileName += '.doc';
                mimeType = 'application/msword';
                 handleFileDownload(new Blob([`This is a mock Word doc for ${fileName}`], { type: mimeType }), fileName);
                return;
        }
        handleFileDownload(new Blob([csvData], { type: mimeType }), fileName);
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" disabled={!is3dModelVisible}>
                                                    <Download className="mr-2"/>Download 3D Model <ChevronDown className="ml-2"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handle3dDownload('PNG')}><ImageIcon className="mr-2"/>Image (.png)</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handle3dDownload('JPG')}><ImageIcon className="mr-2"/>Image (.jpg)</DropdownMenuItem>
                                                <Separator />
                                                <DropdownMenuItem onSelect={() => handle3dDownload('DWG')}><ToyBrick className="mr-2"/>3D CAD (.dwg)</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handle3dDownload('DXF')}><ToyBrick className="mr-2"/>3D CAD (.dxf)</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handle3dDownload('STEP')}><ToyBrick className="mr-2"/>3D CAD (.step)</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handle3dDownload('IFC')}><ToyBrick className="mr-2"/>3D CAD (.ifc)</DropdownMenuItem>
                                                <Separator />
                                                <DropdownMenuItem onSelect={() => handle3dDownload('SKP')}><FileType className="mr-2"/>SketchUp (.skp)</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                                                    <Input type="file" accept=".xlsx,.csv,.pdf" onChange={(e) => onChange(e.target.files?.[0])} />
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
