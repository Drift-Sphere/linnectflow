# Create Icons for LinnectFlow
# This script generates simple placeholder icons using PowerShell .NET integration
# to fix the "missing icon" error when loading the extension

$iconDir = "$PSScriptRoot\assets\icons"

# Ensure directory exists
if (-not (Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir -Force
}

Add-Type -AssemblyName System.Drawing

function New-Icon {
    param (
        [int]$size,
        [string]$path
    )

    # Create bitmap
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Enable high quality drawing
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background (LinkedIn Blue gradient-ish)
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, 
    ([System.Drawing.Color]::FromArgb(10, 102, 194)), 
    ([System.Drawing.Color]::FromArgb(0, 75, 150)), 
    45

    $graphics.FillRectangle($brush, $rect)

    # Draw "AI" text
    if ($size -ge 16) {
        $fontSize = $size / 2.5
        $font = New-Object System.Drawing.Font "Arial", $fontSize, [System.Drawing.FontStyle]::Bold
        $textBrush = [System.Drawing.Brushes]::White
        
        $stringFormat = New-Object System.Drawing.StringFormat
        $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
        $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

        $graphics.DrawString("AI", $font, $textBrush, $rect, $stringFormat)
    }

    # Save
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bmp.Dispose()
    
    Write-Host "Created $path"
}

# Generate required sizes
New-Icon -size 16 -path "$iconDir\icon16.png"
New-Icon -size 32 -path "$iconDir\icon32.png"
New-Icon -size 48 -path "$iconDir\icon48.png"
New-Icon -size 128 -path "$iconDir\icon128.png"

Write-Host "All icons created successfully!"
