<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoogleAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'google_id',
        'email',
        'name',
        'avatar',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
