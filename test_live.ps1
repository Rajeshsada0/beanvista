$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$res1 = Invoke-WebRequest -Uri "https://cafe.kitetool.com/login" -WebSession $session
if ($res1.Content -match '<meta name="csrf-token" content="(.*?)">') {
    $csrf = $matches[1]
}

$body = @{
    email = 'super@cafe.com'
    password = 'password'
    _token = $csrf
}
$res2 = Invoke-WebRequest -Uri "https://cafe.kitetool.com/login" -Method Post -Body $body -WebSession $session -SkipHttpErrorCheck
Write-Output "Login Status: $($res2.StatusCode)"

$xsrf = $session.Cookies.GetCookies("https://cafe.kitetool.com") | Where-Object Name -eq "XSRF-TOKEN"
$xsrfValue = [uri]::UnescapeDataString($xsrf.Value)

$headers = @{
    "X-Requested-With" = "XMLHttpRequest"
    "X-XSRF-TOKEN" = $xsrfValue
}
$res3 = Invoke-WebRequest -Uri "https://cafe.kitetool.com/superadmin/tenants/5/toggle" -Method Patch -Headers $headers -WebSession $session -SkipHttpErrorCheck
Write-Output "Toggle Status: $($res3.StatusCode)"
Write-Output $res3.Content.Substring(0, [math]::Min(500, $res3.Content.Length))
