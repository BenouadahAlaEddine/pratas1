$ErrorActionPreference = "Stop"
$env:PORT = "5000"
$env:AUTH_SERVICE_URL = "http://localhost:3001"
$env:PRODUCTS_SERVICE_URL = "http://localhost:3002"
$env:ORDERS_SERVICE_URL = "http://localhost:3003"
$env:PAYMENTS_SERVICE_URL = "http://localhost:3004"
$env:NOTIFICATIONS_SERVICE_URL = "http://localhost:3005"
$env:JWT_SECRET = "shopwave-super-secret-jwt-key-2024-change-in-production"
$env:REFRESH_SECRET = "shopwave-refresh-secret-2024-change-in-production"

Write-Host "🚀 Démarrage de tous les services ShopWave..."
$base = Get-Location

function Start-Service {
    param([string]$path, [string]$title, [string]$port)
    $pathInjection = "[System.Environment]::SetEnvironmentVariable('Path', [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User'), 'Process');"
    Start-Process powershell -ArgumentList "-NoExit -Command `"$pathInjection cd '$base\$path'; `$env:PORT='$port'; npm run dev`"" -WindowStyle Normal -WorkingDirectory "$base\$path"
}

Start-Service "gateway" "Gateway" "5000"
Start-Service "services\auth" "Auth" "3001"
Start-Service "services\products" "Products" "3002"
Start-Service "services\orders" "Orders" "3003"
Start-Service "services\payments" "Payments" "3004"
Start-Service "services\notifications" "Notifications" "3005"
Start-Service "frontend" "Frontend" "4000"

Write-Host "✅ Les 7 services sont en cours de démarrage dans de nouvelles fenêtres !"
Write-Host "🌐 Frontend ouvert à: http://localhost:4000"
Write-Host "🚀 API Gateway à: http://localhost:5000"
