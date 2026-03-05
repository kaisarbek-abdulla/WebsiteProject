<#
Open the local Node.js server port (5000) in Windows Firewall and print local IP.

Run as Administrator from project root:
    .\scripts\open-port.ps1

This script:
- Adds an inbound firewall rule for TCP port 5000 (if not already present)
- Prints the primary IPv4 address to help you connect from other devices
#>

param(
    [int]$Port = 5000,
    [string]$RuleName = "WebsiteProject-Allow-Node-5000"
)

Write-Host "Checking existing firewall rule..." -ForegroundColor Cyan
$existing = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "Creating firewall rule to allow incoming TCP on port $Port..." -ForegroundColor Green
    New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
    Write-Host "Firewall rule created." -ForegroundColor Green
} else {
    Write-Host "Firewall rule '$RuleName' already exists." -ForegroundColor Yellow
}

# Print the primary IPv4 address for the user
Write-Host ""
Write-Host "Local IPv4 addresses:" -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' } | ForEach-Object {
    Write-Host " - $($_.IPAddress)  (Interface: $($_.InterfaceAlias))" -ForegroundColor White
}

Write-Host "";
Write-Host "You can now open http://<PC_IP>:$Port/html/index.html from another device on the same network." -ForegroundColor Green
