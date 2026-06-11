package com.lokhnathtechnical.notecounterpro;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.lokhnathtechnical.notecounterpro.plugins.PremiumPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PremiumPlugin.class);
        super.onCreate(savedInstanceState);

        // Make the app draw behind the status bar for edge-to-edge display
        // The web content uses env(safe-area-inset-top) to avoid overlap
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
    }
}
