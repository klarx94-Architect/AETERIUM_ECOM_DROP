$data = Get-Content release_v2.json | ConvertFrom-Json
$link = $data.assets | Where-Object { $_.name -like '*windows_amd64.zip' } | Select-Object -ExpandProperty browser_download_url
Write-Output $link
