package com.andwati.orders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "paystack")
public record PaystackProperties(
        String secretKey,
        String publicKey,
        String callbackUrl,
        String webhookSecret,
        String apiBaseUrl
) {
    public String resolvedApiBaseUrl() {
        return hasText(apiBaseUrl) ? apiBaseUrl : "https://api.paystack.co";
    }

    public String resolvedWebhookSecret() {
        return hasText(webhookSecret) ? webhookSecret : secretKey;
    }

    public boolean hasSecretKey() {
        return hasText(secretKey);
    }

    public boolean hasCallbackUrl() {
        return hasText(callbackUrl);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
