import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/resources/js/Pages/Superadmin/Users/Index.jsx');
  String content = file.readAsStringSync();
  
  // 1. Update imports
  content = content.replaceFirst(
    "import { Users, Plus, Edit2, Trash2 } from 'lucide-react';",
    "import { Users, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';\\nimport { useState } from 'react';"
  );
  content = content.replaceFirst(
    "import { Users, Plus, Edit2, Trash2 } from 'lucide-react';".replaceAll('\n', '\r\n'),
    "import { Users, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';\\nimport { useState } from 'react';"
  );

  // 2. Update props
  content = content.replaceFirst(
    "export default function Index({ users, app_name, app_version }) {",
    "export default function Index({ users, app_name, app_version, site_favicon }) {"
  );

  // 3. Update useForm and add state/handlers
  final searchForm = """
    // Form for app settings
    const { data, setData, post, processing, errors } = useForm({
        app_name: app_name || 'iCafe',
        app_version: app_version || 'v1.0',
    });
""";
  final replaceForm = """
    // Form for app settings
    const { data, setData, post, processing, errors } = useForm({
        app_name: app_name || 'iCafe',
        app_version: app_version || 'v1.0',
        favicon: null,
    });
    const [faviconPreview, setFaviconPreview] = useState(site_favicon || null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('favicon', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFaviconPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
""";
  content = content.replaceFirst(searchForm, replaceForm);
  content = content.replaceFirst(searchForm.replaceAll('\n', '\r\n'), replaceForm);

  // 4. Update the form UI
  content = content.replaceFirst(
    'className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"',
    'className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end"'
  );
  
  final searchSaveBtn = """
                        <div>
                            <button
                                type="submit"
""";
  final replaceSaveBtn = """
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Favicon (Tab Icon)</label>
                            <div className="flex items-center space-x-3 h-[50px]">
                                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden relative group transition-all">
                                    {faviconPreview ? (
                                        <img src={faviconPreview} className="w-6 h-6 object-contain" alt="Favicon Preview" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                    )}
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/x-icon,image/png"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 font-bold leading-tight flex-1">Max 2MB<br/>32x32px</p>
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
""";
  content = content.replaceFirst(searchSaveBtn, replaceSaveBtn);
  content = content.replaceFirst(searchSaveBtn.replaceAll('\n', '\r\n'), replaceSaveBtn);

  file.writeAsStringSync(content);
  print('Updated Superadmin/Users/Index.jsx');
}
