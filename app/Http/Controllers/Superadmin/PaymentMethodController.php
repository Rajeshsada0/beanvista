<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentMethodController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:upi_qr,bank_transfer,esewa',
            'title' => 'required|string|max:255',
            'details' => 'required|string|max:2000',
            'qr_code' => 'nullable|image|max:2048', // Max 2MB
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('qr_code')) {
            $validated['qr_code'] = $request->file('qr_code')->store('payment_methods', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);

        PaymentMethod::create($validated);

        return back()->with('success', 'Payment method defined successfully.');
    }

    public function update(Request $request, $id)
    {
        $method = PaymentMethod::findOrFail($id);

        $validated = $request->validate([
            'type' => 'required|string|in:upi_qr,bank_transfer,esewa',
            'title' => 'required|string|max:255',
            'details' => 'required|string|max:2000',
            'qr_code' => 'nullable|image|max:2048',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('qr_code')) {
            if ($method->qr_code) {
                Storage::disk('public')->delete($method->qr_code);
            }
            $validated['qr_code'] = $request->file('qr_code')->store('payment_methods', 'public');
        } else {
            unset($validated['qr_code']);
        }

        $validated['is_active'] = $request->boolean('is_active', true);

        $method->update($validated);

        return back()->with('success', 'Payment method updated successfully.');
    }

    public function destroy($id)
    {
        $method = PaymentMethod::findOrFail($id);

        if ($method->qr_code) {
            Storage::disk('public')->delete($method->qr_code);
        }

        $method->delete();

        return back()->with('success', 'Payment method deleted successfully.');
    }
}
