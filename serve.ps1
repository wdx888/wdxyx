param([int]$Port = 3000)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  CyberTank Arena - Local Server' -ForegroundColor Magenta
Write-Host ('  http://localhost:' + $Port) -ForegroundColor Green
Write-Host '  Press Ctrl+C to stop' -ForegroundColor Yellow
Write-Host '============================================' -ForegroundColor Cyan

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.mjs'  = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath
        if ($localPath -eq '/') {
            $localPath = '/index.html'
        }

        $filePath = Join-Path $root $localPath.TrimStart('/')

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) {
                $mime = 'application/octet-stream'
            }

            $response.ContentType = $mime
            $response.Headers.Add('Access-Control-Allow-Origin', '*')
            $response.Headers.Add('Cache-Control', 'no-cache')

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found: ' + $localPath)
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }

        $response.Close()
    }
    catch {
        # Ignore client disconnects
    }
}

$listener.Stop()