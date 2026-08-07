import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/screens/loyalty/loyalty_screen.dart');
  String content = file.readAsStringSync();
  
  // Replace the _Reward model and mock data with LoyaltyProvider logic
  
  // Replace imports
  final importSearch = "import '../../core/theme/app_theme.dart';";
  final importReplace = "import '../../core/theme/app_theme.dart';\nimport 'package:provider/provider.dart';\nimport '../../providers/loyalty_provider.dart';\nimport '../../models/loyalty_reward_model.dart';";
  content = content.replaceFirst(importSearch, importReplace);
  
  // Remove _Reward class and mock data
  final mockDataRegex = RegExp(r'class _Reward \{.*?\nfinal List<_Reward> _initialRewards = \[.*?\];', dotAll: true);
  content = content.replaceFirst(mockDataRegex, "");

  // Update _typeIcon and _typeLabel logic to support "voucher" etc.
  content = content.replaceAll("_Reward", "LoyaltyRewardModel");
  content = content.replaceAll("points", "pointsRequired");
  content = content.replaceAll("desc", "description");

  // Update state class for LoyaltyScreen
  final stateRegex = RegExp(r'class _LoyaltyScreenState extends State<LoyaltyScreen> \{.*?\n\s+void _showAddSheet', dotAll: true);
  final newStateString = """class _LoyaltyScreenState extends State<LoyaltyScreen> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LoyaltyProvider>().fetchRewards();
    });
  }

  void _deleteReward(int id) {
    context.read<LoyaltyProvider>().deleteReward(id);
  }

  void _toggleStatus(int id) {
    context.read<LoyaltyProvider>().toggleStatus(id);
  }

  void _showAddSheet({LoyaltyRewardModel? reward}) {
""";
  content = content.replaceFirst(stateRegex, newStateString);

  // Update _showAddSheet parameters
  content = content.replaceAll("_showAddSheet({LoyaltyRewardModel? reward, int? index})", "_showAddSheet({LoyaltyRewardModel? reward})");
  
  // Update the onSave callback in _showAddSheet invocation
  final onSaveSearch = r"""        onSave: (updated) {
          setState(() {
            if (index != null) {
              _rewards[index] = updated;
            } else {
              _rewards.add(updated..id);
            }
          });
        },""";
  final onSaveReplace = """        onSave: (data) async {
          if (reward != null) {
            await context.read<LoyaltyProvider>().updateReward(reward.id, data);
          } else {
            await context.read<LoyaltyProvider>().createReward(data);
          }
        },""";
  content = content.replaceFirst(onSaveSearch, onSaveReplace);

  // Update ListView to use Consumer<LoyaltyProvider>
  final listRegex = RegExp(r'Expanded\(\n\s+child: ListView\.builder\(\n\s+padding:.*?\n\s+itemCount: _rewards\.length,\n\s+itemBuilder: \(context, index\) \{.*?return Container\(', dotAll: true);
  final newListString = """Expanded(
            child: Consumer<LoyaltyProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (provider.error != null) {
                  return Center(child: Text(provider.error!, style: TextStyle(color: Colors.red)));
                }
                final _rewards = provider.rewards;
                if (_rewards.isEmpty) {
                  return Center(
                    child: Text('No rewards found', style: GoogleFonts.poppins(color: AppColors.textMuted)),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: _rewards.length,
                  itemBuilder: (context, index) {
                    final reward = _rewards[index];
                    return Container(""";
  content = content.replaceFirst(listRegex, newListString);

  // Update actions inside ListView (delete, toggle, edit)
  content = content.replaceAll("_deleteReward(index)", "_deleteReward(reward.id)");
  content = content.replaceAll("_toggleStatus(index)", "_toggleStatus(reward.id)");
  content = content.replaceAll("_showAddSheet(reward: reward, index: index)", "_showAddSheet(reward: reward)");

  // Update Form State class
  final formRegex = RegExp(r'class _RewardFormSheet extends StatefulWidget \{.*?\n\}', dotAll: true);
  final newFormString = """class _RewardFormSheet extends StatefulWidget {
  final LoyaltyRewardModel? reward;
  final Function(Map<String, dynamic>) onSave;

  const _RewardFormSheet({this.reward, required this.onSave});

  @override
  State<_RewardFormSheet> createState() => _RewardFormSheetState();
}""";
  content = content.replaceFirst(formRegex, newFormString);

  // Update _save inside _RewardFormSheetState
  final saveRegex = RegExp(r'void _save\(\) \{.*?\n\s+widget\.onSave\(r\);\n\s+Navigator\.pop\(context\);\n\s+\}', dotAll: true);
  final newSaveString = """void _save() {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) return;

    final pts = int.tryParse(_pointsCtrl.text) ?? 0;
    final desc = _descCtrl.text.trim();

    final data = {
      'name': name,
      'type': _type,
      'points_required': pts,
      'description': desc,
      'status': _isActive,
      if (_type == 'discount') 'discount_type': 'percentage',
      if (_type == 'discount') 'discount_value': 10, // Default value for now
    };
    
    widget.onSave(data);
    Navigator.pop(context);
  }""";
  content = content.replaceFirst(saveRegex, newSaveString);

  file.writeAsStringSync(content);
  print('Updated LoyaltyScreen to use LoyaltyProvider');
}
