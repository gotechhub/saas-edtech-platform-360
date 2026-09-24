param([string]$ProjectRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
$taskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Wait-WinRT($Operation, [Type]$ResultType) {
  $task = $taskMethod.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  $task.Wait()
  $task.Result
}
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$researchRoot = Join-Path $ProjectRoot 'docs\planning\research'
$tempImage = Join-Path $researchRoot 'ocr-header-working.png'
$resultRows = New-Object System.Collections.Generic.List[object]
$files = @(Get-ChildItem (Join-Path $ProjectRoot 'upsidelms-saas-screenshot') -Recurse -Filter '*.png' | Sort-Object FullName)
$count = 0
foreach ($file in $files) {
  try {
    $src = [System.Drawing.Image]::FromFile($file.FullName)
    $cropHeight = [math]::Min($src.Height, 320)
    $crop = New-Object System.Drawing.Bitmap $src.Width,$cropHeight
    $g = [System.Drawing.Graphics]::FromImage($crop)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0,0,$src.Width,$cropHeight), (New-Object System.Drawing.Rectangle 0,0,$src.Width,$cropHeight), [System.Drawing.GraphicsUnit]::Pixel)
    $sourceWidth=$src.Width; $sourceHeight=$src.Height
    $crop.Save($tempImage,[System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $crop.Dispose(); $src.Dispose()
    $sf = Wait-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($tempImage)) ([Windows.Storage.StorageFile])
    $stream = Wait-WinRT ($sf.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Wait-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Wait-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result = Wait-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    $resultRows.Add([pscustomobject]@{role=$file.Directory.Name;file=$file.Name;width=$sourceWidth;height=$sourceHeight;status='automated_header_triage';header_text=$result.Text})
    $bitmap.Dispose(); $stream.Dispose()
  } catch {
    $resultRows.Add([pscustomobject]@{role=$file.Directory.Name;file=$file.Name;width=0;height=0;status='ocr_failed';header_text=$_.Exception.Message})
  }
  $count++
  if ($count % 50 -eq 0) { Write-Output ('Processed '+$count+' / '+$files.Count) }
}
$resultRows | Export-Csv -LiteralPath (Join-Path $researchRoot 'screenshot-header-triage.csv') -NoTypeInformation -Encoding UTF8
Write-Output ('Completed '+$resultRows.Count+' headers; failed '+@($resultRows | Where-Object status -eq 'ocr_failed').Count)
