$commits = @(
    @{
        files = "client/public/ client/README.md client/src/main.jsx client/src/index.css client/src/App.css client/src/assets/"
        message = "chore(client): initialize React frontend foundation and styles"
    },
    @{
        files = "client/src/utils/trackInterpolation.js client/src/utils/zoneGenerator.js client/src/utils/conflictDetector.js"
        message = "feat(utils): add core simulation math for haversine interpolation and zone detection"
    },
    @{
        files = "client/src/hooks/"
        message = "feat(hooks): implement central useTrainSimulation engine state"
    },
    @{
        files = "client/src/components/MapView.jsx client/src/components/WeatherEffects.jsx"
        message = "feat(map): integrate Leaflet maps with dynamic weather and track rendering"
    },
    @{
        files = "client/src/components/Dashboard.jsx client/src/components/TokenPanel.jsx client/src/components/SplashScreen.jsx client/src/components/KanchanjungaOverlay.jsx"
        message = "feat(ui): build interactive dashboard, token status, and disaster overlays"
    },
    @{
        files = "server/models/ server/index.js server/routes/ server/sockets/"
        message = "feat(server): setup Express backend, MongoDB models, and Socket.io sync"
    },
    @{
        files = "simulation/"
        message = "feat(simulation): add backend standalone simulator for continuous loops"
    }
)

Write-Host "Starting automated GitHub commits... (1 commit every 5 minutes)"

foreach ($commit in $commits) {
    Write-Host "Adding files: $($commit.files)"
    Invoke-Expression "git add $($commit.files)"
    
    Write-Host "Committing: $($commit.message)"
    git commit -m $commit.message
    
    Write-Host "Pushing to GitHub..."
    git push origin main
    
    Write-Host "Commit successful. Waiting 5 minutes for the next commit..."
    Start-Sleep -Seconds 300
}

Write-Host "All code has been successfully committed and pushed to GitHub!"
