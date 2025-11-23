import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { getServerBase } from '@/lib/api';

export default function ExtensionDownload(){
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(){
    setError(null);
    setDownloading(true);
    try{
      const base = getServerBase();
      const res = await fetch(`${base}/api/extension.zip`);
      if (!res.ok) throw new Error('download_failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'focusnest-extension.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }catch(e){ setError('Failed to download'); }
    setDownloading(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Download Extension</h1>
        <p className="text-muted-foreground mt-2">Get the FocusNest browser extension and load it in Chrome or Edge</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extension Package</CardTitle>
          <CardDescription>Download a ZIP of the extension folder</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? 'Downloading...' : 'Download Extension'}
            </Button>
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p className="font-medium">Load as Unpacked (Chrome/Edge):</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Extract the ZIP to a folder</li>
              <li>Open <code>chrome://extensions</code> or <code>edge://extensions</code></li>
              <li>Enable Developer mode</li>
              <li>Click "Load unpacked" and select the extracted folder</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
