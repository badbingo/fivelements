import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class LocationService {
  static LocationService? _instance;
  static LocationService get instance => _instance ??= LocationService._();
  
  LocationService._();

  /// 检查位置权限
  Future<bool> checkPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    // 检查位置服务是否启用
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// 获取当前位置
  Future<Position?> getCurrentPosition() async {
    try {
      bool hasPermission = await checkPermission();
      if (!hasPermission) {
        return null;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      
      return position;
    } catch (e) {
      print('获取位置失败: $e');
      return null;
    }
  }

  /// 根据坐标获取地址信息
  Future<Map<String, String>?> getAddressFromCoordinates(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
      
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        return {
          'city': place.locality ?? place.administrativeArea ?? '未知城市',
          'district': place.subLocality ?? place.subAdministrativeArea ?? '未知区域',
          'country': place.country ?? '未知国家',
          'province': place.administrativeArea ?? '未知省份',
        };
      }
    } catch (e) {
      print('地理编码失败: $e');
    }
    return null;
  }

  /// 获取当前位置信息（包含地址）
  Future<Map<String, dynamic>?> getCurrentLocationInfo() async {
    try {
      Position? position = await getCurrentPosition();
      if (position == null) {
        return null;
      }

      Map<String, String>? address = await getAddressFromCoordinates(
        position.latitude, 
        position.longitude
      );

      return {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'city': address?['city'] ?? '未知城市',
        'district': address?['district'] ?? '未知区域',
        'country': address?['country'] ?? '未知国家',
        'province': address?['province'] ?? '未知省份',
      };
    } catch (e) {
      print('获取位置信息失败: $e');
      return null;
    }
  }
}