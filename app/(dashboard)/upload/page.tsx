"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(10);
    
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      setProgress(50);
      const json = await res.json();
      setProgress(100);
      setSuccess(true);
      
      // Redirect after a short delay to show success
      setTimeout(() => {
        window.location.href = `/document/${json.documentId}`;
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Upload Document</h1>
        <p className="text-muted-foreground">Upload your study materials for AI-powered analysis</p>
      </div>
      
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-8 text-center hover:border-blue-400 transition-all duration-300 hover:bg-blue-50/50">
            <input 
              type="file" 
              accept=".pdf,.txt,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp" 
              onChange={onSelect}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <FileText className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-400 mb-4 transition-colors duration-200 hover:text-blue-500" />
              <p className="text-base md:text-lg font-medium mb-2">Choose a file or drag it here</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                PDF, DOCX, DOC, TXT, JPG, PNG, GIF, WEBP • Max 10MB
              </p>
            </label>
          </div>

          {file && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 border border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="text-3xl md:text-4xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">{file.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{file.type.split('/')[1].toUpperCase()}</Badge>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm md:text-base font-medium">Processing your document...</span>
              </div>
              <Progress value={progress} className="w-full h-2" />
              <p className="text-xs text-muted-foreground text-center">This may take a few moments</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-600">Upload successful! Redirecting...</span>
            </div>
          )}

          <Button 
            onClick={onUpload} 
            disabled={!file || uploading || success}
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
            size="lg"
          >
            {uploading ? 'Processing...' : success ? 'Success!' : 'Upload Document'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


