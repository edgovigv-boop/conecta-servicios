$Version = "4.9.36.8-chat-negocio-membresia-admin"
Copy-Item .\app.js .\app.js -Force
Copy-Item .\styles.css .\styles.css -Force
Copy-Item .\service-worker.js .\service-worker.js -Force
Copy-Item .\manifest.json .\manifest.json -Force
Copy-Item .\vercel.json .\vercel.json -Force
if (Test-Path .\index.html) {
  $s = Get-Content .\index.html -Raw
  $s = $s -replace 'styles\.css\?v=[^"'']+', "styles.css?v=$Version"
  $s = $s -replace 'app\.js\?v=[^"'']+', "app.js?v=$Version"
  $s = $s -replace 'data-version="[^"]*"', "data-version=`"$Version`""
  Set-Content .\index.html $s -Encoding UTF8
}
