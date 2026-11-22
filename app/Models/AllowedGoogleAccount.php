<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AllowedGoogleAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'name',
        'added_by',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}
