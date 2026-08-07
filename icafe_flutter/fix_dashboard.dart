import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/screens/dashboard/dashboard_screen.dart');
  String content = file.readAsStringSync();
  
  final searchString = """
    _slideController.dispose();
    super.dispose();
  }
        }
      });
    }
  }

  @override""";
  
  final replaceString = """
    _slideController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await _fetchDashboardData();
  }

  Future<void> _pickDate(bool isFrom) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isFrom ? _fromDate : _toDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(
            primary: AppColors.accentAmber,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        if (isFrom) {
          _fromDate = picked;
        } else {
          _toDate = picked;
        }
      });
    }
  }

  @override""";

  // Use replaceFirst with \r\n handling if needed
  content = content.replaceFirst(searchString, replaceString);
  content = content.replaceFirst(searchString.replaceAll('\n', '\r\n'), replaceString);
  
  file.writeAsStringSync(content);
  print('Fixed dashboard_screen.dart');
}
