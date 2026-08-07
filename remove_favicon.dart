import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/resources/js/Pages/Settings/Index.jsx');
  String content = file.readAsStringSync();
  
  final searchString = """
                                {/* Favicon Upload */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Favicon (Tab Icon)</label>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden relative group transition-all hover:border-brand-400">
                                            {faviconPreview ? (
                                                <img src={faviconPreview} className="w-8 h-8 object-contain" alt="Favicon Preview" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-gray-400" />
                                            )}
                                            <input
                                                type="file"
                                                onChange={e => handleFileChange(e, 'site_favicon', setFaviconPreview)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/x-icon,image/png"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-700 mb-1">Standard 32x32 or 64x64</p>
                                            <p className="text-xs text-gray-500">This icon appears in the browser tab next to your site title.</p>
                                        </div>
                                    </div>
                                </div>
""";

  content = content.replaceFirst(searchString, '');
  content = content.replaceFirst(searchString.replaceAll('\n', '\r\n'), '');
  
  file.writeAsStringSync(content);
  print('Removed favicon from Settings/Index.jsx');
}
