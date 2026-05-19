if (!(Test-Path "index.html")) {
  Write-Error "No encuentro index.html. Ejecuta este script desde la raíz del proyecto."
  exit 1
}
Copy-Item "index.html" "index.html.bak-v4.9.35" -Force
$content = Get-Content "index.html" -Raw
$content = $content.Replace('<title>Conecta Servicios v4.9.35</title>', '<title>Conecta Servicios v4.9.36</title>')
$content = $content.Replace('styles.css?v=4.9.35-landing-embajadores', 'styles.css?v=4.9.36-final-acceso-membresias')
$content = $content.Replace('data-version="4.9.35-landing-embajadores"', 'data-version="4.9.36-final-acceso-membresias"')
$content = $content.Replace('app.js?v=4.9.35-landing-embajadores', 'app.js?v=4.9.36-final-acceso-membresias')
Set-Content "index.html" $content -Encoding UTF8
Write-Host "index.html actualizado a v4.9.36-final-acceso-membresias"
