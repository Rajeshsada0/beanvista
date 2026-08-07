import 'package:flutter/material.dart';

void showTopSnackBar(BuildContext context, SnackBar snackBar) {
  ScaffoldMessenger.of(context).hideCurrentSnackBar();
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: snackBar.content,
      backgroundColor: snackBar.backgroundColor,
      behavior: SnackBarBehavior.floating,
      margin: EdgeInsets.only(
        bottom: MediaQuery.of(context).size.height - 140,
        left: 16,
        right: 16,
      ),
      duration: snackBar.duration,
      shape: snackBar.shape ?? RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}

void showTopSnackBarWithMessenger(ScaffoldMessengerState messenger, BuildContext context, SnackBar snackBar) {
  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      content: snackBar.content,
      backgroundColor: snackBar.backgroundColor,
      behavior: SnackBarBehavior.floating,
      margin: EdgeInsets.only(
        bottom: MediaQuery.of(context).size.height - 140,
        left: 16,
        right: 16,
      ),
      duration: snackBar.duration,
      shape: snackBar.shape ?? RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}
