
Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\zurie\.gemini\antigravity\brain\3625da5d-495d-4239-bb72-67d228710c1d\uploaded_image_1767712323038.png"
$destDir = "d:\linkedin-ai-tool\assets\icons"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir
}

$sizes = @(16, 32, 48, 128)
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

foreach ($size in $sizes) {
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $destImage = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $graphics.DrawImage($sourceImage, $rect)
    
    $destPath = Join-Path $destDir "icon$size.png"
    $destImage.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Created $destPath"
    
    $graphics.Dispose()
    $destImage.Dispose()
}

$sourceImage.Dispose()
Write-Host "All icons tasks finished."
