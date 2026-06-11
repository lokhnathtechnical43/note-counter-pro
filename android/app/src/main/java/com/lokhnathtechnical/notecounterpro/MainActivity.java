package com.lokhnathtechnical.notecounterpro;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.lokhnathtechnical.notecounterpro.plugins.PremiumPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        try {
            registerPlugin(PremiumPlugin.class);
        } catch (Exception e) {
            // PremiumPlugin registration failed (e.g., no Google Play Services)
            // Continue without premium features
            android.util.Log.w("MainActivity", "PremiumPlugin registration skipped: " + e.getMessage());
        }
        super.onCreate(savedInstanceState);

        // Make the app draw behind the status bar for edge-to-edge display
        // The web content uses env(safe-area-inset-top) to avoid overlap
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Android 11+ (API 30+): Use WindowInsetsController
                getWindow().setDecorFitsSystemWindows(false);
            } else {
                // Legacy approach for older devices
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                );
            }
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "System UI flags setup skipped: " + e.getMessage());
        }
    }
}
