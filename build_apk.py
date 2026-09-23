import os
import shutil
import subprocess
import zipfile
from PIL import Image

def run_cmd(cmd, cwd=None, env=None, shell=False):
    print("Running:", " ".join(cmd) if isinstance(cmd, list) else cmd)
    res = subprocess.run(cmd, cwd=cwd, env=env, shell=shell, capture_output=True, text=True)
    if res.returncode != 0:
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        raise RuntimeError(f"Command failed with code {res.returncode}")
    return res.stdout

def main():
    root = os.path.abspath(os.path.dirname(__file__))
    build_dir = os.path.join(root, "android_build")
    shutil.rmtree(build_dir, ignore_errors=True)
    os.makedirs(build_dir, exist_ok=True)

    # Tool paths
    jbr_dir = r"C:\Program Files\Android\Android Studio\jbr"
    javac = os.path.join(jbr_dir, "bin", "javac.exe")
    keytool = os.path.join(jbr_dir, "bin", "keytool.exe")

    sdk_dir = r"C:\Users\Harmeet Singh\AppData\Local\Android\Sdk"
    build_tools = os.path.join(sdk_dir, "build-tools", "36.0.0")
    aapt2 = os.path.join(build_tools, "aapt2.exe")
    d8 = os.path.join(build_tools, "d8.bat")
    zipalign = os.path.join(build_tools, "zipalign.exe")
    apksigner = os.path.join(build_tools, "apksigner.bat")
    android_jar = os.path.join(sdk_dir, "platforms", "android-36", "android.jar")

    env = os.environ.copy()
    env["JAVA_HOME"] = jbr_dir
    env["PATH"] = os.path.join(jbr_dir, "bin") + ";" + env.get("PATH", "")

    # Project structure
    res_dir = os.path.join(build_dir, "res")
    values_dir = os.path.join(res_dir, "values")
    layout_dir = os.path.join(res_dir, "layout")
    os.makedirs(values_dir, exist_ok=True)
    os.makedirs(layout_dir, exist_ok=True)

    # Generate Mipmap Icons
    logo_src = os.path.join(root, "images", "logo-stacked.png")
    if not os.path.exists(logo_src):
        logo_src = os.path.join(root, "images", "logo.png")
    
    icon_img = Image.open(logo_src).convert("RGBA")
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }
    for m_dir, size in densities.items():
        out_m_dir = os.path.join(res_dir, m_dir)
        os.makedirs(out_m_dir, exist_ok=True)
        # Create rounded squircle background
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
        # resize logo keeping aspect ratio
        thumb = icon_img.copy()
        thumb.thumbnail((int(size * 0.82), int(size * 0.82)), Image.Resampling.LANCZOS)
        pos = ((size - thumb.width) // 2, (size - thumb.height) // 2)
        canvas.paste(thumb, pos, thumb)
        canvas.save(os.path.join(out_m_dir, "ic_launcher.png"), "PNG")

    # Strings
    with open(os.path.join(values_dir, "strings.xml"), "w", encoding="utf-8") as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">EducationistGuru</string>
</resources>''')

    # Styles
    with open(os.path.join(values_dir, "styles.xml"), "w", encoding="utf-8") as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">#ff3115</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:navigationBarColor">#ffffff</item>
    </style>
</resources>''')

    # Layout
    with open(os.path.join(layout_dir, "activity_main.xml"), "w", encoding="utf-8") as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#ffffff">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</FrameLayout>''')

    # Manifest
    manifest_path = os.path.join(build_dir, "AndroidManifest.xml")
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.educationistguru.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>''')

    # Java Source
    src_dir = os.path.join(build_dir, "src", "com", "educationistguru", "app")
    os.makedirs(src_dir, exist_ok=True)
    with open(os.path.join(src_dir, "MainActivity.java"), "w", encoding="utf-8") as f:
        f.write('''package com.educationistguru.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        s.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                return handleCustomUrl(url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleCustomUrl(url);
            }

            private boolean handleCustomUrl(String url) {
                if (url.startsWith("tel:")) {
                    Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } else if (url.startsWith("https://api.whatsapp.com") || url.startsWith("whatsapp:") || url.contains("wa.me")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                } else if (url.startsWith("https://www.youtube.com") || url.startsWith("https://youtu.be") || url.startsWith("vnd.youtube:") || url.contains("instagram.com") || url.contains("facebook.com")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            }
        });

        webView.loadUrl("file:///android_asset/app/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
''')

    # Assets
    assets_dir = os.path.join(build_dir, "assets")
    app_assets_dir = os.path.join(assets_dir, "app")
    images_assets_dir = os.path.join(assets_dir, "images")
    os.makedirs(app_assets_dir, exist_ok=True)
    os.makedirs(images_assets_dir, exist_ok=True)

    print("Copying app web assets...")
    shutil.copytree(os.path.join(root, "app"), app_assets_dir, dirs_exist_ok=True)

    print("Copying images assets...")
    shutil.copytree(os.path.join(root, "images"), images_assets_dir, dirs_exist_ok=True)

    # 1. AAPT2 Compile Resources
    print("Compiling Android resources with aapt2...")
    compiled_res = os.path.join(build_dir, "compiled_res.zip")
    run_cmd([aapt2, "compile", "--dir", res_dir, "-o", compiled_res], cwd=build_dir)

    # 2. AAPT2 Link Resources
    print("Linking resources and generating R.java...")
    gen_dir = os.path.join(build_dir, "gen")
    os.makedirs(gen_dir, exist_ok=True)
    proto_apk = os.path.join(build_dir, "unaligned.apk")

    link_cmd = [
        aapt2, "link",
        "-o", proto_apk,
        "-I", android_jar,
        "--manifest", manifest_path,
        "--min-sdk-version", "24",
        "--target-sdk-version", "35",
        "--version-code", "1",
        "--version-name", "1.0.0",
        "-A", assets_dir,
        "--java", gen_dir,
        compiled_res
    ]
    run_cmd(link_cmd, cwd=build_dir)

    # 3. JAVAC Compile
    print("Compiling Java source code...")
    bin_classes = os.path.join(build_dir, "bin_classes")
    os.makedirs(bin_classes, exist_ok=True)

    r_java = os.path.join(gen_dir, "com", "educationistguru", "app", "R.java")
    main_java = os.path.join(src_dir, "MainActivity.java")

    javac_cmd = [
        javac,
        "-cp", android_jar,
        "-d", bin_classes,
        "--release", "8",
        r_java,
        main_java
    ]
    run_cmd(javac_cmd, cwd=build_dir, env=env)

    # 4. D8 Dexing
    print("Dexing bytecode into classes.dex with d8...")
    dex_dir = os.path.join(build_dir, "dex")
    os.makedirs(dex_dir, exist_ok=True)

    class_files = []
    for r_path, _, files in os.walk(bin_classes):
        for f in files:
            if f.endswith(".class"):
                class_files.append(os.path.join(r_path, f))

    d8_cmd = [d8, "--output", dex_dir, "--lib", android_jar] + class_files
    run_cmd(d8_cmd, cwd=build_dir, env=env, shell=True)

    # 5. Add classes.dex to APK
    print("Adding classes.dex into APK...")
    classes_dex = os.path.join(dex_dir, "classes.dex")
    with zipfile.ZipFile(proto_apk, "a", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(classes_dex, "classes.dex")

    # 6. Zipalign
    print("Aligning APK with zipalign...")
    aligned_apk = os.path.join(build_dir, "aligned.apk")
    run_cmd([zipalign, "-f", "-p", "4", proto_apk, aligned_apk], cwd=build_dir)

    # 7. Keystore & Sign
    keystore = os.path.join(build_dir, "debug.keystore")
    if not os.path.exists(keystore):
        print("Generating debug signing keystore...")
        kt_cmd = [
            keytool, "-genkeypair", "-v",
            "-keystore", keystore,
            "-alias", "androiddebugkey",
            "-keyalg", "RSA",
            "-keysize", "2048",
            "-validity", "10000",
            "-storepass", "android",
            "-keypass", "android",
            "-dname", "CN=EducationistGuru Debug,OU=App,O=EducationistGuru,C=IN"
        ]
        run_cmd(kt_cmd, cwd=build_dir, env=env)

    final_apk = os.path.join(root, "EducationistGuru.apk")
    print("Signing APK with apksigner...")
    sign_cmd = [
        apksigner, "sign",
        "--ks", keystore,
        "--ks-pass", "pass:android",
        "--key-pass", "pass:android",
        "--out", final_apk,
        aligned_apk
    ]
    run_cmd(sign_cmd, cwd=build_dir, env=env, shell=True)

    # 8. Verify
    print("Verifying signed APK...")
    verify_cmd = [apksigner, "verify", "--verbose", final_apk]
    out = run_cmd(verify_cmd, cwd=build_dir, env=env, shell=True)
    print("Verification output:\n", out)

    apk_size = os.path.getsize(final_apk) / (1024 * 1024)
    print(f"\n=======================================================")
    print(f"SUCCESS! Signed APK generated successfully:")
    print(f"File: {final_apk}")
    print(f"Size: {apk_size:.2f} MB")
    print(f"=======================================================\n")

if __name__ == "__main__":
    main()
