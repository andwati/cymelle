package com.andwati.orders.services;

import com.andwati.orders.config.PaystackProperties;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class PaystackClient {

    private final PaystackProperties paystackProperties;
    private final RestClient restClient;

    public PaystackClient(PaystackProperties paystackProperties, RestClient.Builder restClientBuilder) {
        this.paystackProperties = paystackProperties;
        this.restClient = restClientBuilder
                .baseUrl(paystackProperties.resolvedApiBaseUrl())
                .build();
    }

    public JsonNode initializeTransaction(
            String email,
            long amountSubunits,
            String currency,
            String reference,
            Map<String, Object> metadata
    ) {
        assertConfigured();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("amount", String.valueOf(amountSubunits));
        body.put("currency", currency);
        body.put("reference", reference);
        body.put("metadata", metadata);

        if (paystackProperties.hasCallbackUrl()) {
            body.put("callback_url", paystackProperties.callbackUrl());
        }

        JsonNode response = restClient.post()
                .uri("/transaction/initialize")
                .headers(headers -> headers.setBearerAuth(paystackProperties.secretKey()))
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        assertSuccessful(response, "Paystack transaction initialization failed");
        return response.path("data");
    }

    public JsonNode verifyTransaction(String reference) {
        assertConfigured();

        JsonNode response = restClient.get()
                .uri("/transaction/verify/{reference}", reference)
                .headers(headers -> headers.setBearerAuth(paystackProperties.secretKey()))
                .retrieve()
                .body(JsonNode.class);

        assertSuccessful(response, "Paystack transaction verification failed");
        return response;
    }

    private void assertConfigured() {
        if (!paystackProperties.hasSecretKey()) {
            throw new IllegalStateException("PAYSTACK_SECRET_KEY is not configured");
        }
    }

    private void assertSuccessful(JsonNode response, String fallbackMessage) {
        if (response == null || !response.path("status").asBoolean(false)) {
            String message = response == null ? fallbackMessage : response.path("message").asText(fallbackMessage);
            throw new IllegalStateException(message);
        }
    }
}
