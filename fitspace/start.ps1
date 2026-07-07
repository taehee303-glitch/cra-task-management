# FitSpace — personal local server
$Port = 8765
$Root = $PSScriptRoot
Write-Host ""
Write-Host "  FitSpace personal app" -ForegroundColor Green
Write-Host "  http://127.0.0.1:$Port/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PC: 브라우저에서 위 주소 열기" -ForegroundColor Gray
Write-Host "  폰(같은 Wi-Fi): http://$(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Select-Object -First 1 -ExpandProperty IPAddress):$Port/" -ForegroundColor Gray
Write-Host "  종료: Ctrl+C" -ForegroundColor Gray
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Prefixes.Add("http://+:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "포트 $Port 사용 중이거나 권한이 필요합니다. 관리자 PowerShell에서 다시 실행하거나 포트를 변경하세요." -ForegroundColor Yellow
  $listener.Prefixes.Clear()
  $listener.Prefixes.Add("http://127.0.0.1:$Port/")
  $listener.Start()
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
  $fp = Join-Path $Root ($rel -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (Test-Path $fp -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($fp)
    $mime = switch ($ext) {
      '.html' { 'text/html; charset=utf-8' }
      '.js' { 'application/javascript; charset=utf-8' }
      '.css' { 'text/css; charset=utf-8' }
      '.svg' { 'image/svg+xml' }
      '.webmanifest' { 'application/manifest+json' }
      default { 'application/octet-stream' }
    }
    $res.ContentType = $mime
    $bytes = [IO.File]::ReadAllBytes($fp)
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
  }
  $res.Close()
}
