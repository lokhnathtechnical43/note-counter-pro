package com.lokhnathtechnical.notecounterpro.plugins;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.ConsumeResponseListener;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(
    name = "PremiumPlugin",
    permissions = {}
)
public class PremiumPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "PremiumPlugin";
    private static final String PREMIUM_PRODUCT_ID = "note_counter_pro_premium";

    private BillingClient billingClient;
    private boolean isBillingReady = false;
    private PluginCall pendingPurchaseCall = null;
    private ProductDetails premiumProductDetails = null;

    @Override
    public void load() {
        super.load();
        setupBillingClient();
    }

    private void setupBillingClient() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases()
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    isBillingReady = true;
                    Log.d(TAG, "Billing client ready");
                    queryProductDetails();
                } else {
                    Log.e(TAG, "Billing setup failed: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                isBillingReady = false;
                Log.d(TAG, "Billing service disconnected");
            }
        });
    }

    private void queryProductDetails() {
        if (!isBillingReady) return;

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PREMIUM_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.INAPP)
                .build());

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && !productDetailsList.isEmpty()) {
                premiumProductDetails = productDetailsList.get(0);
                Log.d(TAG, "Premium product found: " + premiumProductDetails.getTitle());
            } else {
                Log.e(TAG, "Product details query failed: " + billingResult.getDebugMessage());
            }
        });
    }

    @PluginMethod
    public void isPremiumAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", premiumProductDetails != null);
        if (premiumProductDetails != null) {
            result.put("productId", premiumProductDetails.getProductId());
            result.put("title", premiumProductDetails.getTitle());
            result.put("description", premiumProductDetails.getDescription());
            // Get price info
            if (premiumProductDetails.getOneTimePurchaseOfferDetails() != null) {
                result.put("price", premiumProductDetails.getOneTimePurchaseOfferDetails().getFormattedPrice());
                result.put("currency", premiumProductDetails.getOneTimePurchaseOfferDetails().getPriceCurrencyCode());
            }
        }
        call.resolve(result);
    }

    @PluginMethod
    public void purchasePremium(PluginCall call) {
        if (!isBillingReady) {
            call.reject("Billing not ready. Please try again.");
            return;
        }

        if (premiumProductDetails == null) {
            call.reject("Premium product not available");
            return;
        }

        pendingPurchaseCall = call;

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            pendingPurchaseCall = null;
            return;
        }

        BillingFlowParams.ProductDetailsParams productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(premiumProductDetails)
                .build();

        BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(List.of(productDetailsParams))
                .build();

        BillingResult billingResult = billingClient.launchBillingFlow(activity, billingFlowParams);

        if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            call.reject("Billing flow failed: " + billingResult.getDebugMessage());
            pendingPurchaseCall = null;
        }
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase cancelled");
                pendingPurchaseCall = null;
            }
        } else {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase failed: " + billingResult.getDebugMessage());
                pendingPurchaseCall = null;
            }
        }
    }

    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            // Acknowledge the purchase by consuming it (for one-time purchase)
            ConsumeParams consumeParams = ConsumeParams.newBuilder()
                    .setPurchaseToken(purchase.getPurchaseToken())
                    .build();

            billingClient.consumeAsync(consumeParams, (billingResult, purchaseToken) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    if (pendingPurchaseCall != null) {
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("productId", purchase.getProducts().get(0));
                        pendingPurchaseCall.resolve(result);
                        pendingPurchaseCall = null;
                    }
                } else {
                    if (pendingPurchaseCall != null) {
                        pendingPurchaseCall.reject("Consume failed: " + billingResult.getDebugMessage());
                        pendingPurchaseCall = null;
                    }
                }
            });
        } else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase is pending");
                pendingPurchaseCall = null;
            }
        }
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        if (!isBillingReady) {
            call.reject("Billing not ready");
            return;
        }

        billingClient.queryPurchasesAsync(QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build(), (billingResult, purchases) -> {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        boolean found = false;
                        for (Purchase purchase : purchases) {
                            if (purchase.getProducts().contains(PREMIUM_PRODUCT_ID)
                                    && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                found = true;
                                break;
                            }
                        }
                        JSObject result = new JSObject();
                        result.put("restored", found);
                        call.resolve(result);
                    } else {
                        call.reject("Failed to query purchases: " + billingResult.getDebugMessage());
                    }
                });
    }
}
