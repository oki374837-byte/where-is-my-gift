# تشخيص الشاشة الزرقاء وإعداد Google Maps

## المرجع الخارجي

توثيق Expo الرسمي لـ `react-native-maps`: https://docs.expo.dev/versions/latest/sdk/map-view/

ينص التوثيق على أن APK/البناء المستقل يحتاج إضافة المفتاح إلى config plugin الخاص بـ `react-native-maps` عبر `plugins.react-native-maps.androidGoogleMapsApiKey`، ثم إعادة بناء التطبيق. وضع المفتاح في `android.config.googleMaps.apiKey` وحده لا يضمن تهيئة حزمة `react-native-maps` المطلوبة.

## نتيجة الفحص

كان المشروع يستخدم `react-native-maps` الإصدار `1.20.1`، ولم يحتوِ هذا الإصدار على `app.plugin.js`. لذلك لم يكن إعداد plugin الرسمي متاحاً. تم تحديث الاعتماد إلى `react-native-maps@1.26.6`، وهو إصدار يحتوي `app.plugin.js` وملفات plugin الخاصة بـ Android.

بعد التعديل، نجح `npx expo prebuild --no-install --platform android`، وظهر المفتاح في `android/app/src/main/AndroidManifest.xml` تحت `com.google.android.geo.API_KEY` أثناء الفحص المحلي. لم يتم تضمين قيمة المفتاح في هذا الملف التوثيقي.
