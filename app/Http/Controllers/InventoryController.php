<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryPurchase;
use App\Models\InventoryUsage;
use App\Models\InventoryWaste;
use App\Models\Menu;
use App\Models\MenuRecipe;
use App\Models\Order;
use App\Models\Supplier;
use App\Models\MeasuringUnit;
use App\Models\StockGroup;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');
        $statusFilter = $request->input('status_filter', 'all');

        $queryStart = $startDate ? Carbon::parse($startDate)->startOfDay() : null;
        $queryEnd   = $endDate   ? Carbon::parse($endDate)->endOfDay()     : null;

        $today        = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfYear  = Carbon::now()->startOfYear();

        // ── Financial Stats ────────────────────────────────────────────────
        $todayExpenses   = InventoryPurchase::whereDate('purchase_date', $today)->sum('total_price');
        $todaySales      = Order::where('status','completed')->whereDate('updated_at', $today)->sum('grand_total');
        $todayWasted     = InventoryWaste::whereDate('waste_date', $today)->sum('total_loss');

        $monthlyExpenses = InventoryPurchase::where('purchase_date', '>=', $startOfMonth)->sum('total_price');
        $monthlySales    = Order::where('status','completed')->where('updated_at', '>=', $startOfMonth)->sum('grand_total');
        $monthlyWasted   = InventoryWaste::where('waste_date', '>=', $startOfMonth)->sum('total_loss');

        $yearlyExpenses  = InventoryPurchase::where('purchase_date', '>=', $startOfYear)->sum('total_price');
        $yearlySales     = Order::where('status','completed')->where('updated_at', '>=', $startOfYear)->sum('grand_total');
        $yearlyWasted    = InventoryWaste::where('waste_date', '>=', $startOfYear)->sum('total_loss');

        $customExpenses = $customSales = $customWasted = null;
        if ($queryStart && $queryEnd) {
            $customExpenses = InventoryPurchase::whereBetween('purchase_date', [$queryStart, $queryEnd])->sum('total_price');
            $customSales    = Order::where('status','completed')->whereBetween('updated_at', [$queryStart, $queryEnd])->sum('grand_total');
            $customWasted   = InventoryWaste::whereBetween('waste_date', [$queryStart, $queryEnd])->sum('total_loss');
        }

        // ── Per-Item Aggregates (SQL-driven Native Aggregation) ──────────────
        $todayIntakeMap = InventoryPurchase::whereDate('purchase_date', $today)
            ->selectRaw('inventory_item_id, sum(quantity) as total_qty')
            ->groupBy('inventory_item_id')
            ->pluck('total_qty', 'inventory_item_id');

        $todayUsageMap = InventoryUsage::whereDate('usage_date', $today)
            ->selectRaw('inventory_item_id, sum(quantity_used) as total_qty')
            ->groupBy('inventory_item_id')
            ->pluck('total_qty', 'inventory_item_id');

        $totalIntakeMap = InventoryPurchase::selectRaw('inventory_item_id, sum(quantity) as total_qty')
            ->groupBy('inventory_item_id')
            ->pluck('total_qty', 'inventory_item_id');

        $totalUsageMap = InventoryUsage::selectRaw('inventory_item_id, sum(quantity_used) as total_qty')
            ->groupBy('inventory_item_id')
            ->pluck('total_qty', 'inventory_item_id');

        $rangeIntakeMap = $rangeUsageMap = null;
        if ($queryStart && $queryEnd) {
            $rangeIntakeMap = InventoryPurchase::whereBetween('purchase_date', [$queryStart, $queryEnd])
                ->selectRaw('inventory_item_id, sum(quantity) as total_qty')
                ->groupBy('inventory_item_id')
                ->pluck('total_qty', 'inventory_item_id');

            $rangeUsageMap = InventoryUsage::whereBetween('usage_date', [$queryStart, $queryEnd])
                ->selectRaw('inventory_item_id, sum(quantity_used) as total_qty')
                ->groupBy('inventory_item_id')
                ->pluck('total_qty', 'inventory_item_id');
        }

        $suppliers = Supplier::orderBy('name')->get();
        $measuringUnits = MeasuringUnit::orderBy('name')->get();
        $stockGroups = StockGroup::orderBy('name')->get();

        $items = InventoryItem::with(['stockGroup', 'measuringUnit'])->orderBy('name')->get()->map(function ($item) use (
            $todayIntakeMap, $todayUsageMap, $totalIntakeMap, $totalUsageMap,
            $rangeIntakeMap, $rangeUsageMap
        ) {
            $todayIntake = (float)($todayIntakeMap[$item->id] ?? 0);
            $todayUsed   = (float)($todayUsageMap[$item->id]  ?? 0);
            $totalIntake = (float)($totalIntakeMap[$item->id]  ?? 0);
            $totalUsed   = (float)($totalUsageMap[$item->id]   ?? 0);

            // Opening stock = what was there at start of today
            $openingStock = (float)$item->current_stock - $todayIntake + $todayUsed;

            $status = 'sufficient';
            if ((float)$item->current_stock <= 0) {
                $status = 'out';
            } elseif ($item->low_stock_threshold > 0 && (float)$item->current_stock <= (float)$item->low_stock_threshold) {
                $status = 'low';
            }

            return [
                'id'                  => $item->id,
                'name'                => $item->name,
                'category'            => $item->category,
                'unit'                => $item->unit,
                'current_stock'       => (float)$item->current_stock,
                'low_stock_threshold' => (float)$item->low_stock_threshold,
                'opening_stock'       => max(0, $openingStock),
                'today_intake'        => $todayIntake,
                'today_used'          => $todayUsed,
                'total_intake'        => $totalIntake,
                'total_used'          => $totalUsed,
                'range_intake'        => $rangeIntakeMap !== null ? (float)($rangeIntakeMap[$item->id] ?? 0) : null,
                'range_used'          => $rangeUsageMap  !== null ? (float)($rangeUsageMap[$item->id]  ?? 0) : null,
                'status'              => $status,
                'stock_group'         => $item->stockGroup,
                'measuring_unit'      => $item->measuringUnit,
                'stock_group_id'      => $item->stock_group_id,
                'measuring_unit_id'   => $item->measuring_unit_id,
            ];
        });

        // ── Purchases Log ──────────────────────────────────────────────────
        $purchasesQuery = InventoryPurchase::with(['inventoryItem', 'supplier']);
        if ($queryStart && $queryEnd) {
            $purchasesQuery->whereBetween('purchase_date', [$queryStart, $queryEnd]);
        }
        $recentPurchases = $purchasesQuery->latest('purchase_date')->latest('id')->take(200)->get();

        // ── Usages Log ─────────────────────────────────────────────────────
        $usagesQuery = InventoryUsage::with('inventoryItem');
        if ($queryStart && $queryEnd) {
            $usagesQuery->whereBetween('usage_date', [$queryStart, $queryEnd]);
        }
        $recentUsages = $usagesQuery->latest('usage_date')->latest('id')->take(200)->get();

        // ── Wastes Log ─────────────────────────────────────────────────────
        $wastesQuery = InventoryWaste::with(['inventoryItem', 'menu']);
        if ($queryStart && $queryEnd) {
            $wastesQuery->whereBetween('waste_date', [$queryStart, $queryEnd]);
        }
        $recentWastes = $wastesQuery->latest('waste_date')->latest('id')->take(200)->get();

        $menus       = Menu::orderBy('name')->get(['id', 'name', 'category', 'cost_price']);
        $menuRecipes = MenuRecipe::with(['menu:id,name', 'inventoryItem:id,name,unit,measuring_unit_id', 'inventoryItem.measuringUnit'])
            ->get();

        return Inertia::render('Inventory/Index', [
            'stats' => [
                'today'  => ['sales' => (float)$todaySales,    'expenses' => (float)$todayExpenses,    'wasted' => (float)$todayWasted],
                'month'  => ['sales' => (float)$monthlySales,   'expenses' => (float)$monthlyExpenses,   'wasted' => (float)$monthlyWasted],
                'year'   => ['sales' => (float)$yearlySales,    'expenses' => (float)$yearlyExpenses,    'wasted' => (float)$yearlyWasted],
                'custom' => $customSales !== null
                    ? ['sales' => (float)$customSales, 'expenses' => (float)$customExpenses, 'wasted' => (float)$customWasted]
                    : null,
            ],
            'items'           => $items,
            'suppliers'       => Inertia::defer(fn() => $suppliers),
            'measuringUnits'  => Inertia::defer(fn() => $measuringUnits),
            'stockGroups'     => Inertia::defer(fn() => $stockGroups),
            'recentPurchases' => Inertia::defer(fn() => $recentPurchases),
            'recentUsages'    => Inertia::defer(fn() => $recentUsages),
            'recentWastes'    => Inertia::defer(fn() => $recentWastes),
            'menus'           => $menus,
            'menuRecipes'     => $menuRecipes,
            'filters'         => [
                'period'        => $request->input('period', 'today'),
                'start_date'    => $startDate,
                'end_date'      => $endDate,
                'status_filter' => $statusFilter,
            ],
        ]);
    }

    // ── Items CRUD ──────────────────────────────────────────────────────────
    public function storeItem(Request $request)
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'unit'                => 'nullable|string|max:50', // keeping for legacy
            'category'            => 'nullable|string|max:255', // keeping for legacy
            'low_stock_threshold' => 'nullable|numeric|min:0',
            'current_stock'       => 'nullable|numeric|min:0',
            'stock_group_id'      => 'nullable|exists:stock_groups,id',
            'measuring_unit_id'   => 'nullable|exists:measuring_units,id',
        ]);

        if (!empty($validated['measuring_unit_id'])) {
            $validated['unit'] = \App\Models\MeasuringUnit::find($validated['measuring_unit_id'])->short_name ?? '-';
        } else {
            $validated['unit'] = $validated['unit'] ?: '-';
        }

        if (!empty($validated['stock_group_id'])) {
            $validated['category'] = \App\Models\StockGroup::find($validated['stock_group_id'])->name;
        }

        InventoryItem::create($validated);
        return redirect()->back()->with('success', 'Item created successfully.');
    }

    public function updateItem(Request $request, InventoryItem $item)
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'unit'                => 'nullable|string|max:50',
            'category'            => 'nullable|string|max:255',
            'low_stock_threshold' => 'nullable|numeric|min:0',
            'current_stock'       => 'required|numeric|min:0',
            'stock_group_id'      => 'nullable|exists:stock_groups,id',
            'measuring_unit_id'   => 'nullable|exists:measuring_units,id',
        ]);

        if (!empty($validated['measuring_unit_id'])) {
            $validated['unit'] = \App\Models\MeasuringUnit::find($validated['measuring_unit_id'])->short_name ?? '-';
        } else {
            $validated['unit'] = $validated['unit'] ?: ($item->unit ?: '-');
        }

        if (!empty($validated['stock_group_id'])) {
            $validated['category'] = \App\Models\StockGroup::find($validated['stock_group_id'])->name;
        }

        $item->update($validated);
        return redirect()->back()->with('success', 'Item updated successfully.');
    }

    public function destroyItem(InventoryItem $item)
    {
        $item->delete();
        return redirect()->back()->with('success', 'Item deleted.');
    }

    // ── Purchases CRUD ──────────────────────────────────────────────────────
    public function storePurchase(Request $request)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'supplier_id'       => 'nullable|exists:suppliers,id',
            'quantity'          => 'required|numeric|min:0.01',
            'unit_price'        => 'required|numeric|min:0',
            'total_price'       => 'required|numeric|min:0',
            'purchase_date'     => 'required|date',
            'notes'             => 'nullable|string',
        ]);

        $purchase = InventoryPurchase::create($validated);

        $item = InventoryItem::find($validated['inventory_item_id']);
        if ($item) {
            $item->current_stock += $validated['quantity'];
            $item->save();
        }

        // Link to Finance: Create Journal Entry for Inventory Purchase
        $tenantId = auth()->user()->tenant_id ?? 1;

        // Ensure accounts exist
        $inventoryAssetAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1004'],
            ['name' => 'Inventory Asset', 'type' => 'asset', 'description' => 'Value of inventory on hand']
        );
        $cashAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1001'],
            ['name' => 'Cash', 'type' => 'asset', 'description' => 'Cash on hand']
        );

        if (class_exists(\App\Models\JournalEntry::class)) {
            $journalEntry = \App\Models\JournalEntry::create([
                'tenant_id' => $tenantId,
                'reference_number' => 'PUR-' . $purchase->id,
                'date' => $validated['purchase_date'],
                'description' => 'Inventory Purchase: ' . ($item ? $item->name : 'Item'),
                'status' => 'posted',
            ]);

            $journalEntry->lines()->create([
                'account_id' => $inventoryAssetAccount->id,
                'debit' => $validated['total_price'],
                'credit' => 0,
                'description' => 'Increase in Inventory Asset',
            ]);

            $journalEntry->lines()->create([
                'account_id' => $cashAccount->id,
                'debit' => 0,
                'credit' => $validated['total_price'],
                'description' => 'Payment for Inventory',
            ]);
        }

        return redirect()->back()->with('success', 'Purchase logged successfully and linked to Finance.');
    }

    public function updatePurchase(Request $request, InventoryPurchase $purchase)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'supplier_id'       => 'nullable|exists:suppliers,id',
            'quantity'          => 'required|numeric|min:0.01',
            'unit_price'        => 'required|numeric|min:0',
            'total_price'       => 'required|numeric|min:0',
            'purchase_date'     => 'required|date',
            'notes'             => 'nullable|string',
        ]);

        $diff = $validated['quantity'] - $purchase->quantity;
        $purchase->update($validated);

        // Adjust stock by the difference
        $item = InventoryItem::find($validated['inventory_item_id']);
        if ($item) {
            $item->current_stock += $diff;
            $item->save();
        }

        return redirect()->back()->with('success', 'Purchase updated.');
    }

    public function destroyPurchase(InventoryPurchase $purchase)
    {
        $item = InventoryItem::find($purchase->inventory_item_id);
        if ($item) {
            $item->current_stock -= $purchase->quantity;
            $item->save();
        }
        $purchase->delete();
        return redirect()->back()->with('success', 'Purchase deleted and stock reversed.');
    }

    // ── Usages CRUD ─────────────────────────────────────────────────────────
    public function storeUsage(Request $request)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'quantity_used'     => 'required|numeric|min:0.01',
            'usage_date'        => 'required|date',
            'notes'             => 'nullable|string',
        ]);

        InventoryUsage::create($validated);

        $item = InventoryItem::find($validated['inventory_item_id']);
        if ($item) {
            $item->current_stock -= $validated['quantity_used'];
            $item->save();
        }

        return redirect()->back()->with('success', 'Usage logged successfully.');
    }

    public function updateUsage(Request $request, InventoryUsage $usage)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'quantity_used'     => 'required|numeric|min:0.01',
            'usage_date'        => 'required|date',
            'notes'             => 'nullable|string',
        ]);

        $diff = $validated['quantity_used'] - $usage->quantity_used;
        $usage->update($validated);

        $item = InventoryItem::find($validated['inventory_item_id']);
        if ($item) {
            $item->current_stock -= $diff;
            $item->save();
        }

        return redirect()->back()->with('success', 'Usage updated.');
    }

    public function destroyUsage(InventoryUsage $usage)
    {
        $item = InventoryItem::find($usage->inventory_item_id);
        if ($item) {
            $item->current_stock += $usage->quantity_used;
            $item->save();
        }
        $usage->delete();
        return redirect()->back()->with('success', 'Usage deleted and stock restored.');
    }

    // ── Configuration CRUD (Suppliers, Units, Groups) ───────────────────────
    public function storeSupplier(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);
        Supplier::create($validated);
        return redirect()->back()->with('success', 'Supplier created.');
    }

    public function updateSupplier(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);
        $supplier->update($validated);
        return redirect()->back()->with('success', 'Supplier updated.');
    }

    public function destroySupplier(Supplier $supplier)
    {
        $supplier->delete();
        return redirect()->back()->with('success', 'Supplier deleted.');
    }

    public function storeUnit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'short_name' => 'required|string|max:20',
        ]);
        MeasuringUnit::create($validated);
        return redirect()->back()->with('success', 'Unit created.');
    }

    public function updateUnit(Request $request, MeasuringUnit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'short_name' => 'required|string|max:20',
        ]);
        $unit->update($validated);
        return redirect()->back()->with('success', 'Unit updated.');
    }

    public function destroyUnit(MeasuringUnit $unit)
    {
        $unit->delete();
        return redirect()->back()->with('success', 'Unit deleted.');
    }

    public function storeGroup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        StockGroup::create($validated);
        return redirect()->back()->with('success', 'Group created.');
    }

    public function updateGroup(Request $request, StockGroup $group)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        $group->update($validated);
        return redirect()->back()->with('success', 'Group updated.');
    }

    public function destroyGroup(StockGroup $group)
    {
        $group->delete();
        return redirect()->back()->with('success', 'Group deleted.');
    }

    // ── Recipes CRUD ────────────────────────────────────────────────────────────
    public function storeRecipe(Request $request)
    {
        $validated = $request->validate([
            'menu_id'    => 'required|exists:menus,id',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'ingredients.*.quantity_per_serving' => 'required|numeric|min:0.0001',
        ]);

        // Replace all existing recipe rows for this menu (full overwrite)
        MenuRecipe::where('menu_id', $validated['menu_id'])->delete();

        foreach ($validated['ingredients'] as $ingredient) {
            MenuRecipe::create([
                'menu_id'              => $validated['menu_id'],
                'inventory_item_id'    => $ingredient['inventory_item_id'],
                'quantity_per_serving' => $ingredient['quantity_per_serving'],
            ]);
        }

        return redirect()->back()->with('success', 'Recipe saved successfully.');
    }

    public function destroyRecipe(MenuRecipe $recipe)
    {
        $recipe->delete();
        return redirect()->back()->with('success', 'Ingredient removed.');
    }

    public function storeWaste(Request $request)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'nullable|exists:inventory_items,id',
            'menu_id'           => 'nullable|exists:menus,id',
            'quantity'          => 'required|numeric|min:0.01',
            'cost_per_unit'     => 'required|numeric|min:0',
            'total_loss'        => 'required|numeric|min:0',
            'waste_date'        => 'required|date',
            'reason'            => 'required|string|max:255',
            'notes'             => 'nullable|string',
        ]);

        if (empty($validated['inventory_item_id']) && empty($validated['menu_id'])) {
            return redirect()->back()->withErrors(['item' => 'Select either a raw ingredient or a menu item.']);
        }

        $validated['branch_id'] = auth()->user()->primary_branch_id ?? session('active_branch_id');
        if (!$validated['branch_id']) {
            $validated['branch_id'] = \App\Models\Branch::value('id');
        }

        $waste = InventoryWaste::create($validated);

        $this->deductStockForWaste($waste);
        $this->createFinanceJournalForWaste($waste);

        return redirect()->back()->with('success', 'Waste event logged successfully.');
    }

    public function updateWaste(Request $request, InventoryWaste $waste)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'nullable|exists:inventory_items,id',
            'menu_id'           => 'nullable|exists:menus,id',
            'quantity'          => 'required|numeric|min:0.01',
            'cost_per_unit'     => 'required|numeric|min:0',
            'total_loss'        => 'required|numeric|min:0',
            'waste_date'        => 'required|date',
            'reason'            => 'required|string|max:255',
            'notes'             => 'nullable|string',
        ]);

        if (empty($validated['inventory_item_id']) && empty($validated['menu_id'])) {
            return redirect()->back()->withErrors(['item' => 'Select either a raw ingredient or a menu item.']);
        }

        $this->revertStockForWaste($waste);
        $this->deleteFinanceJournalForWaste($waste);

        $waste->update($validated);

        $this->deductStockForWaste($waste);
        $this->createFinanceJournalForWaste($waste);

        return redirect()->back()->with('success', 'Waste entry updated.');
    }

    public function destroyWaste(InventoryWaste $waste)
    {
        $this->revertStockForWaste($waste);
        $this->deleteFinanceJournalForWaste($waste);
        $waste->delete();

        return redirect()->back()->with('success', 'Waste record deleted and stock restored.');
    }

    protected function deductStockForWaste(InventoryWaste $waste)
    {
        if ($waste->inventory_item_id) {
            InventoryUsage::create([
                'branch_id' => $waste->branch_id,
                'inventory_item_id' => $waste->inventory_item_id,
                'quantity_used' => $waste->quantity,
                'usage_date' => $waste->waste_date,
                'notes' => "Waste Ref: {$waste->id} | Raw Material Waste: " . ($waste->notes ?? ''),
            ]);

            $item = InventoryItem::find($waste->inventory_item_id);
            if ($item) {
                $item->current_stock -= $waste->quantity;
                $item->save();
            }
        } elseif ($waste->menu_id) {
            $recipes = MenuRecipe::where('menu_id', $waste->menu_id)->get();
            foreach ($recipes as $ingredient) {
                $qtyToDeduct = $ingredient->quantity_per_serving * $waste->quantity;

                $item = InventoryItem::find($ingredient->inventory_item_id);
                if ($item) {
                    $item->current_stock -= $qtyToDeduct;
                    $item->save();
                }

                InventoryUsage::create([
                    'branch_id' => $waste->branch_id,
                    'inventory_item_id' => $ingredient->inventory_item_id,
                    'quantity_used' => $qtyToDeduct,
                    'usage_date' => $waste->waste_date,
                    'notes' => "Waste Ref: {$waste->id} | Auto deduction for menu item: " . ($waste->menu ? $waste->menu->name : 'Menu Item'),
                ]);
            }
        }
    }

    protected function revertStockForWaste(InventoryWaste $waste)
    {
        if ($waste->inventory_item_id) {
            $item = InventoryItem::find($waste->inventory_item_id);
            if ($item) {
                $item->current_stock += $waste->quantity;
                $item->save();
            }
        }

        $usages = InventoryUsage::where('notes', 'like', "Waste Ref: {$waste->id}%")->get();
        foreach ($usages as $usage) {
            if ($waste->menu_id) {
                $item = InventoryItem::find($usage->inventory_item_id);
                if ($item) {
                    $item->current_stock += $usage->quantity_used;
                    $item->save();
                }
            }
            $usage->delete();
        }
    }

    protected function createFinanceJournalForWaste(InventoryWaste $waste)
    {
        $tenantId = auth()->user()->tenant_id ?? 1;

        $wasteExpenseAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '5005'],
            ['name' => 'Food Waste Expense', 'type' => 'expense', 'description' => 'Losses due to spoiled, damaged, or wasted inventory']
        );
        $inventoryAssetAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1004'],
            ['name' => 'Inventory Asset', 'type' => 'asset', 'description' => 'Value of inventory on hand']
        );

        if (class_exists(\App\Models\JournalEntry::class)) {
            $journalEntry = \App\Models\JournalEntry::create([
                'tenant_id' => $tenantId,
                'reference_number' => 'WST-' . $waste->id,
                'date' => $waste->waste_date,
                'description' => 'Food Waste/Damage: ' . ($waste->inventoryItem ? $waste->inventoryItem->name : ($waste->menu ? $waste->menu->name : 'Item')),
                'status' => 'posted',
            ]);

            $journalEntry->lines()->create([
                'account_id' => $wasteExpenseAccount->id,
                'debit' => $waste->total_loss,
                'credit' => 0,
                'description' => 'Food Waste Expense Recognition',
            ]);

            $journalEntry->lines()->create([
                'account_id' => $inventoryAssetAccount->id,
                'debit' => 0,
                'credit' => $waste->total_loss,
                'description' => 'Inventory Write-off due to Waste/Damage',
            ]);
        }
    }

    protected function deleteFinanceJournalForWaste(InventoryWaste $waste)
    {
        if (class_exists(\App\Models\JournalEntry::class)) {
            \App\Models\JournalEntry::where('reference_number', 'WST-' . $waste->id)->delete();
        }
    }
}
