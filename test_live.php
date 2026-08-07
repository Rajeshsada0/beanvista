<?php
require 'vendor/autoload.php';
use GuzzleHttp\Client;

$client = new Client(['cookies' => true, 'http_errors' => false]);
$response = $client->request('GET', 'https://cafe.kitetool.com/login');

$jar = $client->getConfig('cookies');
$xsrf = '';
foreach ($jar as $cookie) {
    if ($cookie->getName() === 'XSRF-TOKEN') {
        $xsrf = urldecode($cookie->getValue());
    }
}

// Login
$response = $client->request('POST', 'https://cafe.kitetool.com/login', [
    'form_params' => [
        'email' => 'super@cafe.com',
        'password' => 'password',
    ],
    'headers' => [
        'X-XSRF-TOKEN' => $xsrf,
        'X-Requested-With' => 'XMLHttpRequest',
    ]
]);
echo "Login Status: " . $response->getStatusCode() . "\n";

// Function to get tenant status from the index page
function getTenant15Status($client) {
    $response = $client->request('GET', 'https://cafe.kitetool.com/superadmin/tenants');
    $html = (string)$response->getBody();
    
    // Extract data-page attribute
    if (preg_match('/data-page="([^"]+)"/', $html, $matches)) {
        $pageData = json_decode(html_entity_decode($matches[1]), true);
        $tenants = $pageData['props']['tenants'] ?? [];
        foreach ($tenants as $t) {
            if ($t['id'] == 15) {
                return $t['is_active'];
            }
        }
    }
    return null;
}

// Check initial status
$initialStatus = getTenant15Status($client);
echo "Initial is_active status of Tenant 15: " . var_export($initialStatus, true) . "\n";

// Get updated XSRF token for toggle request
$jar = $client->getConfig('cookies');
foreach ($jar as $cookie) {
    if ($cookie->getName() === 'XSRF-TOKEN') {
        $xsrf = urldecode($cookie->getValue());
    }
}

// Perform PATCH toggle
$response = $client->request('PATCH', 'https://cafe.kitetool.com/superadmin/tenants/15/toggle', [
    'headers' => [
        'X-Requested-With' => 'XMLHttpRequest',
        'X-XSRF-TOKEN' => $xsrf
    ]
]);
echo "Toggle Status (PATCH): " . $response->getStatusCode() . "\n";

// Check status after PATCH toggle
$afterPatchStatus = getTenant15Status($client);
echo "is_active status of Tenant 15 after PATCH: " . var_export($afterPatchStatus, true) . "\n";

// Let's also try POST toggle with method spoofing just to see
if ($afterPatchStatus === $initialStatus) {
    echo "PATCH did not change the status! Trying POST toggle with method spoofing...\n";
    
    // Get updated XSRF token
    $jar = $client->getConfig('cookies');
    foreach ($jar as $cookie) {
        if ($cookie->getName() === 'XSRF-TOKEN') {
            $xsrf = urldecode($cookie->getValue());
        }
    }
    
    $response = $client->request('POST', 'https://cafe.kitetool.com/superadmin/tenants/15/toggle', [
        'form_params' => [
            '_method' => 'PATCH'
        ],
        'headers' => [
            'X-Requested-With' => 'XMLHttpRequest',
            'X-XSRF-TOKEN' => $xsrf
        ]
    ]);
    echo "Toggle Status (POST spoofed PATCH): " . $response->getStatusCode() . "\n";
    
    $afterPostSpoofStatus = getTenant15Status($client);
    echo "is_active status of Tenant 15 after POST spoofed PATCH: " . var_export($afterPostSpoofStatus, true) . "\n";
}


