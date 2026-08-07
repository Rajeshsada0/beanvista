<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Tax;

class TaxController extends Controller
{
    public function index()
    {
        return Inertia::render('Taxes/Index', [
            'taxes' => Tax::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'status' => 'boolean'
        ]);

        Tax::create($validated);
        return back()->with('success', 'Tax created successfully.');
    }

    public function update(Request $request, Tax $tax)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'status' => 'boolean'
        ]);

        $tax->update($validated);
        return back()->with('success', 'Tax updated successfully.');
    }

    public function destroy(Tax $tax)
    {
        $tax->delete();
        return back()->with('success', 'Tax deleted successfully.');
    }
}
