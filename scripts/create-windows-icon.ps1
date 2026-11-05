param(
  [string]$SourcePath = "$PSScriptRoot\..\src\assets\drain-baby.png",
  [string]$OutputPath = "$PSScriptRoot\..\assets\drainamp.ico"
)

Add-Type -AssemblyName System.Drawing

$resolvedSourcePath = [System.IO.Path]::GetFullPath($SourcePath)
$resolvedOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($resolvedOutputPath)

# Create the output folder when this script is run in a fresh copy of the project.
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null

$sourceImage = [System.Drawing.Image]::FromFile($resolvedSourcePath)
$iconBitmap = [System.Drawing.Bitmap]::new(256, 256)
$graphics = [System.Drawing.Graphics]::FromImage($iconBitmap)
$pngStream = [System.IO.MemoryStream]::new()
$icoStream = [System.IO.MemoryStream]::new()
$writer = [System.IO.BinaryWriter]::new($icoStream)

try {
  # High-quality interpolation prevents the 225px source from looking jagged at 256px.
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($sourceImage, 0, 0, 256, 256)

  $iconBitmap.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
  $pngBytes = $pngStream.ToArray()

  # An ICO file starts with a small directory that describes each embedded image.
  # A width or height byte of 0 represents 256 pixels in the ICO format.
  $writer.Write([uint16]0)
  $writer.Write([uint16]1)
  $writer.Write([uint16]1)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([uint16]1)
  $writer.Write([uint16]32)
  $writer.Write([uint32]$pngBytes.Length)
  $writer.Write([uint32]22)
  $writer.Write($pngBytes)
  $writer.Flush()

  [System.IO.File]::WriteAllBytes($resolvedOutputPath, $icoStream.ToArray())
  Write-Output "Created $resolvedOutputPath"
}
finally {
  $writer.Dispose()
  $icoStream.Dispose()
  $pngStream.Dispose()
  $graphics.Dispose()
  $iconBitmap.Dispose()
  $sourceImage.Dispose()
}
