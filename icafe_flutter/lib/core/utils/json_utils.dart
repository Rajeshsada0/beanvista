/// Shared JSON parsing utilities for safe type conversion.
///
/// Server APIs may return int/double fields as strings. These helpers
/// prevent runtime crashes by handling all common types gracefully.
class JsonUtils {
  JsonUtils._(); // prevent instantiation

  /// Parse a dynamic value to [int], returning [fallback] on failure.
  static int parseInt(dynamic value, [int fallback = 0]) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? fallback;
    if (value is double) return value.toInt();
    return fallback;
  }

  /// Parse a dynamic value to [int?], returning null on failure.
  static int? parseIntNullable(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is String) return int.tryParse(value);
    if (value is double) return value.toInt();
    return null;
  }

  /// Parse a dynamic value to [double], returning [fallback] on failure.
  static double parseDouble(dynamic value, [double fallback = 0.0]) {
    if (value == null) return fallback;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  /// Parse a dynamic value to [double?], returning null on failure.
  static double? parseDoubleNullable(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
}
