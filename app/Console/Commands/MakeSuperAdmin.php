<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class MakeSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:superadmin {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Make a user a super admin';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $user = \App\Models\User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        $user->role = 'super_admin';
        // Optional: you can remove them from a tenant so they are truly global
        // $user->tenant_id = null;
        $user->save();

        $this->info("User {$email} is now a super admin.");
        return 0;
    }
}
