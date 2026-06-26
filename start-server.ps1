# CRA Task Manager - local dev server (no Node/Python required)
# PC + phone must be on the same Wi-Fi. Phone cannot use 127.0.0.1 (that is the phone itself).
$Port = 5500
$Root = $PSScriptRoot

function Get-MimeType($ext) {
  switch ($ext.ToLower()) {
    ".html" { return "text/html; charset=utf-8" }
    ".js"   { return "application/javascript; charset=utf-8" }
    ".css"  { return "text/css; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".webmanifest" { return "application/manifest+json; charset=utf-8" }
    ".svg"  { return "image/svg+xml" }
    ".png"  { return "image/png" }
    ".ico"  { return "image/x-icon" }
    default { return "application/octet-stream" }
  }
}

function Get-LanIpAddresses {
  try {
    return @(
      Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
        Where-Object {
          $_.IPAddress -notlike "127.*" -and
          $_.IPAddress -notlike "169.254.*" -and
          $_.PrefixOrigin -ne "WellKnown"
        } |
        Select-Object -ExpandProperty IPAddress -Unique
    )
  } catch {
    return @()
  }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Prefixes.Add("http://localhost:$Port/")

$lanIps = Get-LanIpAddresses
foreach ($lanIp in $lanIps) {
  $listener.Prefixes.Add("http://${lanIp}:$Port/")
}

try {
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "Cannot start server on port $Port"
  Write-Host $_.Exception.Message
  Write-Host ""
  Write-Host "If mobile access failed before, run PowerShell as Administrator once:"
  Write-Host "  netsh http add urlacl url=http://+:$Port/ user=Everyone"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "CRA Task Manager running at:"
Write-Host "  PC:     http://127.0.0.1:$Port/"
Write-Host "  PC:     http://localhost:$Port/"
if ($lanIps.Count -gt 0) {
  Write-Host ""
  Write-Host "  Phone (same Wi-Fi only — do NOT use 127.0.0.1 on phone):"
  foreach ($lanIp in $lanIps) {
    Write-Host "          http://${lanIp}:$Port/" -ForegroundColor Green
  }
} else {
  Write-Host ""
  Write-Host "  LAN IP not found. Connect Wi-Fi/Ethernet for phone access."
}
Write-Host ""
Write-Host "Press Ctrl+C to stop."
Write-Host ""

if ($lanIps.Count -gt 0) {
  Set-Content -Path (Join-Path $Root "mobile-host.txt") -Value $lanIps[0] -Encoding ASCII -NoNewline
}

$fullRoot = (Resolve-Path $Root).Path

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  try {
    $relative = [Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relative)) {
      $relative = "index.html"
    }

    $filePath = Join-Path $Root ($relative -replace "/", [IO.Path]::DirectorySeparatorChar)

    if (-not (Test-Path $filePath -PathType Leaf) -or -not $filePath.StartsWith($fullRoot, [StringComparison]::OrdinalIgnoreCase)) {
      $response.StatusCode = 404
      $body = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $response.ContentType = "text/plain; charset=utf-8"
      $response.OutputStream.Write($body, 0, $body.Length)
    } else {
      $ext = [IO.Path]::GetExtension($filePath)
      $response.ContentType = Get-MimeType $ext
      $bytes = [IO.File]::ReadAllBytes($filePath)
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $response.StatusCode = 500
  } finally {
    $response.Close()
  }
}
