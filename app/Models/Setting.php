<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'branch_id', 'key', 'value', 'type', 'tenant_id'];

    /**
     * Convert setting image path to public media route URL (/img/{path}).
     */
    public static function imageUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return str_replace('/storage/', '/img/', $path);
        }

        $clean = ltrim(str_replace(['/storage/', 'storage/'], '', $path), '/');
        return url('/img/' . $clean);
    }
}
