package com.pos.backend.util;

import java.math.BigDecimal;
import java.util.Map;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.request.POS.CreateOrderItemAddonRequest;
import com.pos.backend.dto.request.POS.CreateOrderItemRequest;
import com.pos.backend.dto.request.POS.CreateOrderRequest;
import com.pos.backend.entity.Addon;
import com.pos.backend.entity.Item;
import com.pos.backend.entity.ItemVariation;
import com.pos.backend.exception.AppException;

public class POS {

    public static BigDecimal calculator(CreateOrderRequest request, Map<Long, Item> itemMap,
            Map<Long, ItemVariation> variationMap,
            Map<Long, Addon> addonMap, String type) {
        BigDecimal subTotal = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        for (CreateOrderItemRequest itemReq : request.getItems()) {
            Item item = itemMap.get(itemReq.getItemId());
            BigDecimal itemPrice = BigDecimal.ZERO;
            if (item == null) {
                throw new AppException(ErrorCode.ITEM_NOT_FOUND);
            }
            itemPrice = item.getPrice();

            if (itemReq.getVariationId() != null) {
                ItemVariation variation = variationMap.get(itemReq.getVariationId());
                if (variation == null) {
                    throw new AppException(ErrorCode.INVALID_VARIATION_OR_ADDON_DATA);
                }

                if (!variation.getItem().getId().equals(item.getId())) {
                    throw new AppException(ErrorCode.INVALID_VARIATION_OR_ADDON_DATA);
                }

                itemPrice = variation.getPrice();
            }

            if (itemReq.getAddons() != null && !itemReq.getAddons().isEmpty()) {
                for (CreateOrderItemAddonRequest addon : itemReq.getAddons()) {
                    Addon addonEntity = addonMap.get(addon.getAddonId());
                    if (addonEntity == null) {
                        throw new AppException(ErrorCode.ADDON_NOT_FOUND);
                    }

                    if (!addonEntity.getItem().getId().equals(item.getId())) {
                        throw new AppException(ErrorCode.INVALID_VARIATION_OR_ADDON_DATA);
                    }

                    itemPrice = itemPrice.add(addonEntity.getPrice().multiply(BigDecimal.valueOf(addon.getQuantity())));
                }
            }

            itemPrice = itemPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            subTotal = subTotal.add(itemPrice);
            taxAmount = taxAmount
                    .add(itemPrice.multiply(item.getTax() != null ? item.getTax().getTaxRate() : BigDecimal.ZERO)
                            .divide(BigDecimal.valueOf(100)));
        }
        return type.equals("sub_total") ? subTotal : taxAmount;
    }

    public static BigDecimal calSubTotal(CreateOrderRequest request, Map<Long, Item> itemMap,
            Map<Long, ItemVariation> variationMap,
            Map<Long, Addon> addonMap) {

        return calculator(request, itemMap, variationMap, addonMap, "sub_total");
    }

    public static BigDecimal getTaxAmount(CreateOrderRequest request, Map<Long, Item> itemMap,
            Map<Long, ItemVariation> variationMap,
            Map<Long, Addon> addonMap) {

        return calculator(request, itemMap, variationMap, addonMap, "tax_amount");
    }
}
