import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/resources/js/Pages/Settings/Index.jsx');
  String content = file.readAsStringSync();
  
  final searchString = """
                    {/* Loyalty Settings Section - Commented Out */}
                    {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <Star className="w-5 h-5 text-amber-500" />
                            <h2 className="text-base font-bold text-gray-900">Loyalty Program</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Points Per Currency Unit</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.points_per_currency}
                                        onChange={e => setData('points_per_currency', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        placeholder="e.g. 0.01 (1 point per 100 rupees)"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">How many points customers earn per currency unit spent</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Points to Currency Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.points_to_currency_rate}
                                        onChange={e => setData('points_to_currency_rate', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        placeholder="e.g. 1 (1 point = 1 rupee)"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Exchange rate for redeeming points as currency discount</p>
                                </div>
                            </div>
                        </div>
                    </div> */}
""";

  final replaceString = """
                    {/* Loyalty Settings Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <Star className="w-5 h-5 text-amber-500" />
                            <h2 className="text-base font-bold text-gray-900">Loyalty Program</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Points Per Currency Unit</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.points_per_currency}
                                        onChange={e => setData('points_per_currency', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        placeholder="e.g. 0.01 (1 point per 100 rupees)"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">How many points customers earn per currency unit spent</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Points to Currency Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.points_to_currency_rate}
                                        onChange={e => setData('points_to_currency_rate', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        placeholder="e.g. 1 (1 point = 1 rupee)"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Exchange rate for redeeming points as currency discount</p>
                                </div>
                            </div>
                        </div>
                    </div>
""";

  content = content.replaceFirst(searchString, replaceString);
  content = content.replaceFirst(searchString.replaceAll('\n', '\r\n'), replaceString);
  
  file.writeAsStringSync(content);
  print('Uncommented Loyalty settings section');
}
