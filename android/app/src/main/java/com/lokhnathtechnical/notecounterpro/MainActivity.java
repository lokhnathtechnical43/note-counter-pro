package com.lokhnathtechnical.notecounterpro;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.lokhnathtechnical.notecounterpro.plugins.PremiumPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PremiumPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
