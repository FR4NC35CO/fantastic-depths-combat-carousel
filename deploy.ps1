# Deploy script: copies module files to Foundry VTT v14 installation
$src = "D:\RPG GdR\Fantastic Depths\Macros\FaDe PG al Volo\CascadeProjects\windsurf-project\fantastic-depths-combat-carousel"
$dst = "C:\Users\Francesco\AppData\Local\FoundryVTT\Data\modules\fantastic-depths-combat-carousel"

Copy-Item "$src\module.json" "$dst\module.json" -Force
Copy-Item "$src\scripts\main.mjs" "$dst\scripts\main.mjs" -Force
Copy-Item "$src\scripts\CombatCarousel.mjs" "$dst\scripts\CombatCarousel.mjs" -Force
Copy-Item "$src\scripts\CombatantCard.mjs" "$dst\scripts\CombatantCard.mjs" -Force
Copy-Item "$src\scripts\settings.mjs" "$dst\scripts\settings.mjs" -Force

Write-Host "Deploy completato." -ForegroundColor Green
