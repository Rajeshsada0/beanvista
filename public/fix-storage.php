<?php
/**
 * Laravel cPanel Storage Symlink & Permissions Fixer
 * 
 * Instructions:
 * 1. Upload this file to your public_html (or public) folder.
 * 2. Access it in your browser: https://yourdomain.com/fix-storage.php
 * 3. The script will fix the storage link, set correct permissions, test the result, and auto-delete itself for security.
 */

header('Content-Type: text/html; charset=utf-8');
echo '<!DOCTYPE html>
<html>
<head>
    <title>Laravel Storage Fixer</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; line-height: 1.5; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        h1 { color: #111827; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; }
        .step { margin-bottom: 15px; padding: 12px; border-radius: 8px; border-left: 4px solid #d1d5db; background-color: #f9fafb; }
        .step.success { border-left-color: #10b981; background-color: #ecfdf5; color: #065f46; }
        .step.error { border-left-color: #ef4444; background-color: #fef2f2; color: #991b1b; }
        .step.info { border-left-color: #3b82f6; background-color: #eff6ff; color: #1e3a8a; }
        .log-title { font-weight: bold; margin-bottom: 5px; }
        .log-details { font-family: monospace; font-size: 13px; white-space: pre-wrap; }
        .btn-retry { display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
<div class="container">
    <h1>Laravel Storage Link &amp; Permissions Fixer</h1>';

function addLog($title, $status, $details = '') {
    $class = 'info';
    if ($status === 'success') $class = 'success';
    if ($status === 'error') $class = 'error';
    
    echo '<div class="step ' . $class . '">';
    echo '<div class="log-title">' . htmlspecialchars($title) . '</div>';
    if ($details) {
        echo '<div class="log-details">' . htmlspecialchars($details) . '</div>';
    }
    echo '</div>';
}

// 1. Define Paths
$publicPath = __DIR__;
$storageLink = $publicPath . '/storage';
$laravelRoot = dirname($publicPath);
$realStoragePath = $laravelRoot . '/storage';
$publicStoragePath = $laravelRoot . '/storage/app/public';

addLog("Paths Identified", "info", 
    "Public Directory: $publicPath\n" .
    "Storage Link: $storageLink\n" .
    "Target Directory: $publicStoragePath"
);

// 2. Remove existing symlink or folder at public/storage
if (file_exists($storageLink) || is_link($storageLink)) {
    if (is_link($storageLink)) {
        if (unlink($storageLink)) {
            addLog("Removed existing broken/incorrect symlink", "success");
        } else {
            addLog("Failed to remove existing symlink", "error", "Please delete '$storageLink' manually using cPanel File Manager.");
        }
    } else if (is_dir($storageLink)) {
        // It's a real directory! Let's check if there are files inside
        $files = array_diff(scandir($storageLink), array('.', '..'));
        if (count($files) > 0) {
            addLog("Warning: 'public/storage' is a physical folder containing uploads", "info", "Moving files to '$publicStoragePath' before replacing it...");
            
            // Ensure target folder exists
            if (!is_dir($publicStoragePath)) {
                mkdir($publicStoragePath, 0755, true);
            }
            
            // Move files helper
            $moveSuccess = true;
            foreach ($files as $file) {
                $src = $storageLink . '/' . $file;
                $dest = $publicStoragePath . '/' . $file;
                if (!rename($src, $dest)) {
                    $moveSuccess = false;
                    addLog("Failed to move file", "error", "Source: $src\nDestination: $dest");
                }
            }
            
            if ($moveSuccess) {
                // Remove folder
                if (rmdir($storageLink)) {
                    addLog("Successfully moved uploads and removed physical 'public/storage' folder", "success");
                } else {
                    addLog("Failed to remove empty physical 'public/storage' folder", "error");
                }
            } else {
                addLog("Could not move all files. Please manually rename 'public/storage' directory to resolve this.", "error");
            }
        } else {
            // Empty folder, just remove it
            if (rmdir($storageLink)) {
                addLog("Removed empty physical 'public/storage' folder", "success");
            } else {
                addLog("Failed to remove empty physical 'public/storage' folder", "error");
            }
        }
    } else {
        // Normal file
        if (unlink($storageLink)) {
            addLog("Removed unexpected file at 'public/storage'", "success");
        } else {
            addLog("Failed to remove file at 'public/storage'", "error");
        }
    }
} else {
    addLog("No existing file/link found at 'public/storage'", "success");
}

// 3. Set permissions on real storage directory recursively
if (is_dir($realStoragePath)) {
    addLog("Adjusting permissions for storage directory", "info", "Setting folders to 755 and files to 644...");
    
    function setPermissions($dir) {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        
        // Fix main folder first
        @chmod($dir, 0755);
        
        $successCount = 0;
        $failCount = 0;
        
        foreach ($iterator as $item) {
            $path = $item->getPathname();
            if ($item->isDir()) {
                if (@chmod($path, 0755)) $successCount++; else $failCount++;
            } else {
                if (@chmod($path, 0644)) $successCount++; else $failCount++;
            }
        }
        return ["success" => $successCount, "fail" => $failCount];
    }
    
    $res = setPermissions($realStoragePath);
    addLog("Permissions update finished", "success", "Updated: {$res['success']} items. Failed: {$res['fail']} items (if any, these may be owned by another system user).");
} else {
    addLog("Real storage path not found at $realStoragePath", "error");
}

// 4. Create relative symlink
if (!file_exists($storageLink)) {
    // Relative path from public directory to storage/app/public is '../storage/app/public'
    $relativeTarget = '../storage/app/public';
    
    if (symlink($relativeTarget, $storageLink)) {
        addLog("Created relative symbolic link", "success", "Link: $storageLink -> $relativeTarget");
    } else {
        addLog("Failed to create symbolic link", "error", "Your server configuration may block symlink creation. Please contact your host.");
    }
}

// 5. Test symlink functionality
if (is_link($storageLink)) {
    $testFileName = 'test_symlink_' . time() . '.txt';
    $testFilePath = $publicStoragePath . '/' . $testFileName;
    $testFileUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . '/storage/' . $testFileName;
    
    if (@file_put_contents($testFilePath, 'Laravel Storage is working!')) {
        // Try reading it via public web link (file_get_contents)
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 3, // 3 seconds timeout
                'ignore_errors' => true
            ]
        ]);
        $webContent = @file_get_contents($testFileUrl, false, $ctx);
        
        if ($webContent === 'Laravel Storage is working!') {
            addLog("Symlink Verification Successful!", "success", "Tested URL: $testFileUrl\nResponse: $webContent");
        } else {
            addLog("Symlink Verification failed via HTTP", "error", 
                "Tested URL: $testFileUrl\n" .
                "HTTP Response Code/Content: " . ($webContent ?: "No response (Check if FollowSymLinks or your .htaccess allows it)")
            );
        }
        
        // Clean up test file
        @unlink($testFilePath);
    } else {
        addLog("Could not write test file to $testFilePath", "error", "Please check ownership/permissions of the storage directory.");
    }
}

// 6. Auto-delete self
if (unlink(__FILE__)) {
    addLog("Security Clean-up Complete", "success", "This fixer script has successfully auto-deleted itself from the server to prevent unauthorized runs.");
} else {
    addLog("Security Warning", "error", "Could not auto-delete this script. Please delete this file ('fix-storage.php') manually from your cPanel File Manager immediately!");
}

echo '</div>
</body>
</html>';
?>
