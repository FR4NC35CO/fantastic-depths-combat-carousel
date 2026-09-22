$moduleRoot = $PSScriptRoot
$zipPath = Join-Path $moduleRoot 'fantastic-depths-combat-carousel.zip'
$stagingPath = Join-Path ([System.IO.Path]::GetTempPath()) "fdcc-release-$([guid]::NewGuid().ToString('N'))"
$releasePaths = @(
  'module.json',
  'scripts\main.mjs',
  'scripts\CombatCarousel.mjs',
  'scripts\CombatantCard.mjs',
  'scripts\settings.mjs',
  'styles\combat-carousel.css',
  'lang\en.json',
  'lang\it.json'
)

try {
  New-Item -ItemType Directory -Path $stagingPath -Force | Out-Null
  foreach ($relativePath in $releasePaths) {
    $sourcePath = Join-Path $moduleRoot $relativePath
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
      throw "Required release file is missing: $relativePath"
    }
    $targetPath = Join-Path $stagingPath $relativePath
    New-Item -ItemType Directory -Path (Split-Path -Parent $targetPath) -Force | Out-Null
    Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
  }
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Compress-Archive -Path (Join-Path $stagingPath '*') -DestinationPath $zipPath -CompressionLevel Optimal
  Write-Host "Release package created: $zipPath" -ForegroundColor Green
} finally {
  if (Test-Path -LiteralPath $stagingPath) {
    Remove-Item -LiteralPath $stagingPath -Recurse -Force
  }
}
