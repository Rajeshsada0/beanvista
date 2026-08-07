<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::with('menus')->latest()->get();
        
        // Manually count menus for MongoDB compatibility
        $categories = $categories->map(function ($category) {
            $category->menus_count = $category->menus->count();
            unset($category->menus); // Remove the menus collection to reduce payload
            return $category;
        });
        
        return Inertia::render('Categories/Index', [
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $branchId = session('active_branch_id') ?: auth()->user()->primary_branch_id;
        $validated = $request->validate([
            'name' => [
                'required', 
                'string', 
                \Illuminate\Validation\Rule::unique('categories')->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', auth()->user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'status' => 'boolean'
        ]);

        Category::create($validated);
        return back()->with('success', 'Category created successfully.');
    }

    public function update(Request $request, Category $category)
    {
        $branchId = session('active_branch_id') ?: auth()->user()->primary_branch_id;
        $validated = $request->validate([
            'name' => [
                'required', 
                'string', 
                \Illuminate\Validation\Rule::unique('categories')->ignore($category->id)->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', auth()->user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'status' => 'boolean'
        ]);

        $category->update($validated);
        return back()->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return back()->with('success', 'Category deleted successfully.');
    }
}
